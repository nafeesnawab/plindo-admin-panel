import Booking from "../../models/Booking.model.js";
import { paginate } from "../../utils/pagination.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/earnings/overview
 */
export const getOverview = async (req, res) => {
	try {
		const partnerId = req.user.partnerId;
		const now = new Date();
		const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
		const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
		const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

		const match = { partnerId, status: { $in: ["completed", "delivered"] } };

		const [allTime, thisMonth, thisWeek, today] = await Promise.all([
			Booking.aggregate([{ $match: match }, { $group: { _id: null, net: { $sum: "$pricing.partnerPayout" }, gross: { $sum: "$pricing.finalPrice" }, commission: { $sum: "$pricing.platformFee" } } }]),
			Booking.aggregate([{ $match: { ...match, createdAt: { $gte: monthStart } } }, { $group: { _id: null, net: { $sum: "$pricing.partnerPayout" }, gross: { $sum: "$pricing.finalPrice" }, commission: { $sum: "$pricing.platformFee" } } }]),
			Booking.aggregate([{ $match: { ...match, createdAt: { $gte: weekStart } } }, { $group: { _id: null, net: { $sum: "$pricing.partnerPayout" } } }]),
			Booking.aggregate([{ $match: { ...match, createdAt: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id: null, net: { $sum: "$pricing.partnerPayout" } } }]),
		]);

		return success(res, {
			earnings: {
				total: allTime[0]?.net || 0,
				thisMonth: thisMonth[0]?.net || 0,
				thisWeek: thisWeek[0]?.net || 0,
				today: today[0]?.net || 0,
				grossRevenue: thisMonth[0]?.gross || 0,
				commission: thisMonth[0]?.commission || 0,
				netEarnings: thisMonth[0]?.net || 0,
				pendingPayout: thisMonth[0]?.net || 0,
				nextPayoutDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0],
			},
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/earnings/transactions
 */
export const getTransactions = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const partnerId = req.user.partnerId;

		const [items, total] = await Promise.all([
			Booking.find({ partnerId, status: { $in: ["completed", "delivered"] } })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.select("slotDate bookingNumber customerName serviceName pricing createdAt"),
			Booking.countDocuments({ partnerId, status: { $in: ["completed", "delivered"] } }),
		]);

		const transactions = items.map((b) => ({
			id: b._id,
			date: b.slotDate || b.createdAt.toISOString().split("T")[0],
			bookingId: b.bookingNumber,
			customer: b.customerName,
			service: b.serviceName,
			grossAmount: b.pricing?.finalPrice || 0,
			commission: b.pricing?.platformFee || 0,
			netAmount: b.pricing?.partnerPayout || 0,
		}));

		return success(res, {
			transactions,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/earnings/payouts
 */
export const getPayouts = async (req, res) => {
	try {
		const partnerId = req.user.partnerId;
		const agg = await Booking.aggregate([
			{ $match: { partnerId, status: { $in: ["completed", "delivered"] } } },
			{
				$group: {
					_id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
					totalBookings: { $sum: 1 },
					grossEarnings: { $sum: "$pricing.finalPrice" },
					commission: { $sum: "$pricing.platformFee" },
					netAmount: { $sum: "$pricing.partnerPayout" },
				},
			},
			{ $sort: { "_id.year": -1, "_id.month": -1 } },
		]);

		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const payouts = agg.map((p, i) => ({
			id: `PAY-${partnerId}-${i + 1}`,
			payoutDate: new Date(p._id.year, p._id.month, 0).toISOString().split("T")[0],
			period: `${monthNames[p._id.month - 1]} ${p._id.year}`,
			totalBookings: p.totalBookings,
			grossEarnings: p.grossEarnings,
			commission: p.commission,
			netAmount: p.netAmount,
			status: "completed",
		}));

		return success(res, { payouts });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/earnings/chart?period=month
 */
export const getChart = async (req, res) => {
	try {
		const partnerId = req.user.partnerId;
		const period = req.query.period || "month";
		const labels = [];
		const values = [];

		if (period === "month") {
			for (let i = 5; i >= 0; i--) {
				const date = new Date();
				date.setDate(1);
				date.setHours(0, 0, 0, 0);
				date.setMonth(date.getMonth() - i);
				const nextMonth = new Date(date);
				nextMonth.setMonth(nextMonth.getMonth() + 1);

				const agg = await Booking.aggregate([
					{ $match: { partnerId, status: { $in: ["completed", "delivered"] }, createdAt: { $gte: date, $lt: nextMonth } } },
					{ $group: { _id: null, net: { $sum: "$pricing.partnerPayout" } } },
				]);

				labels.push(date.toLocaleDateString("en-US", { month: "short" }));
				values.push(agg[0]?.net || 0);
			}
		} else {
			for (let i = 6; i >= 0; i--) {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				date.setDate(date.getDate() - i);
				const nextDay = new Date(date);
				nextDay.setDate(nextDay.getDate() + 1);

				const agg = await Booking.aggregate([
					{ $match: { partnerId, status: { $in: ["completed", "delivered"] }, createdAt: { $gte: date, $lt: nextDay } } },
					{ $group: { _id: null, net: { $sum: "$pricing.partnerPayout" } } },
				]);

				labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
				values.push(agg[0]?.net || 0);
			}
		}

		return success(res, { labels, values });
	} catch (err) {
		return error(res, err.message, 500);
	}
};
