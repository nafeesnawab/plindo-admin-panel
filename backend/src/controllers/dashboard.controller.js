import Booking from "../models/Booking.model.js";
import Customer from "../models/Customer.model.js";
import Partner from "../models/Partner.model.js";
import { error, success } from "../utils/response.js";

/**
 * GET /api/dashboard/stats
 */
export const getStats = async (req, res) => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const [activeUsers, pendingPartners, bookingStats] = await Promise.all([
			Customer.countDocuments({ status: "active" }),
			Partner.countDocuments({ status: "pending" }),
			Booking.aggregate([
				{ $match: { createdAt: { $gte: today, $lt: tomorrow } } },
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
						revenue: { $sum: "$pricing.finalPrice" },
					},
				},
			]),
		]);

		const bookingsByStatus = {};
		let revenueToday = 0;
		bookingStats.forEach((s) => {
			bookingsByStatus[s._id] = s.count;
			if (s._id === "completed" || s._id === "delivered") {
				revenueToday += s.revenue || 0;
			}
		});

		const totalToday =
			(bookingsByStatus.booked || 0) +
			(bookingsByStatus.in_progress || 0) +
			(bookingsByStatus.completed || 0) +
			(bookingsByStatus.delivered || 0) +
			(bookingsByStatus.cancelled || 0);

		return success(res, {
			activeUsers,
			bookingsToday: {
				total: totalToday,
				booked: bookingsByStatus.booked || 0,
				inProgress: bookingsByStatus.in_progress || 0,
				completed: bookingsByStatus.completed || 0,
				delivered: bookingsByStatus.delivered || 0,
				cancelled: bookingsByStatus.cancelled || 0,
			},
			revenueToday,
			pendingPartnerApplications: pendingPartners,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/dashboard/bookings-trend?days=7
 */
export const getBookingsTrend = async (req, res) => {
	try {
		const days = parseInt(req.query.days) || 7;
		const result = [];

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date();
			date.setHours(0, 0, 0, 0);
			date.setDate(date.getDate() - i);
			const nextDate = new Date(date);
			nextDate.setDate(nextDate.getDate() + 1);

			const count = await Booking.countDocuments({
				createdAt: { $gte: date, $lt: nextDate },
			});

			result.push({
				date: date.toISOString().split("T")[0],
				value: count,
			});
		}

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/dashboard/revenue-trend?days=7
 */
export const getRevenueTrend = async (req, res) => {
	try {
		const days = parseInt(req.query.days) || 7;
		const result = [];

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date();
			date.setHours(0, 0, 0, 0);
			date.setDate(date.getDate() - i);
			const nextDate = new Date(date);
			nextDate.setDate(nextDate.getDate() + 1);

			const agg = await Booking.aggregate([
				{
					$match: {
						createdAt: { $gte: date, $lt: nextDate },
						status: { $in: ["completed", "delivered"] },
					},
				},
				{ $group: { _id: null, total: { $sum: "$pricing.finalPrice" } } },
			]);

			result.push({
				date: date.toISOString().split("T")[0],
				value: agg[0]?.total || 0,
			});
		}

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/dashboard/user-growth
 */
export const getUserGrowth = async (req, res) => {
	try {
		const result = [];
		for (let i = 11; i >= 0; i--) {
			const date = new Date();
			date.setDate(1);
			date.setHours(0, 0, 0, 0);
			date.setMonth(date.getMonth() - i);
			const nextMonth = new Date(date);
			nextMonth.setMonth(nextMonth.getMonth() + 1);

			const count = await Customer.countDocuments({
				createdAt: { $gte: date, $lt: nextMonth },
			});

			result.push({
				date: date.toISOString().split("T")[0],
				value: count,
			});
		}

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/dashboard/recent-bookings
 */
export const getRecentBookings = async (req, res) => {
	try {
		const bookings = await Booking.find()
			.sort({ createdAt: -1 })
			.limit(10)
			.select("bookingNumber customerName partnerBusinessName serviceName pricing.finalPrice status createdAt");

		const result = bookings.map((b) => ({
			id: b._id,
			bookingNumber: b.bookingNumber,
			customerName: b.customerName,
			partnerName: b.partnerBusinessName,
			service: b.serviceName,
			amount: b.pricing?.finalPrice || 0,
			status: b.status,
			createdAt: b.createdAt,
		}));

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/dashboard/recent-partner-applications
 */
export const getRecentPartnerApplications = async (req, res) => {
	try {
		const partners = await Partner.find({ status: "pending" })
			.sort({ appliedAt: -1 })
			.limit(10)
			.select("contactPersonName businessName email phone location status appliedAt");

		const result = partners.map((p) => ({
			id: p._id,
			name: p.contactPersonName,
			businessName: p.businessName,
			email: p.email,
			phone: p.phone,
			location: p.location,
			status: p.status,
			appliedAt: p.appliedAt,
		}));

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/dashboard/recent-users
 */
export const getRecentUsers = async (req, res) => {
	try {
		const customers = await Customer.find()
			.sort({ createdAt: -1 })
			.limit(10)
			.select("name email avatar createdAt");

		const result = customers.map((c) => ({
			id: c._id,
			name: c.name,
			email: c.email,
			avatar: c.avatar || "",
			registeredAt: c.createdAt,
		}));

		return success(res, result);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
