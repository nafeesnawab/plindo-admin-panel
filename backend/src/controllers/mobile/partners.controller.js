import Partner from "../../models/Partner.model.js";
import PartnerAvailability from "../../models/PartnerAvailability.model.js";
import Product from "../../models/Product.model.js";
import Review from "../../models/Review.model.js";
import Service from "../../models/Service.model.js";
import { paginate, paginatedResponse } from "../../utils/pagination.js";
import { error, success } from "../../utils/response.js";

const formatPartnerListItem = (p, services = [], schedule = null) => {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	// Check if open now based on schedule
	let isOpenNow = false;

	if (schedule?.length > 0) {
		const todayData = schedule.find(s => s.dayOfWeek === dayOfWeek);
		if (todayData?.isEnabled && todayData.timeBlocks?.length > 0) {
			// Check if current time falls within any time block
			isOpenNow = todayData.timeBlocks.some(block =>
				currentTime >= block.start && currentTime <= block.end
			);
		}
	}

	// Get min price from services
	let minPrice = null;
	if (services.length > 0) {
		const prices = services
			.flatMap((s) => s.bodyTypePricing?.map((bp) => bp.price) || [])
			.filter((p) => p != null);
		if (prices.length > 0) {
			minPrice = Math.min(...prices);
		}
	}

	// Get service types available
	const serviceTypes = [...new Set(services.map((s) => s.serviceType))];
	const serviceCategories = [...new Set(services.map((s) => s.serviceCategory))];

	return {
		id: p._id,
		businessName: p.businessName,
		logo: p.logo || "",
		coverPhoto: p.coverPhoto || "",
		rating: p.rating || 0,
		totalBookings: p.totalBookings || 0,
		address: p.address || "",
		latitude: p.latitude,
		longitude: p.longitude,
		isOpenNow,
		schedule: schedule || [],
		serviceTypes,
		serviceCategories,
		minPrice,
		isVerified: p.isVerified || false,
	};
};

const formatPartnerDetails = (p, schedule = null) => {
	return {
		id: p._id,
		businessName: p.businessName,
		description: p.description || "",
		logo: p.logo || "",
		coverPhoto: p.coverPhoto || "",
		workPhotos: p.workPhotos || [],
		rating: p.rating || 0,
		totalBookings: p.totalBookings || 0,
		address: p.address || "",
		phone: p.phone || "",
		latitude: p.latitude,
		longitude: p.longitude,
		isVerified: p.isVerified || false,
		schedule: schedule || [],
	};
};

const formatService = (s) => ({
	id: s._id,
	name: s.name,
	description: s.description || "",
	serviceCategory: s.serviceCategory,
	serviceType: s.serviceType,
	duration: s.duration,
	bannerUrl: s.bannerUrl || "",
	bodyTypePricing: s.bodyTypePricing || [],
	minPrice: s.bodyTypePricing?.length > 0
		? Math.min(...s.bodyTypePricing.map((bp) => bp.price))
		: 0,
});

const formatProduct = (p) => ({
	id: p._id,
	name: p.name,
	description: p.description || "",
	category: p.category,
	price: p.price,
	stock: p.stock,
	imageUrl: p.imageUrl || "",
	status: p.status,
});

/**
 * GET /api/mobile/partners
 * List partners with filters
 */
export const getPartners = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const {
			search,
			serviceType,
			serviceCategory,
			minRating,
			maxPrice,
			openNow,
			lat,
			lng,
			radius = 50,
			sortBy = "rating",
		} = req.query;

		// Build base filter
		const filter = { status: "active" };

		if (search) {
			filter.$or = [
				{ businessName: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		if (minRating) {
			filter.rating = { $gte: parseFloat(minRating) };
		}

		// Get all matching partners first
		let partners = await Partner.find(filter).lean();

		// If searching by service-related filters, we need to check services
		let serviceFilter = { status: "active" };
		let partnerIdsWithMatchingServices = null;

		if (serviceType || serviceCategory || maxPrice || search) {
			if (serviceType) serviceFilter.serviceType = serviceType;
			if (serviceCategory) serviceFilter.serviceCategory = serviceCategory;

			if (maxPrice) {
				serviceFilter["bodyTypePricing.price"] = { $lte: parseFloat(maxPrice) };
			}

			if (search) {
				serviceFilter.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ description: { $regex: search, $options: "i" } },
				];
			}

			const matchingServices = await Service.find(serviceFilter).select("partnerId").lean();
			partnerIdsWithMatchingServices = new Set(matchingServices.map((s) => s.partnerId.toString()));

			partners = partners.filter((p) => partnerIdsWithMatchingServices.has(p._id.toString()));
		}

		// Note: openNow filter will be applied after fetching schedules

		// Calculate distances if location provided
		if (lat && lng) {
			const userLat = parseFloat(lat);
			const userLng = parseFloat(lng);
			const maxRadius = parseFloat(radius);

			partners = partners
				.map((p) => {
					if (p.latitude && p.longitude) {
						const distance = calculateDistance(userLat, userLng, p.latitude, p.longitude);
						return { ...p, distance };
					}
					return { ...p, distance: null };
				})
				.filter((p) => p.distance === null || p.distance <= maxRadius);
		}

		// Sort partners
		if (sortBy === "distance" && lat && lng) {
			partners.sort((a, b) => (a.distance || 999) - (b.distance || 999));
		} else if (sortBy === "price") {
			// Will be sorted after getting services
		} else {
			// Default: sort by rating
			partners.sort((a, b) => (b.rating || 0) - (a.rating || 0));
		}

		// Get services and schedules for all partners
		const partnerIds = partners.map((p) => p._id);
		const [allServices, allAvailabilities] = await Promise.all([
			Service.find({
				partnerId: { $in: partnerIds },
				status: "active",
			}).lean(),
			PartnerAvailability.find({
				partnerId: { $in: partnerIds },
			}).lean(),
		]);

		const servicesByPartner = {};
		allServices.forEach((s) => {
			const pid = s.partnerId.toString();
			if (!servicesByPartner[pid]) servicesByPartner[pid] = [];
			servicesByPartner[pid].push(s);
		});

		const scheduleByPartner = {};
		allAvailabilities.forEach((a) => {
			const pid = a.partnerId.toString();
			scheduleByPartner[pid] = a.schedule || [];
		});

		// If sorting by price, do it now
		if (sortBy === "price") {
			partners.sort((a, b) => {
				const aServices = servicesByPartner[a._id.toString()] || [];
				const bServices = servicesByPartner[b._id.toString()] || [];
				const aMin = Math.min(...aServices.flatMap((s) => s.bodyTypePricing?.map((bp) => bp.price) || [999]));
				const bMin = Math.min(...bServices.flatMap((s) => s.bodyTypePricing?.map((bp) => bp.price) || [999]));
				return aMin - bMin;
			});
		}

		// Filter by openNow if requested (after schedules are fetched)
		if (openNow === "true") {
			const now = new Date();
			const dayOfWeek = now.getDay();
			const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

			partners = partners.filter((p) => {
				const schedule = scheduleByPartner[p._id.toString()];
				if (!schedule?.length) return false;
				const todayData = schedule.find(s => s.dayOfWeek === dayOfWeek);
				if (!todayData?.isEnabled || !todayData.timeBlocks?.length) return false;
				return todayData.timeBlocks.some(block =>
					currentTime >= block.start && currentTime <= block.end
				);
			});
		}

		// Paginate
		const total = partners.length;
		const paginatedPartners = partners.slice(skip, skip + limit);

		// Format response
		const items = paginatedPartners.map((p) => ({
			...formatPartnerListItem(
				p,
				servicesByPartner[p._id.toString()] || [],
				scheduleByPartner[p._id.toString()] || []
			),
			distance: p.distance,
		}));

		return success(res, paginatedResponse(items, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/partners/:id
 * Get partner details with services and products
 */
export const getPartnerDetails = async (req, res) => {
	try {
		const { id } = req.params;

		const partner = await Partner.findOne({ _id: id, status: "active" });
		if (!partner) {
			return error(res, "Partner not found", 404);
		}

		const [services, products, reviewStats, availability] = await Promise.all([
			Service.find({ partnerId: id, status: "active" }).lean(),
			Product.find({ partnerId: id, status: "available" }).lean(),
			Review.aggregate([
				{ $match: { partnerId: partner._id } },
				{
					$group: {
						_id: null,
						totalReviews: { $sum: 1 },
						avgRating: { $avg: "$rating" },
					},
				},
			]),
			PartnerAvailability.findOne({ partnerId: id }).lean(),
		]);

		return success(res, {
			partner: {
				...formatPartnerDetails(partner, availability?.schedule || []),
				totalReviews: reviewStats[0]?.totalReviews || 0,
				avgRating: reviewStats[0]?.avgRating || partner.rating || 0,
			},
			services: services.map(formatService),
			products: products.map(formatProduct),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/partners/:id/services
 * Get partner's services
 */
export const getPartnerServices = async (req, res) => {
	try {
		const { id } = req.params;
		const { serviceCategory, serviceType } = req.query;

		const filter = { partnerId: id, status: "active" };
		if (serviceCategory) filter.serviceCategory = serviceCategory;
		if (serviceType) filter.serviceType = serviceType;

		const services = await Service.find(filter).lean();

		return success(res, { services: services.map(formatService) });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/partners/:id/products
 * Get partner's products for purchase
 */
export const getPartnerProducts = async (req, res) => {
	try {
		const { id } = req.params;
		const { category } = req.query;

		const filter = { partnerId: id, status: "available" };
		if (category) filter.category = category;

		const products = await Product.find(filter).lean();

		return success(res, { products: products.map(formatProduct) });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/partners/:id/reviews
 * Get partner reviews
 */
export const getPartnerReviews = async (req, res) => {
	try {
		const { id } = req.params;
		const { page, limit, skip } = paginate(req.query);

		const [reviews, total] = await Promise.all([
			Review.find({ partnerId: id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Review.countDocuments({ partnerId: id }),
		]);

		const items = reviews.map((r) => ({
			id: r._id,
			customerName: r.isAnonymous ? "Anonymous" : r.customerName,
			rating: r.rating,
			reviewText: r.reviewText,
			service: r.service || "",
			date: r.createdAt,
			partnerResponse: r.partnerResponse || null,
		}));

		return success(res, paginatedResponse(items, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function calculateDistance(lat1, lng1, lat2, lng2) {
	const R = 6371; // Earth's radius in km
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg) {
	return deg * (Math.PI / 180);
}
