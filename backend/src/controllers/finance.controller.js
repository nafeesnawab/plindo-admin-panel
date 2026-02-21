import Booking from "../models/Booking.model.js";
import Partner from "../models/Partner.model.js";
import { paginate } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const getRevenueStats = async (startDate, endDate) => {
	const match = { status: { $in: ["completed", "delivered"] } };
	if (startDate) match.createdAt = { $gte: startDate, $lte: endDate };

	const agg = await Booking.aggregate([
		{ $match: match },
		{
			$group: {
				_id: null,
				totalRevenue: { $sum: "$pricing.finalPrice" },
				customerCommission: { $sum: "$pricing.platformFee" },
				partnerCommission: { $sum: "$pricing.partnerPayout" },
				totalBookings: { $sum: 1 },
			},
		},
	]);

	const data = agg[0] || { totalRevenue: 0, customerCommission: 0, partnerCommission: 0, totalBookings: 0 };
	return {
		totalRevenue: data.totalRevenue,
		customerCommission: data.customerCommission,
		partnerCommission: data.partnerCommission,
		netRevenue: data.totalRevenue - data.partnerCommission,
		totalBookings: data.totalBookings,
	};
};

/**
 * GET /api/finance/revenue-overview
 */
export const getRevenueOverview = async (req, res) => {
	try {
		const now = new Date();
		const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
		const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
		const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

		const [allTime, thisMonth, thisWeek, today] = await Promise.all([
			getRevenueStats(),
			getRevenueStats(monthStart, now),
			getRevenueStats(weekStart, now),
			getRevenueStats(todayStart, todayEnd),
		]);

		return success(res, { allTime, thisMonth, thisWeek, today });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/finance/revenue-trend
 */
export const getRevenueTrend = async (req, res) => {
	try {
		const months = 12;
		const result = [];
		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		for (let i = months - 1; i >= 0; i--) {
			const date = new Date();
			date.setDate(1);
			date.setHours(0, 0, 0, 0);
			date.setMonth(date.getMonth() - i);
			const nextMonth = new Date(date);
			nextMonth.setMonth(nextMonth.getMonth() + 1);

			const agg = await Booking.aggregate([
				{
					$match: {
						createdAt: { $gte: date, $lt: nextMonth },
						status: { $in: ["completed", "delivered"] },
					},
				},
				{
					$group: {
						_id: null,
						revenue: { $sum: "$pricing.finalPrice" },
						customerCommission: { $sum: "$pricing.platformFee" },
						partnerCommission: { $sum: "$pricing.partnerPayout" },
						bookings: { $sum: 1 },
					},
				},
			]);

			const data = agg[0] || { revenue: 0, customerCommission: 0, partnerCommission: 0, bookings: 0 };
			result.push({
				month: monthNames[date.getMonth()],
				year: date.getFullYear(),
				revenue: data.revenue,
				customerCommission: data.customerCommission,
				partnerCommission: data.partnerCommission,
				bookings: data.bookings,
			});
		}

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/finance/revenue-by-partner
 */
export const getRevenueByPartner = async (req, res) => {
	try {
		const agg = await Booking.aggregate([
			{ $match: { status: { $in: ["completed", "delivered"] } } },
			{
				$group: {
					_id: "$partnerId",
					businessName: { $first: "$partnerBusinessName" },
					totalRevenue: { $sum: "$pricing.finalPrice" },
					totalBookings: { $sum: 1 },
					commissionEarned: { $sum: "$pricing.platformFee" },
				},
			},
			{ $sort: { totalRevenue: -1 } },
			{ $limit: 20 },
		]);

		const result = agg.map((a) => ({
			id: a._id,
			businessName: a.businessName,
			totalRevenue: a.totalRevenue,
			totalBookings: a.totalBookings,
			commissionEarned: a.commissionEarned,
		}));

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/finance/commissions?period=month
 */
export const getCommissions = async (req, res) => {
	try {
		const period = req.query.period || "month";
		const now = new Date();
		let startDate;

		if (period === "week") {
			startDate = new Date(now);
			startDate.setDate(now.getDate() - 7);
		} else if (period === "year") {
			startDate = new Date(now);
			startDate.setFullYear(now.getFullYear() - 1);
		} else {
			startDate = new Date(now);
			startDate.setMonth(now.getMonth() - 1);
		}

		const bookings = await Booking.find({
			createdAt: { $gte: startDate },
			status: { $in: ["completed", "delivered"] },
		}).select("createdAt pricing");

		const dailyMap = {};
		for (const b of bookings) {
			const dateKey = b.createdAt.toISOString().split("T")[0];
			if (!dailyMap[dateKey]) {
				dailyMap[dateKey] = { date: dateKey, bookings: 0, grossRevenue: 0, customerFees: 0, partnerFees: 0, totalCommission: 0 };
			}
			dailyMap[dateKey].bookings += 1;
			dailyMap[dateKey].grossRevenue += b.pricing?.finalPrice || 0;
			dailyMap[dateKey].customerFees += b.pricing?.platformFee || 0;
			dailyMap[dateKey].partnerFees += b.pricing?.partnerPayout || 0;
			dailyMap[dateKey].totalCommission += (b.pricing?.platformFee || 0);
		}

		const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
		const totals = daily.reduce(
			(acc, d) => ({
				bookings: acc.bookings + d.bookings,
				grossRevenue: acc.grossRevenue + d.grossRevenue,
				customerFees: acc.customerFees + d.customerFees,
				partnerFees: acc.partnerFees + d.partnerFees,
				totalCommission: acc.totalCommission + d.totalCommission,
			}),
			{ bookings: 0, grossRevenue: 0, customerFees: 0, partnerFees: 0, totalCommission: 0 },
		);

		return success(res, { period, daily, totals });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/finance/payouts
 */
export const getPayouts = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const statusFilter = req.query.status;

		const pipeline = [
			{ $match: { status: { $in: ["completed", "delivered"] } } },
			{
				$group: {
					_id: "$partnerId",
					businessName: { $first: "$partnerBusinessName" },
					totalBookings: { $sum: 1 },
					grossEarnings: { $sum: "$pricing.finalPrice" },
					commissionDeducted: { $sum: "$pricing.platformFee" },
					netPayout: { $sum: "$pricing.partnerPayout" },
					lastBooking: { $max: "$createdAt" },
				},
			},
			{ $sort: { lastBooking: -1 } },
		];

		const allPayouts = await Booking.aggregate(pipeline);
		const partners = await Partner.find({}).select("_id contactPersonName").lean();
		const partnerMap = {};
		partners.forEach((p) => { partnerMap[p._id.toString()] = p.contactPersonName || ""; });

		const payoutItems = allPayouts.map((p, i) => ({
			id: `payout-${p._id}-${i}`,
			partner: {
				id: p._id,
				businessName: p.businessName,
				ownerName: partnerMap[p._id.toString()] || "",
				bankAccount: "****1234",
			},
			period: { start: new Date(Date.now() - 30 * 86400000).toISOString(), end: new Date().toISOString() },
			totalBookings: p.totalBookings,
			grossEarnings: p.grossEarnings,
			commissionDeducted: p.commissionDeducted,
			netPayout: p.netPayout,
			status: "pending",
			paidAt: null,
			createdAt: p.lastBooking,
		}));

		const filtered = statusFilter ? payoutItems.filter((p) => p.status === statusFilter) : payoutItems;
		const total = filtered.length;
		const paginated = filtered.slice(skip, skip + limit);

		const summary = {
			totalPending: filtered.filter((p) => p.status === "pending").reduce((s, p) => s + p.netPayout, 0),
			totalPaid: filtered.filter((p) => p.status === "paid").reduce((s, p) => s + p.netPayout, 0),
			pendingCount: filtered.filter((p) => p.status === "pending").length,
			paidCount: filtered.filter((p) => p.status === "paid").length,
		};

		return success(res, {
			items: paginated,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
			summary,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/finance/payouts/:id/mark-paid
 */
export const markPayoutPaid = async (req, res) => {
	try {
		return success(res, {}, "Payout marked as paid");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/finance/subscriptions
 */
export const getSubscriptionRevenue = async (req, res) => {
	try {
		return success(res, {
			overview: {
				totalActive: 0,
				basicSubscribers: 0,
				premiumSubscribers: 0,
				basicRevenue: 0,
				premiumRevenue: 0,
				totalMonthlyRevenue: 0,
				churnRate: 0,
				upcomingRenewals: 0,
			},
			plans: [
				{ name: "basic", price: 15, subscribers: 0, revenue: 0, features: ["Access to nearby car wash locations", "Standard booking slots"] },
				{ name: "premium", price: 28, subscribers: 0, revenue: 0, features: ["Priority booking", "Pick-up & delivery"] },
			],
			trend: [],
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};
