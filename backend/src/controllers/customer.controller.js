import ActivityLog from "../models/ActivityLog.model.js";
import Booking from "../models/Booking.model.js";
import Customer from "../models/Customer.model.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const formatCustomer = (c) => ({
	id: c._id,
	name: c.name,
	email: c.email,
	phone: c.phone || "",
	avatar: c.avatar || "",
	location: c.location || "",
	status: c.status,
	registeredAt: c.createdAt,
	lastActiveAt: c.lastActiveAt || c.createdAt,
	totalBookings: c.totalBookings || 0,
	totalSpent: c.totalSpent || 0,
	vehicles: c.vehicles || [],
	subscription: c.subscription || {
		plan: "none",
		price: 0,
		active: false,
		startDate: null,
		renewalDate: null,
		washesRemaining: 0,
	},
	paymentMethods: c.paymentMethods || [],
	suspendedAt: c.suspendedAt || null,
	suspensionReason: c.suspensionReason || null,
});

/**
 * GET /api/customers
 */
export const getCustomers = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = {};

		if (req.query.search) {
			filter.$or = [
				{ name: { $regex: req.query.search, $options: "i" } },
				{ email: { $regex: req.query.search, $options: "i" } },
				{ phone: { $regex: req.query.search, $options: "i" } },
			];
		}
		if (req.query.status) filter.status = req.query.status;
		if (req.query.dateFrom)
			filter.createdAt = { $gte: new Date(req.query.dateFrom) };
		if (req.query.dateTo) {
			filter.createdAt = {
				...filter.createdAt,
				$lte: new Date(req.query.dateTo),
			};
		}

		const [items, total] = await Promise.all([
			Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Customer.countDocuments(filter),
		]);

		const customerIds = items.map((c) => c._id);
		const bookingStats = await Booking.aggregate([
			{ $match: { customerId: { $in: customerIds } } },
			{ $group: { _id: "$customerId", totalBookings: { $sum: 1 }, totalSpent: { $sum: "$pricing.finalPrice" } } },
		]);
		const statsMap = Object.fromEntries(bookingStats.map((s) => [s._id.toString(), s]));

		return success(
			res,
			paginatedResponse(
				items.map((c) => ({
					...formatCustomer(c),
					totalBookings: statsMap[c._id.toString()]?.totalBookings ?? 0,
					totalSpent: statsMap[c._id.toString()]?.totalSpent ?? 0,
				})),
				total,
				page,
				limit,
			),
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/customers/:id
 */
export const getCustomerDetails = async (req, res) => {
	try {
		const customer = await Customer.findById(req.params.id);
		if (!customer) return error(res, "Customer not found", 404);

		const bookingHistory = await Booking.find({ customerId: customer._id })
			.sort({ createdAt: -1 })
			.limit(20)
			.select(
				"serviceName partnerBusinessName pricing.finalPrice status slotDate ratingScore",
			);

		return success(res, {
			...formatCustomer(customer),
			bookingHistory: bookingHistory.map((b) => ({
				id: b._id,
				service: b.serviceName,
				partnerName: b.partnerBusinessName,
				amount: b.pricing?.finalPrice || 0,
				status: b.status,
				date: b.slotDate,
				rating: b.ratingScore || null,
			})),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/customers/:id/suspend
 */
export const suspendCustomer = async (req, res) => {
	try {
		const { reason } = req.body;
		const customer = await Customer.findByIdAndUpdate(
			req.params.id,
			{
				status: "suspended",
				suspensionReason: reason,
				suspendedAt: new Date(),
			},
			{ new: true },
		);
		if (!customer) return error(res, "Customer not found", 404);

		await ActivityLog.create({
			action: "customer_suspended",
			adminId: req.user.id,
			targetId: customer._id.toString(),
			targetType: "Customer",
			details: `Customer "${customer.name}" suspended. Reason: ${reason}`,
		});

		return success(
			res,
			{ customer: formatCustomer(customer) },
			"Customer suspended",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/customers/:id/reactivate
 */
export const reactivateCustomer = async (req, res) => {
	try {
		const customer = await Customer.findByIdAndUpdate(
			req.params.id,
			{ status: "active", suspensionReason: null, suspendedAt: null },
			{ new: true },
		);
		if (!customer) return error(res, "Customer not found", 404);

		return success(
			res,
			{ customer: formatCustomer(customer) },
			"Customer reactivated",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/customers/:id
 */
export const deleteCustomer = async (req, res) => {
	try {
		const customer = await Customer.findByIdAndDelete(req.params.id);
		if (!customer) return error(res, "Customer not found", 404);

		await ActivityLog.create({
			action: "customer_deleted",
			adminId: req.user.id,
			targetId: req.params.id,
			targetType: "Customer",
			details: `Customer "${customer.name}" deleted`,
		});

		return success(res, {}, "Customer deleted successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/customers/:id/notify
 */
export const sendNotification = async (req, res) => {
	try {
		const { message } = req.body;
		const customer = await Customer.findById(req.params.id);
		if (!customer) return error(res, "Customer not found", 404);

		await ActivityLog.create({
			action: "customer_notified",
			adminId: req.user.id,
			targetId: customer._id.toString(),
			targetType: "Customer",
			details: `Notification sent to "${customer.name}": ${message}`,
		});

		return success(res, {}, "Notification sent successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
