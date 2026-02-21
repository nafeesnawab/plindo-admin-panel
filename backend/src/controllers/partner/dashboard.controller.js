import Booking from "../../models/Booking.model.js";
import Review from "../../models/Review.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/dashboard
 */
export const getPartnerDashboard = async (req, res) => {
	try {
		const partnerId = req.user.partnerId;
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
		const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

		const [
			todayBookings,
			yesterdayBookings,
			todayRevenue,
			yesterdayRevenue,
			upcomingBookings,
			allReviews,
			todaySchedule,
			recentBookings,
		] = await Promise.all([
			Booking.countDocuments({ partnerId, slotDate: todayStart.toISOString().split("T")[0], status: { $ne: "cancelled" } }),
			Booking.countDocuments({ partnerId, slotDate: yesterdayStart.toISOString().split("T")[0], status: { $ne: "cancelled" } }),
			Booking.aggregate([
				{ $match: { partnerId, slotDate: todayStart.toISOString().split("T")[0], status: { $in: ["completed", "in_progress"] } } },
				{ $group: { _id: null, total: { $sum: "$pricing.finalPrice" } } },
			]),
			Booking.aggregate([
				{ $match: { partnerId, slotDate: yesterdayStart.toISOString().split("T")[0], status: { $in: ["completed", "in_progress"] } } },
				{ $group: { _id: null, total: { $sum: "$pricing.finalPrice" } } },
			]),
			Booking.countDocuments({ partnerId, status: "booked" }),
			Review.find({ partnerId }).select("rating"),
			Booking.find({
				partnerId,
				slotDate: todayStart.toISOString().split("T")[0],
				status: { $ne: "cancelled" },
			})
				.populate("customerId", "name")
				.populate("serviceId", "name")
				.sort({ slotStartTime: 1 })
				.limit(10),
			Booking.find({ partnerId })
				.sort({ createdAt: -1 })
				.populate("customerId", "name")
				.populate("serviceId", "name")
				.limit(5),
		]);

		const avgRating =
			allReviews.length > 0
				? +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
				: 0;

		const todayRev = todayRevenue[0]?.total ?? 0;
		const yestRev = yesterdayRevenue[0]?.total ?? 0;
		const revenueGrowth = yestRev > 0 ? +(((todayRev - yestRev) / yestRev) * 100).toFixed(1) : 0;
		const bookingGrowth = yesterdayBookings > 0 ? todayBookings - yesterdayBookings : 0;

		// Last 7 days trend
		const days = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
			days.push(d.toISOString().split("T")[0]);
		}

		const [revenueTrend, bookingsTrend] = await Promise.all([
			Booking.aggregate([
				{ $match: { partnerId, slotDate: { $in: days }, status: "completed" } },
				{ $group: { _id: "$slotDate", total: { $sum: "$pricing.finalPrice" } } },
			]),
			Booking.aggregate([
				{ $match: { partnerId, slotDate: { $in: days }, status: { $ne: "cancelled" } } },
				{ $group: { _id: "$slotDate", count: { $sum: 1 } } },
			]),
		]);

		const revMap = Object.fromEntries(revenueTrend.map((r) => [r._id, r.total]));
		const bkMap = Object.fromEntries(bookingsTrend.map((b) => [b._id, b.count]));

		const revenueChartData = days.map((d) => ({ date: d, value: revMap[d] ?? 0 }));
		const bookingsChartData = days.map((d) => ({ date: d, value: bkMap[d] ?? 0 }));

		return success(res, {
			stats: {
				todayBookings,
				bookingGrowth,
				revenueToday: todayRev,
				revenueGrowth,
				averageRating: avgRating,
				totalReviews: allReviews.length,
				upcomingBookings,
			},
			revenueChartData,
			bookingsChartData,
			todaySchedule: todaySchedule.map((b) => ({
				id: b._id,
				time: b.slotStartTime ?? "",
				customer: b.customerId?.name ?? "Unknown",
				service: b.serviceId?.name ?? "Service",
				status: b.status,
				vehicle: b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : "",
			})),
			recentActivity: recentBookings.map((b) => ({
				id: b._id,
				type: "booking",
				message: `Booking from ${b.customerId?.name ?? "customer"} — ${b.serviceId?.name ?? "service"}`,
				time: b.createdAt,
				status: b.status,
			})),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};
