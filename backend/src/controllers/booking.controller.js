import ActivityLog from "../models/ActivityLog.model.js";
import Booking from "../models/Booking.model.js";
import Partner from "../models/Partner.model.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const formatBooking = (b) => ({
	id: b._id,
	bookingNumber: b.bookingNumber,
	customer: {
		id: b.customerId,
		name: b.customerName,
		email: b.customerEmail,
		phone: b.customerPhone,
		avatar: b.customerAvatar || "",
	},
	partner: {
		id: b.partnerId,
		businessName: b.partnerBusinessName,
		ownerName: b.partnerOwnerName,
		phone: b.partnerPhone,
		location: b.partnerLocation || "",
		address: b.partnerAddress || "",
		rating: b.partnerRating || 0,
	},
	vehicle: b.vehicle || {},
	service: {
		name: b.serviceName,
		price: b.pricing?.basePrice || 0,
		duration: b.serviceDuration || 0,
	},
	scheduledDate: b.slotDate,
	createdAt: b.createdAt,
	status: b.status,
	statusTimeline: [],
	payment: {
		method: "card",
		amount: b.pricing?.finalPrice || 0,
		platformFee: b.pricing?.platformFee || 0,
		partnerPayout: b.pricing?.partnerPayout || 0,
		status: b.isRefunded ? "refunded" : "paid",
		transactionId: "",
	},
	rating: b.ratingScore
		? {
				score: b.ratingScore,
				comment: b.ratingComment,
				createdAt: b.ratingCreatedAt,
			}
		: null,
	isDisputed: b.isDisputed || false,
	dispute: b.isDisputed
		? {
				id: b._id,
				reason: b.disputeReason,
				description: b.disputeReason,
				createdAt: b.createdAt,
				status: b.disputeStatus || "open",
				customerEvidence: [],
			}
		: null,
	notes: b.notes || "",
});

/**
 * GET /api/bookings
 */
export const getBookings = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = {};

		if (req.query.search) {
			filter.$or = [
				{ bookingNumber: { $regex: req.query.search, $options: "i" } },
				{ customerName: { $regex: req.query.search, $options: "i" } },
				{ partnerBusinessName: { $regex: req.query.search, $options: "i" } },
			];
		}
		if (req.query.status) filter.status = req.query.status;
		if (req.query.partnerId) filter.partnerId = req.query.partnerId;
		if (req.query.customerId) filter.customerId = req.query.customerId;
		if (req.query.dateFrom) filter.slotDate = { $gte: req.query.dateFrom };
		if (req.query.dateTo)
			filter.slotDate = { ...filter.slotDate, $lte: req.query.dateTo };

		const [items, total] = await Promise.all([
			Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Booking.countDocuments(filter),
		]);

		return success(
			res,
			paginatedResponse(items.map(formatBooking), total, page, limit),
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/bookings/disputes
 */
export const getDisputes = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { isDisputed: true };

		const [items, total] = await Promise.all([
			Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Booking.countDocuments(filter),
		]);

		return success(
			res,
			paginatedResponse(items.map(formatBooking), total, page, limit),
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/bookings/:id
 */
export const getBookingDetails = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);
		const formatted = formatBooking(booking);
		let livePartner = await Partner.findById(booking.partnerId).select(
			"phone location address contactPersonName businessName",
		);
		if (!livePartner && booking.partnerBusinessName) {
			livePartner = await Partner.findOne({
				businessName: booking.partnerBusinessName,
			}).select("phone location address contactPersonName businessName");
		}
		if (livePartner) {
			formatted.partner.phone = livePartner.phone || formatted.partner.phone;
			formatted.partner.location =
				livePartner.location || formatted.partner.location;
			formatted.partner.address =
				livePartner.address || formatted.partner.address;
			formatted.partner.ownerName =
				livePartner.contactPersonName || formatted.partner.ownerName;
			formatted.partner.businessName =
				livePartner.businessName || formatted.partner.businessName;
		}
		return success(res, formatted);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = async (req, res) => {
	try {
		const { reason } = req.body;
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);
		if (booking.status === "cancelled")
			return error(res, "Booking is already cancelled", 400);

		booking.status = "cancelled";
		booking.cancellationReason = reason;
		booking.cancelledAt = new Date();
		booking.cancelledBy = "partner";
		await booking.save();

		await ActivityLog.create({
			action: "booking_cancelled",
			adminId: req.user.id,
			targetId: booking._id.toString(),
			targetType: "Booking",
			details: `Booking ${booking.bookingNumber} cancelled. Reason: ${reason}`,
		});

		return success(
			res,
			{ booking: formatBooking(booking) },
			"Booking cancelled",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/bookings/:id/refund
 */
export const issueRefund = async (req, res) => {
	try {
		const { amount, reason } = req.body;
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);

		booking.isRefunded = true;
		booking.refundAmount = amount;
		booking.refundedAt = new Date();
		await booking.save();

		await ActivityLog.create({
			action: "booking_refunded",
			adminId: req.user.id,
			targetId: booking._id.toString(),
			targetType: "Booking",
			details: `Refund of ${amount} issued for booking ${booking.bookingNumber}. Reason: ${reason}`,
		});

		return success(
			res,
			{ booking: formatBooking(booking) },
			"Refund issued successfully",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/bookings/:id/resolve-dispute
 */
export const resolveDispute = async (req, res) => {
	try {
		const { action, notes, refundAmount } = req.body;
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);

		booking.disputeStatus = "resolved";
		booking.disputeResolvedAt = new Date();
		booking.disputeResolution = notes;
		if (refundAmount) {
			booking.isRefunded = true;
			booking.refundAmount = refundAmount;
			booking.refundedAt = new Date();
		}
		await booking.save();

		await ActivityLog.create({
			action: "dispute_resolved",
			adminId: req.user.id,
			targetId: booking._id.toString(),
			targetType: "Booking",
			details: `Dispute for booking ${booking.bookingNumber} resolved. Action: ${action}`,
		});

		return success(
			res,
			{ booking: formatBooking(booking) },
			"Dispute resolved",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
