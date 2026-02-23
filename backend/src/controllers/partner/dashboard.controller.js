import mongoose from "mongoose";
import Booking from "../../models/Booking.model.js";
import Review from "../../models/Review.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/dashboard
 */
export const getPartnerDashboard = async (req, res) => {
	try {
		const partnerIdStr = req.user.partnerId;
		// Convert to ObjectId for aggregation queries
		const partnerId = new mongoose.Types.ObjectId(partnerIdStr);
		const now = new Date();
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);
		const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
		const todayDateStr = todayStart.toISOString().split("T")[0];
		const yesterdayDateStr = yesterdayStart.toISOString().split("T")[0];

		// Statuses that count as revenue-generating (service completed)
		const revenueStatuses = ["completed", "delivered"];

		const todayEndDate = new Date(todayStart);
		todayEndDate.setHours(23, 59, 59, 999);
		const yesterdayEndDate = new Date(yesterdayStart);
		yesterdayEndDate.setHours(23, 59, 59, 999);

		const [
			todayBookings,
			yesterdayBookings,
			todayRevenue,
			yesterdayRevenue,
			upcomingBookingsCount,
			allReviews,
			upcomingSchedule,
			recentBookings,
		] = await Promise.all([
			Booking.countDocuments({
				partnerId,
				slotDate: todayDateStr,
				status: { $ne: "cancelled" },
			}),
			Booking.countDocuments({
				partnerId,
				slotDate: yesterdayDateStr,
				status: { $ne: "cancelled" },
			}),
			Booking.aggregate([
				{
					$match: {
						partnerId,
						status: { $in: revenueStatuses },
						completedAt: { $gte: todayStart, $lte: todayEndDate },
					},
				},
				{ $group: { _id: null, total: { $sum: "$pricing.finalPrice" } } },
			]),
			Booking.aggregate([
				{
					$match: {
						partnerId,
						status: { $in: revenueStatuses },
						completedAt: { $gte: yesterdayStart, $lte: yesterdayEndDate },
					},
				},
				{ $group: { _id: null, total: { $sum: "$pricing.finalPrice" } } },
			]),
			// Count bookings with status "booked" from today onwards
			Booking.countDocuments({
				partnerId,
				status: "booked",
				slotDate: { $gte: todayDateStr },
			}),
			Review.find({ partnerId }).select("rating"),
			// Fetch upcoming bookings: from today onwards, exclude completed/delivered/cancelled
			// Sort by date and time to show the most relevant ones first
			Booking.find({
				partnerId,
				slotDate: { $gte: todayDateStr },
				status: { $nin: ["completed", "delivered", "cancelled"] },
			})
				.populate("customerId", "name")
				.populate("serviceId", "name")
				.sort({ slotDate: 1, slotStartTime: 1 })
				.limit(10),
			Booking.find({ partnerId })
				.sort({ createdAt: -1 })
				.populate("customerId", "name")
				.populate("serviceId", "name")
				.limit(5),
		]);

		const avgRating =
			allReviews.length > 0
				? +(
						allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
					).toFixed(1)
				: 0;

		const todayRev = todayRevenue[0]?.total ?? 0;
		const yestRev = yesterdayRevenue[0]?.total ?? 0;
		// Revenue growth: percentage change from yesterday
		const revenueGrowth =
			yestRev > 0
				? +(((todayRev - yestRev) / yestRev) * 100).toFixed(1)
				: todayRev > 0
					? 100
					: 0;
		// Booking growth: always show the difference (not just when yesterdayBookings > 0)
		const bookingGrowth = todayBookings - yesterdayBookings;

		// Last 7 days trend
		const days = [];
		const dayRanges = [];
		for (let i = 6; i >= 0; i--) {
			const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
			const dayEnd = new Date(dayStart);
			dayEnd.setHours(23, 59, 59, 999);
			const dateStr = dayStart.toISOString().split("T")[0];
			days.push(dateStr);
			dayRanges.push({ dateStr, start: dayStart, end: dayEnd });
		}

		// For revenue trend, use completedAt date
		// For bookings trend, use slotDate (when booking was scheduled)
		const revenueTrendPromises = dayRanges.map(({ dateStr, start, end }) =>
			Booking.aggregate([
				{
					$match: {
						partnerId,
						status: { $in: revenueStatuses },
						completedAt: { $gte: start, $lte: end },
					},
				},
				{
					$group: { _id: null, total: { $sum: "$pricing.finalPrice" } },
				},
			]).then((result) => ({ dateStr, total: result[0]?.total ?? 0 })),
		);

		const bookingsTrend = await Booking.aggregate([
			{
				$match: {
					partnerId,
					slotDate: { $in: days },
					status: { $ne: "cancelled" },
				},
			},
			{ $group: { _id: "$slotDate", count: { $sum: 1 } } },
		]);

		const revenueTrend = await Promise.all(revenueTrendPromises);

		const revMap = Object.fromEntries(
			revenueTrend.map((r) => [r.dateStr, r.total]),
		);
		const bkMap = Object.fromEntries(
			bookingsTrend.map((b) => [b._id, b.count]),
		);

		const revenueChartData = days.map((d) => ({
			date: d,
			value: revMap[d] ?? 0,
		}));
		const bookingsChartData = days.map((d) => ({
			date: d,
			value: bkMap[d] ?? 0,
		}));

		// Determine if we have bookings for today
		const hasTodayBookings = upcomingSchedule.some(
			(b) => b.slotDate === todayDateStr,
		);

		return success(res, {
			stats: {
				todayBookings,
				bookingGrowth,
				revenueToday: todayRev,
				revenueGrowth,
				averageRating: avgRating,
				totalReviews: allReviews.length,
				upcomingBookings: upcomingBookingsCount,
			},
			revenueChartData,
			bookingsChartData,
			// Renamed from todaySchedule to upcomingSchedule with more fields
			upcomingSchedule: upcomingSchedule.map((b) => ({
				id: b._id,
				bookingNumber: b.bookingNumber,
				date: b.slotDate,
				startTime: b.slotStartTime ?? "",
				endTime: b.slotEndTime ?? "",
				customer: b.customerId?.name ?? "Unknown",
				serviceName: b.serviceName ?? b.serviceId?.name ?? "Service",
				serviceType: b.serviceType ?? "book_me",
				serviceCategory: b.serviceCategory ?? "wash",
				status: b.status,
				vehicle: b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : "",
				pricing: {
					finalPrice: b.pricing?.finalPrice ?? 0,
				},
			})),
			// Flag to help frontend know if there are today bookings
			hasTodayBookings,
			recentActivity: recentBookings.map((b) => ({
				id: b._id,
				bookingNumber: b.bookingNumber,
				type: "booking",
				customerName: b.customerId?.name ?? "Customer",
				serviceName: b.serviceName ?? b.serviceId?.name ?? "Service",
				serviceType: b.serviceType ?? "book_me",
				serviceCategory: b.serviceCategory ?? "wash",
				slotDate: b.slotDate,
				slotStartTime: b.slotStartTime,
				slotEndTime: b.slotEndTime,
				time: b.createdAt,
				status: b.status,
				pricing: {
					finalPrice: b.pricing?.finalPrice ?? 0,
				},
			})),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};
