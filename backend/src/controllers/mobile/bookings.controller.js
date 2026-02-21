import Booking from "../../models/Booking.model.js";
import Customer from "../../models/Customer.model.js";
import Partner from "../../models/Partner.model.js";
import PartnerAvailability from "../../models/PartnerAvailability.model.js";
import PartnerCapacity from "../../models/PartnerCapacity.model.js";
import Product from "../../models/Product.model.js";
import Review from "../../models/Review.model.js";
import Service from "../../models/Service.model.js";
import Settings from "../../models/Settings.model.js";
import { paginate, paginatedResponse } from "../../utils/pagination.js";
import { error, success } from "../../utils/response.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const timeToMinutes = (time) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

const minutesToTime = (minutes) => {
	const h = Math.floor(minutes / 60) % 24;
	const m = minutes % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getDefaultAvailability = (partnerId) => {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	return {
		partnerId,
		schedule: days.map((dayName, index) => ({
			dayOfWeek: index,
			dayName,
			isEnabled: index !== 0,
			timeBlocks:
				index === 0
					? []
					: index === 6
						? [{ start: "09:00", end: "14:00" }]
						: [{ start: "08:00", end: "18:00" }],
		})),
		bufferTimeMinutes: 15,
		maxAdvanceBookingDays: 21,
	};
};

const getDefaultCapacity = (partnerId) => {
	const bays = [
		{ id: "bay-w1", name: "Wash Bay 1", serviceCategory: "wash", isActive: true },
		{ id: "bay-w2", name: "Wash Bay 2", serviceCategory: "wash", isActive: true },
		{ id: "bay-w3", name: "Wash Bay 3", serviceCategory: "wash", isActive: true },
		{ id: "bay-d1", name: "Detail Bay 1", serviceCategory: "detailing", isActive: true },
	];
	return {
		partnerId,
		bays,
		capacityByCategory: { wash: 3, detailing: 1, other: 0 },
		bufferTimeMinutes: 15,
	};
};

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
		phone: b.partnerPhone,
		location: b.partnerLocation || "",
		address: b.partnerAddress || "",
		rating: b.partnerRating || 0,
	},
	vehicle: b.vehicle || {},
	service: {
		id: b.serviceId,
		name: b.serviceName,
		serviceType: b.serviceType,
		serviceCategory: b.serviceCategory,
		duration: b.serviceDuration || 0,
	},
	slot: {
		date: b.slotDate,
		startTime: b.slotStartTime,
		endTime: b.slotEndTime,
	},
	pricing: b.pricing || {},
	status: b.status,
	serviceSteps: b.serviceSteps || [],
	bayId: b.bayId,
	bayName: b.bayName,
	productOrder: b.productOrder || null,
	notes: b.notes || "",
	createdAt: b.createdAt,
	updatedAt: b.updatedAt,
	startedAt: b.startedAt,
	completedAt: b.completedAt,
	cancelledAt: b.cancelledAt,
	cancelledBy: b.cancelledBy,
	cancellationReason: b.cancellationReason,
	rating: b.ratingScore
		? { score: b.ratingScore, comment: b.ratingComment, createdAt: b.ratingCreatedAt }
		: null,
});

/**
 * GET /api/mobile/partners/:partnerId/slots
 * Get available slots for a partner
 */
export const getAvailableSlots = async (req, res) => {
	try {
		const { partnerId } = req.params;
		const { date, serviceCategory = "wash", duration = 30 } = req.query;

		if (!date) {
			return error(res, "Date is required", 400);
		}

		const [availability, capacity] = await Promise.all([
			PartnerAvailability.findOne({ partnerId }),
			PartnerCapacity.findOne({ partnerId }),
		]);

		const avail = availability || getDefaultAvailability(partnerId);
		const cap = capacity || getDefaultCapacity(partnerId);

		const requestedDate = new Date(date);
		const dayOfWeek = requestedDate.getDay();
		const dayAvail = avail.schedule.find((d) => d.dayOfWeek === dayOfWeek);

		if (!dayAvail || !dayAvail.isEnabled) {
			return success(res, {
				date,
				windows: [],
				message: "Partner is not available on this day",
				capacity: cap.capacityByCategory,
			});
		}

		const totalBays = cap.capacityByCategory[serviceCategory] || 0;
		if (totalBays === 0) {
			return success(res, {
				date,
				windows: [],
				message: "No bays available for this service category",
				capacity: cap.capacityByCategory,
			});
		}

		const durationMinutes = parseInt(duration);
		const bufferMinutes = avail.bufferTimeMinutes || cap.bufferTimeMinutes || 15;

		const existingBookings = await Booking.find({
			partnerId,
			slotDate: date,
			serviceCategory,
			status: { $nin: ["cancelled"] },
		}).select("slotStartTime slotEndTime bayId");

		const windows = [];
		for (const block of dayAvail.timeBlocks) {
			const blockStart = timeToMinutes(block.start);
			const blockEnd = timeToMinutes(block.end);

			for (let startMin = blockStart; startMin + durationMinutes <= blockEnd; startMin += 15) {
				const startTime = minutesToTime(startMin);
				const endTime = minutesToTime(startMin + durationMinutes);
				const endM = startMin + durationMinutes;

				const overlapping = existingBookings.filter((b) => {
					const bStart = timeToMinutes(b.slotStartTime);
					const bEnd = timeToMinutes(b.slotEndTime) + bufferMinutes;
					return startMin < bEnd && bStart < endM;
				});

				const usedBayIds = new Set(overlapping.map((b) => b.bayId).filter(Boolean));
				const categoryBays = cap.bays.filter(
					(b) => b.serviceCategory === serviceCategory && b.isActive
				);
				const freeBays = categoryBays.filter((b) => !usedBayIds.has(b.id));

				if (freeBays.length > 0) {
					windows.push({
						startTime,
						endTime,
						availableBays: freeBays.length,
						totalBays,
					});
				}
			}
		}

		return success(res, { date, windows, capacity: cap.capacityByCategory });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/bookings/calculate-price
 * Calculate price before booking
 */
export const calculatePrice = async (req, res) => {
	try {
		const { serviceId, vehicleId, products = [] } = req.body;
		const customerId = req.user.id;

		const [service, customer, settings] = await Promise.all([
			Service.findById(serviceId),
			Customer.findById(customerId),
			Settings.getSettings(),
		]);

		if (!service) {
			return error(res, "Service not found", 404);
		}

		// Get vehicle body type
		let bodyType = "Sedan";
		if (vehicleId && customer) {
			const vehicle = customer.vehicles?.id(vehicleId);
			if (vehicle?.bodyType) {
				bodyType = vehicle.bodyType;
			}
		}

		// Find price for body type
		let basePrice = 20;
		if (service.bodyTypePricing?.length) {
			const match = service.bodyTypePricing.find((p) => p.bodyType === bodyType);
			if (match) {
				basePrice = match.price;
			} else {
				basePrice = service.bodyTypePricing[0].price;
			}
		}

		// Calculate products total
		let productsTotal = 0;
		const productDetails = [];

		if (products.length > 0) {
			const productIds = products.map((p) => p.productId);
			const dbProducts = await Product.find({ _id: { $in: productIds } });

			for (const item of products) {
				const prod = dbProducts.find((p) => p._id.toString() === item.productId);
				if (prod) {
					const itemTotal = prod.price * (item.quantity || 1);
					productsTotal += itemTotal;
					productDetails.push({
						id: prod._id,
						name: prod.name,
						price: prod.price,
						quantity: item.quantity || 1,
						total: itemTotal,
					});
				}
			}
		}

		// Calculate subscription discount
		let subscriptionDiscount = 0;
		if (customer?.subscriptionTier === "premium") {
			subscriptionDiscount = +(basePrice * 0.1).toFixed(2); // 10% discount
		}

		const serviceTotal = basePrice - subscriptionDiscount;
		const subtotal = serviceTotal + productsTotal;

		// Platform fee
		const commissionRate = settings?.commission?.customerCommission
			? settings.commission.customerCommission / 100
			: 0.05;
		const platformFee = +(subtotal * commissionRate).toFixed(2);

		const total = +(subtotal + platformFee).toFixed(2);

		return success(res, {
			servicePrice: basePrice,
			bodyType,
			subscriptionDiscount,
			serviceTotal,
			products: productDetails,
			productsTotal,
			platformFee,
			total,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/bookings
 * Create a new booking
 */
export const createBooking = async (req, res) => {
	try {
		const {
			partnerId,
			serviceId,
			vehicleId,
			slot,
			products = [],
			instructions,
			paymentMethodId,
		} = req.body;
		const customerId = req.user.id;

		if (!partnerId || !serviceId || !slot) {
			return error(res, "partnerId, serviceId, and slot are required", 400);
		}

		if (!slot.date || !slot.startTime || !slot.endTime) {
			return error(res, "slot must include date, startTime, and endTime", 400);
		}

		const [partner, customer, service, capacity, availability] = await Promise.all([
			Partner.findById(partnerId),
			Customer.findById(customerId),
			Service.findById(serviceId),
			PartnerCapacity.findOne({ partnerId }),
			PartnerAvailability.findOne({ partnerId }),
		]);

		if (!partner) return error(res, "Partner not found", 404);
		if (!customer) return error(res, "Customer not found", 404);
		if (!service) return error(res, "Service not found", 404);

		const cap = capacity || getDefaultCapacity(partnerId);
		const avail = availability || getDefaultAvailability(partnerId);
		const svcCategory = service.serviceCategory || "wash";

		// Validate partner availability on this day
		const requestedDate = new Date(slot.date);
		const dayOfWeek = requestedDate.getDay();
		const dayAvail = avail.schedule.find((d) => d.dayOfWeek === dayOfWeek);

		if (!dayAvail || !dayAvail.isEnabled || dayAvail.timeBlocks.length === 0) {
			return error(res, "Partner is not available on this day", 400);
		}

		// Validate advance booking window
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		requestedDate.setHours(0, 0, 0, 0);
		const daysInAdvance = Math.floor((requestedDate - today) / (1000 * 60 * 60 * 24));

		if (daysInAdvance < 0) {
			return error(res, "Cannot book in the past", 400);
		}

		const maxAdvanceDays = avail.maxAdvanceBookingDays || 21;
		if (daysInAdvance > maxAdvanceDays) {
			return error(res, `Bookings can only be made up to ${maxAdvanceDays} days in advance`, 400);
		}

		// Check slot availability
		const existingBookings = await Booking.find({
			partnerId,
			slotDate: slot.date,
			serviceCategory: svcCategory,
			status: { $nin: ["cancelled"] },
		}).select("slotStartTime slotEndTime bayId");

		const startM = timeToMinutes(slot.startTime);
		const endM = timeToMinutes(slot.endTime);
		const bufferM = cap.bufferTimeMinutes || 15;

		const overlapping = existingBookings.filter((b) => {
			const bStart = timeToMinutes(b.slotStartTime);
			const bEnd = timeToMinutes(b.slotEndTime) + bufferM;
			return startM < bEnd && bStart < endM;
		});

		const usedBayIds = new Set(overlapping.map((b) => b.bayId).filter(Boolean));
		const categoryBays = cap.bays.filter((b) => b.serviceCategory === svcCategory && b.isActive);
		const availableBay = categoryBays.find((b) => !usedBayIds.has(b.id));

		if (!availableBay) {
			return error(res, "No available bays for this time slot", 400);
		}

		// Get vehicle
		const vehicle = vehicleId
			? customer.vehicles?.id(vehicleId)
			: customer.vehicles?.[0];

		if (!vehicle) {
			return error(res, "Please add a vehicle before booking", 400);
		}

		// Calculate pricing
		let bodyType = vehicle.bodyType || "Sedan";
		let basePrice = 20;
		if (service.bodyTypePricing?.length) {
			const match = service.bodyTypePricing.find((p) => p.bodyType === bodyType);
			basePrice = match ? match.price : service.bodyTypePricing[0].price;
		}

		// Products
		let productsTotal = 0;
		let productCount = 0;
		if (products.length > 0) {
			const productIds = products.map((p) => p.productId);
			const dbProducts = await Product.find({ _id: { $in: productIds } });
			for (const item of products) {
				const prod = dbProducts.find((p) => p._id.toString() === item.productId);
				if (prod) {
					productsTotal += prod.price * (item.quantity || 1);
					productCount += item.quantity || 1;
				}
			}
		}

		// Subscription discount
		let subscriptionDiscount = 0;
		if (customer.subscriptionTier === "premium") {
			subscriptionDiscount = +(basePrice * 0.1).toFixed(2);
		}

		const settings = await Settings.getSettings();
		const commissionRate = settings?.commission?.customerCommission
			? settings.commission.customerCommission / 100
			: 0.05;

		const serviceTotal = basePrice - subscriptionDiscount;
		const subtotal = serviceTotal + productsTotal;
		const platformFee = +(subtotal * commissionRate).toFixed(2);
		const finalPrice = +(subtotal + platformFee).toFixed(2);
		const partnerPayout = +(subtotal - (subtotal * (settings?.commission?.partnerCommission || 10) / 100)).toFixed(2);

		const bookingNumber = Booking.generateBookingNumber();

		const booking = await Booking.create({
			bookingNumber,
			customerId: customer._id,
			customerName: customer.name,
			customerEmail: customer.email,
			customerPhone: customer.phone,
			customerAvatar: customer.avatar,
			partnerId: partner._id,
			partnerBusinessName: partner.businessName,
			partnerOwnerName: partner.contactPersonName,
			partnerPhone: partner.phone,
			partnerLocation: partner.location,
			partnerAddress: partner.address,
			partnerRating: partner.rating,
			vehicle: {
				make: vehicle.make,
				model: vehicle.model,
				year: vehicle.year,
				color: vehicle.color,
				plateNumber: vehicle.plateNumber,
				type: vehicle.type,
			},
			serviceId,
			serviceName: service.name,
			serviceType: service.serviceType,
			serviceCategory: svcCategory,
			serviceDuration: service.duration,
			slotDate: slot.date,
			slotStartTime: slot.startTime,
			slotEndTime: slot.endTime,
			pricing: {
				basePrice,
				isCustomPrice: false,
				bodyTypeDefault: basePrice,
				finalPrice,
				platformFee,
				partnerPayout,
				subscriptionDiscount: subscriptionDiscount > 0 ? subscriptionDiscount : undefined,
			},
			status: "booked",
			bayId: availableBay.id,
			bayName: availableBay.name,
			productOrder: productsTotal > 0 ? {
				productCount,
				totalAmount: productsTotal,
			} : undefined,
			notes: instructions,
			serviceSteps: [],
		});

		// Update stats
		await Promise.all([
			Partner.findByIdAndUpdate(partnerId, { $inc: { totalBookings: 1 } }),
			Customer.findByIdAndUpdate(customerId, { $inc: { totalBookings: 1, totalSpent: finalPrice } }),
		]);

		return success(res, { booking: formatBooking(booking) }, "Booking created successfully", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/bookings
 * List customer's bookings
 */
export const getBookings = async (req, res) => {
	try {
		const customerId = req.user.id;
		const { page, limit, skip } = paginate(req.query);
		const { status, search } = req.query;

		const filter = { customerId };

		if (status) {
			filter.status = status;
		}

		if (search) {
			filter.$or = [
				{ bookingNumber: { $regex: search, $options: "i" } },
				{ serviceName: { $regex: search, $options: "i" } },
				{ partnerBusinessName: { $regex: search, $options: "i" } },
			];
		}

		const [bookings, total] = await Promise.all([
			Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Booking.countDocuments(filter),
		]);

		return success(res, paginatedResponse(bookings.map(formatBooking), total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/bookings/:id
 * Get booking details
 */
export const getBookingDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const customerId = req.user.id;

		const booking = await Booking.findOne({ _id: id, customerId });
		if (!booking) {
			return error(res, "Booking not found", 404);
		}

		return success(res, { booking: formatBooking(booking) });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/bookings/:id/cancel
 * Cancel a booking
 */
export const cancelBooking = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const customerId = req.user.id;

		const booking = await Booking.findOne({ _id: id, customerId });
		if (!booking) {
			return error(res, "Booking not found", 404);
		}

		if (["completed", "cancelled"].includes(booking.status)) {
			return error(res, `Cannot cancel a ${booking.status} booking`, 400);
		}

		// Check cancellation window
		const settings = await Settings.getSettings();
		const cancellationHours = settings?.bookingRules?.cancellationWindowHours || 24;
		const bookingDate = new Date(`${booking.slotDate}T${booking.slotStartTime}`);
		const hoursUntilBooking = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);

		if (hoursUntilBooking < cancellationHours) {
			return error(
				res,
				`Bookings can only be cancelled ${cancellationHours} hours in advance`,
				400
			);
		}

		booking.status = "cancelled";
		booking.cancelledAt = new Date();
		booking.cancelledBy = "customer";
		booking.cancellationReason = reason || "Cancelled by customer";
		await booking.save();

		return success(res, { booking: formatBooking(booking) }, "Booking cancelled");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/bookings/:id/review
 * Submit a review
 */
export const submitReview = async (req, res) => {
	try {
		const { id } = req.params;
		const { rating, reviewText, isAnonymous = false } = req.body;
		const customerId = req.user.id;

		if (!rating || rating < 1 || rating > 5) {
			return error(res, "Rating must be between 1 and 5", 400);
		}

		if (!reviewText) {
			return error(res, "Review text is required", 400);
		}

		const booking = await Booking.findOne({ _id: id, customerId });
		if (!booking) {
			return error(res, "Booking not found", 404);
		}

		if (booking.status !== "completed") {
			return error(res, "Can only review completed bookings", 400);
		}

		if (booking.ratingScore) {
			return error(res, "You have already reviewed this booking", 400);
		}

		const customer = await Customer.findById(customerId);

		// Create review
		const review = await Review.create({
			partnerId: booking.partnerId,
			customerId,
			customerName: customer?.name || "Customer",
			isAnonymous,
			rating,
			reviewText,
			bookingId: booking._id,
			service: booking.serviceName,
		});

		// Update booking with rating
		booking.ratingScore = rating;
		booking.ratingComment = reviewText;
		booking.ratingCreatedAt = new Date();
		await booking.save();

		// Update partner rating (simple average for now)
		const allReviews = await Review.find({ partnerId: booking.partnerId });
		const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
		await Partner.findByIdAndUpdate(booking.partnerId, { rating: avgRating.toFixed(1) });

		return success(
			res,
			{
				review: {
					id: review._id,
					rating: review.rating,
					reviewText: review.reviewText,
					createdAt: review.createdAt,
				},
			},
			"Review submitted",
			201
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
