import ActivityLog from "../models/ActivityLog.model.js";
import Booking from "../models/Booking.model.js";
import { paginate } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const buildPagination = (page, limit, total) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});

/**
 * GET /api/logs/activity
 * Response: { logs, admins, pagination }
 */
export const getActivityLogs = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { category: "activity" };
		if (req.query.action)
			filter.action = { $regex: req.query.action, $options: "i" };
		if (req.query.admin && req.query.admin !== "all")
			filter.adminId = req.query.admin;
		if (req.query.level) filter.level = req.query.level;
		if (req.query.dateFrom)
			filter.createdAt = { $gte: new Date(req.query.dateFrom) };
		if (req.query.dateTo)
			filter.createdAt = {
				...filter.createdAt,
				$lte: new Date(req.query.dateTo),
			};

		const [items, total, adminIds] = await Promise.all([
			ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			ActivityLog.countDocuments(filter),
			ActivityLog.distinct("adminId"),
		]);

		const logs = items.map((log) => ({
			id: log._id,
			adminId: log.adminId,
			adminName: log.adminName || "",
			action: log.action,
			targetType: log.targetType,
			targetId: log.targetId,
			details: log.details,
			ipAddress: log.ipAddress || "",
			timestamp: log.createdAt,
		}));

		return success(res, {
			logs,
			admins: adminIds.map((id) => String(id)),
			pagination: buildPagination(page, limit, total),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/logs/errors
 * Response: { errors, pagination }
 */
export const getSystemErrors = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { category: "error" };
		if (req.query.level) filter.level = req.query.level;

		const [items, total] = await Promise.all([
			ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			ActivityLog.countDocuments(filter),
		]);

		const errors = items.map((log) => ({
			id: log._id,
			level: log.level || "error",
			message: log.action,
			stack: log.details || "",
			source: log.targetType || "system",
			resolved: false,
			timestamp: log.createdAt,
		}));

		return success(res, {
			errors,
			pagination: buildPagination(page, limit, total),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/logs/payments
 * Response: { failures, pagination }
 */
export const getPaymentFailures = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { isRefunded: true };

		const [items, total] = await Promise.all([
			Booking.find(filter)
				.sort({ refundedAt: -1 })
				.skip(skip)
				.limit(limit)
				.select(
					"bookingNumber customerName customerEmail partnerBusinessName pricing refundAmount refundedAt status",
				),
			Booking.countDocuments(filter),
		]);

		const failures = items.map((b) => ({
			id: b._id,
			transactionId: b.bookingNumber,
			userId: b.customerId,
			userName: b.customerName,
			amount: b.pricing?.finalPrice || 0,
			currency: "GBP",
			errorCode: "REFUNDED",
			errorMessage: `Refund of ${b.refundAmount || 0} issued`,
			retryCount: 0,
			resolved: true,
			timestamp: b.refundedAt || b.updatedAt,
		}));

		return success(res, {
			failures,
			pagination: buildPagination(page, limit, total),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/logs/api
 * Response: { errors, pagination }
 */
export const getApiErrors = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { category: "api" };

		const [items, total] = await Promise.all([
			ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			ActivityLog.countDocuments(filter),
		]);

		const errors = items.map((log) => ({
			id: log._id,
			endpoint: log.targetType || "",
			method: "GET",
			statusCode: 500,
			errorMessage: log.action,
			requestId: log._id,
			userId: log.adminId || null,
			responseTime: 0,
			timestamp: log.createdAt,
		}));

		return success(res, {
			errors,
			pagination: buildPagination(page, limit, total),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};
