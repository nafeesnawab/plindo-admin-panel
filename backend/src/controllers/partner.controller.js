import ActivityLog from "../models/ActivityLog.model.js";
import Booking from "../models/Booking.model.js";
import Partner from "../models/Partner.model.js";
import PartnerAvailability from "../models/PartnerAvailability.model.js";
import PartnerCapacity from "../models/PartnerCapacity.model.js";
import Review from "../models/Review.model.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const formatPartner = (p) => ({
	id: p._id,
	ownerName: p.contactPersonName || "",
	businessName: p.businessName,
	email: p.email,
	phone: p.phone || "",
	location: p.location || p.address || "",
	address: p.address || "",
	status: p.status,
	services: [],
	rating: null,
	totalBookings: 0,
	completionRate: 0,
	totalEarnings: 0,
	isVerified: p.isVerified || false,
	businessLicense: p.businessLicenseNumber || "",
	description: p.description || "",
	logo: p.logo || null,
	coverPhoto: p.coverPhoto || null,
	createdAt: p.createdAt,
	appliedAt: p.appliedAt,
	suspendedAt: p.suspendedAt || null,
	suspensionReason: p.suspensionReason || null,
	photos: p.workPhotos || [],
	documents: [
		p.businessRegistrationUrl && {
			name: "Business Registration",
			url: p.businessRegistrationUrl,
			verified: p.isVerified,
		},
		p.businessInsuranceUrl && {
			name: "Business Insurance",
			url: p.businessInsuranceUrl,
			verified: p.isVerified,
		},
		p.motorTradeInsuranceUrl && {
			name: "Motor Trade Insurance",
			url: p.motorTradeInsuranceUrl,
			verified: p.isVerified,
		},
	].filter(Boolean),
	drivers: (p.drivers || []).map((d) => ({
		id: d._id,
		fullName: d.fullName,
		contactNumber: d.contactNumber,
		driverLicenseUrl: d.driverLicenseUrl || null,
		driverInsuranceUrl: d.driverInsuranceUrl || null,
	})),
});

const computeStatsForPartners = async (partnerIds) => {
	const statsAgg = await Booking.aggregate([
		{ $match: { partnerId: { $in: partnerIds } } },
		{
			$group: {
				_id: "$partnerId",
				totalBookings: { $sum: 1 },
				completed: {
					$sum: {
						$cond: [{ $in: ["$status", ["completed", "delivered"]] }, 1, 0],
					},
				},
				totalEarnings: {
					$sum: {
						$cond: [
							{ $in: ["$status", ["completed", "delivered"]] },
							"$pricing.partnerPayout",
							0,
						],
					},
				},
				ratingSum: { $sum: { $ifNull: ["$ratingScore", 0] } },
				ratingCount: {
					$sum: {
						$cond: [{ $gt: [{ $ifNull: ["$ratingScore", 0] }, 0] }, 1, 0],
					},
				},
			},
		},
	]);
	const map = {};
	for (const s of statsAgg) {
		map[s._id.toString()] = {
			totalBookings: s.totalBookings,
			completionRate:
				s.totalBookings > 0
					? Math.round((s.completed / s.totalBookings) * 100)
					: 0,
			totalEarnings: Math.round(s.totalEarnings * 100) / 100,
			rating:
				s.ratingCount > 0
					? Math.round((s.ratingSum / s.ratingCount) * 10) / 10
					: null,
		};
	}
	return map;
};

const buildFilter = (status, query) => {
	const filter = { status };
	if (query.search) {
		filter.$or = [
			{ businessName: { $regex: query.search, $options: "i" } },
			{ email: { $regex: query.search, $options: "i" } },
			{ contactPersonName: { $regex: query.search, $options: "i" } },
		];
	}
	if (query.rating) filter.rating = { $gte: parseFloat(query.rating) };
	if (query.verified) filter.isVerified = query.verified === "true";
	return filter;
};

/**
 * GET /api/partners/pending
 */
export const getPendingPartners = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = buildFilter("pending", req.query);
		const [items, total] = await Promise.all([
			Partner.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit),
			Partner.countDocuments(filter),
		]);
		const statsMap = await computeStatsForPartners(items.map((p) => p._id));
		const formatted = items.map((p) => ({
			...formatPartner(p),
			...(statsMap[p._id.toString()] || {}),
		}));
		return success(res, paginatedResponse(formatted, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partners/active
 */
export const getActivePartners = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = buildFilter("active", req.query);
		const [items, total] = await Promise.all([
			Partner.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Partner.countDocuments(filter),
		]);
		const statsMap = await computeStatsForPartners(items.map((p) => p._id));
		const formatted = items.map((p) => ({
			...formatPartner(p),
			...(statsMap[p._id.toString()] || {}),
		}));
		return success(res, paginatedResponse(formatted, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partners/suspended
 */
export const getSuspendedPartners = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = buildFilter("suspended", req.query);
		const [items, total] = await Promise.all([
			Partner.find(filter).sort({ suspendedAt: -1 }).skip(skip).limit(limit),
			Partner.countDocuments(filter),
		]);
		const statsMap = await computeStatsForPartners(items.map((p) => p._id));
		const formatted = items.map((p) => ({
			...formatPartner(p),
			...(statsMap[p._id.toString()] || {}),
		}));
		return success(res, paginatedResponse(formatted, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partners/:id
 */
export const getPartnerDetails = async (req, res) => {
	try {
		const partner = await Partner.findById(req.params.id);
		if (!partner) return error(res, "Partner not found", 404);

		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];

		const [reviews, statsAgg, earningsAgg, availability, capacity] =
			await Promise.all([
				Review.find({ partnerId: partner._id })
					.sort({ createdAt: -1 })
					.limit(20),
				Booking.aggregate([
					{ $match: { partnerId: partner._id } },
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
							completed: {
								$sum: {
									$cond: [
										{ $in: ["$status", ["completed", "delivered"]] },
										1,
										0,
									],
								},
							},
							totalEarnings: {
								$sum: {
									$cond: [
										{ $in: ["$status", ["completed", "delivered"]] },
										"$pricing.partnerPayout",
										0,
									],
								},
							},
							ratingSum: { $sum: { $ifNull: ["$ratingScore", 0] } },
							ratingCount: {
								$sum: {
									$cond: [{ $gt: [{ $ifNull: ["$ratingScore", 0] }, 0] }, 1, 0],
								},
							},
						},
					},
				]),
				Booking.aggregate([
					{
						$match: {
							partnerId: partner._id,
							status: { $in: ["completed", "delivered"] },
						},
					},
					{
						$group: {
							_id: {
								month: { $month: "$createdAt" },
								year: { $year: "$createdAt" },
							},
							earnings: { $sum: "$pricing.partnerPayout" },
							bookings: { $sum: 1 },
						},
					},
					{ $sort: { "_id.year": 1, "_id.month": 1 } },
					{ $limit: 12 },
				]),
				PartnerAvailability.findOne({ partnerId: partner._id }),
				PartnerCapacity.findOne({ partnerId: partner._id }),
			]);

		const stats = statsAgg[0] || {
			total: 0,
			completed: 0,
			totalEarnings: 0,
			ratingSum: 0,
			ratingCount: 0,
		};
		const computedRating =
			stats.ratingCount > 0
				? Math.round((stats.ratingSum / stats.ratingCount) * 10) / 10
				: null;
		const completionRate =
			stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

		return success(res, {
			...formatPartner(partner),
			rating: computedRating,
			totalBookings: stats.total,
			completionRate,
			totalEarnings: Math.round(stats.totalEarnings * 100) / 100,
			reviews: reviews.map((r) => ({
				id: r._id,
				customerName: r.customerName,
				rating: r.rating,
				comment: r.comment,
				createdAt: r.createdAt,
			})),
			earningsHistory: earningsAgg.map((e) => ({
				month: `${monthNames[e._id.month - 1]} ${e._id.year}`,
				earnings: e.earnings,
				bookings: e.bookings,
			})),
			schedule: availability ? availability.schedule : [],
			bufferTimeMinutes: availability ? availability.bufferTimeMinutes : 15,
			bays: capacity ? capacity.bays : [],
			capacityByCategory: capacity ? capacity.capacityByCategory : {},
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partners/:id/approve
 */
export const approvePartner = async (req, res) => {
	try {
		const partner = await Partner.findByIdAndUpdate(
			req.params.id,
			{ status: "active", approvedAt: new Date(), isVerified: true },
			{ new: true },
		);
		if (!partner) return error(res, "Partner not found", 404);

		await ActivityLog.create({
			action: "partner_approved",
			adminId: req.user.id,
			targetId: partner._id.toString(),
			targetType: "Partner",
			details: `Partner "${partner.businessName}" approved`,
		});

		return success(
			res,
			{ partner: formatPartner(partner) },
			"Partner approved successfully",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partners/:id/reject
 */
export const rejectPartner = async (req, res) => {
	try {
		const { reason } = req.body;
		const partner = await Partner.findByIdAndUpdate(
			req.params.id,
			{ status: "rejected", rejectionReason: reason },
			{ new: true },
		);
		if (!partner) return error(res, "Partner not found", 404);

		await ActivityLog.create({
			action: "partner_rejected",
			adminId: req.user.id,
			targetId: partner._id.toString(),
			targetType: "Partner",
			details: `Partner "${partner.businessName}" rejected. Reason: ${reason}`,
		});

		return success(
			res,
			{ partner: formatPartner(partner) },
			"Partner rejected",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partners/:id/suspend
 */
export const suspendPartner = async (req, res) => {
	try {
		const { reason } = req.body;
		const partner = await Partner.findByIdAndUpdate(
			req.params.id,
			{
				status: "suspended",
				suspensionReason: reason,
				suspendedAt: new Date(),
			},
			{ new: true },
		);
		if (!partner) return error(res, "Partner not found", 404);

		await ActivityLog.create({
			action: "partner_suspended",
			adminId: req.user.id,
			targetId: partner._id.toString(),
			targetType: "Partner",
			details: `Partner "${partner.businessName}" suspended. Reason: ${reason}`,
		});

		return success(
			res,
			{ partner: formatPartner(partner) },
			"Partner suspended",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partners/:id/reactivate
 */
export const reactivatePartner = async (req, res) => {
	try {
		const partner = await Partner.findByIdAndUpdate(
			req.params.id,
			{ status: "active", suspensionReason: null, suspendedAt: null },
			{ new: true },
		);
		if (!partner) return error(res, "Partner not found", 404);

		await ActivityLog.create({
			action: "partner_reactivated",
			adminId: req.user.id,
			targetId: partner._id.toString(),
			targetType: "Partner",
			details: `Partner "${partner.businessName}" reactivated`,
		});

		return success(
			res,
			{ partner: formatPartner(partner) },
			"Partner reactivated",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/partners/:id
 */
export const removePartner = async (req, res) => {
	try {
		const partner = await Partner.findByIdAndDelete(req.params.id);
		if (!partner) return error(res, "Partner not found", 404);

		await ActivityLog.create({
			action: "partner_removed",
			adminId: req.user.id,
			targetId: req.params.id,
			targetType: "Partner",
			details: `Partner "${partner.businessName}" permanently removed`,
		});

		return success(res, {}, "Partner removed successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
