import Booking from "../models/Booking.model.js";
import Customer from "../models/Customer.model.js";
import Partner from "../models/Partner.model.js";
import PartnerAvailability from "../models/PartnerAvailability.model.js";
import PartnerCapacity from "../models/PartnerCapacity.model.js";
import Service from "../models/Service.model.js";
import Settings from "../models/Settings.model.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

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
		maxAdvanceBookingDays: 14,
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
		ownerName: b.partnerOwnerName,
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
		basePrice: b.pricing?.basePrice || 0,
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

// ─── GET /api/bookings/slots ─────────────────────────────────────────────────

export const getAvailableSlots = async (req, res) => {
	try {
		const { partnerId, date, serviceCategory = "wash", duration = 30 } = req.query;
		if (!date) return error(res, "Date is required", 400);

		const partnerObjId = partnerId;

		const [availability, capacity] = await Promise.all([
			PartnerAvailability.findOne({ partnerId: partnerObjId }),
			PartnerCapacity.findOne({ partnerId: partnerObjId }),
		]);

		const avail = availability || getDefaultAvailability(partnerObjId);
		const cap = capacity || getDefaultCapacity(partnerObjId);

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
			partnerId: partnerObjId,
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
				const startM = startMin;
				const endM = startMin + durationMinutes;

				const overlapping = existingBookings.filter((b) => {
					const bStart = timeToMinutes(b.slotStartTime);
					const bEnd = timeToMinutes(b.slotEndTime) + bufferMinutes;
					return startM < bEnd && bStart < endM;
				});

				const usedBayIds = new Set(overlapping.map((b) => b.bayId).filter(Boolean));
				const categoryBays = cap.bays.filter(
					(b) => b.serviceCategory === serviceCategory && b.isActive,
				);
				const freeBays = categoryBays.filter((b) => !usedBayIds.has(b.id));

				if (freeBays.length > 0) {
					windows.push({
						startTime,
						endTime,
						availableBays: freeBays.length,
						totalBays,
						bayId: freeBays[0].id,
					});
				}
			}
		}

		return success(res, { date, windows, capacity: cap.capacityByCategory });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── POST /api/bookings/slot ─────────────────────────────────────────────────

export const createSlotBooking = async (req, res) => {
	try {
		const { partnerId, customerId, vehicleId, serviceId, slot, carType, serviceCategory, serviceType } = req.body;

		if (!partnerId || !customerId || !serviceId || !slot) {
			return error(res, "partnerId, customerId, serviceId, and slot are required", 400);
		}

		const [partner, customer, service, capacity] = await Promise.all([
			Partner.findById(partnerId),
			Customer.findById(customerId),
			Service.findById(serviceId),
			PartnerCapacity.findOne({ partnerId }),
		]);

		if (!partner) return error(res, "Partner not found", 404);
		if (!customer) return error(res, "Customer not found", 404);

		const cap = capacity || getDefaultCapacity(partnerId);
		const svcCategory = serviceCategory || (service?.serviceCategory) || "wash";

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

		const serviceName = service?.name || "Car Wash";
		const basePrice = service?.bodyTypePricing?.[0]?.price || service?.basePrice || 20;
		const platformFee = +(basePrice * 0.1).toFixed(2);
		const partnerPayout = +(basePrice - platformFee).toFixed(2);

		const bookingNumber = Booking.generateBookingNumber();

		const vehicle = customer.vehicles?.find((v) => v._id?.toString() === vehicleId) || {
			make: "Unknown",
			model: "Unknown",
			year: new Date().getFullYear(),
			color: "Unknown",
			type: carType || "sedan",
		};

		const booking = await Booking.create({
			bookingNumber,
			customerId: customer._id,
			customerName: customer.name,
			customerEmail: customer.email,
			customerPhone: customer.phone,
			partnerId: partner._id,
			partnerBusinessName: partner.businessName,
			partnerOwnerName: partner.contactPersonName,
			partnerPhone: partner.phone,
			partnerLocation: partner.location,
			partnerAddress: partner.address,
			partnerRating: partner.rating,
			vehicle: {
				...vehicle,
				id: vehicleId,
				type: carType || vehicle.type || "sedan",
			},
			serviceId,
			serviceName,
			serviceType: serviceType || "book_me",
			serviceCategory: svcCategory,
			serviceDuration: service?.duration || 30,
			slotDate: slot.date,
			slotStartTime: slot.startTime,
			slotEndTime: slot.endTime,
			pricing: {
				basePrice,
				isCustomPrice: false,
				bodyTypeDefault: basePrice,
				finalPrice: basePrice,
				platformFee,
				partnerPayout,
			},
			status: "booked",
			bayId: availableBay.id,
			bayName: availableBay.name,
			serviceSteps: [],
		});

		await Partner.findByIdAndUpdate(partnerId, { $inc: { totalBookings: 1 } });

		return success(res, formatBooking(booking), "Booking created successfully", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/bookings/slot/:id ──────────────────────────────────────────────

export const getSlotBookingById = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);
		return success(res, formatBooking(booking));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── POST /api/bookings/:id/reschedule ───────────────────────────────────────

export const rescheduleBooking = async (req, res) => {
	try {
		const { newSlot, rescheduledBy, reason } = req.body;
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);
		if (booking.status === "cancelled") return error(res, "Cannot reschedule a cancelled booking", 400);

		booking.rescheduledFromDate = booking.slotDate;
		booking.rescheduledFromStartTime = booking.slotStartTime;
		booking.rescheduledFromEndTime = booking.slotEndTime;
		booking.slotDate = newSlot.date;
		booking.slotStartTime = newSlot.startTime;
		booking.slotEndTime = newSlot.endTime;
		booking.rescheduledAt = new Date();
		booking.rescheduledBy = rescheduledBy;
		booking.notes = reason || booking.notes;
		await booking.save();

		return success(res, formatBooking(booking), "Booking rescheduled successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── PATCH /api/bookings/:id/status ─────────────────────────────────────────

export const updateBookingStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const validStatuses = ["booked", "in_progress", "completed", "picked", "out_for_delivery", "delivered", "cancelled"];
		if (!validStatuses.includes(status)) {
			return error(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
		}

		const booking = await Booking.findByIdAndUpdate(
			req.params.id,
			{
				status,
				...(status === "in_progress" && { startedAt: new Date() }),
				...(status === "completed" && { completedAt: new Date() }),
			},
			{ new: true },
		);
		if (!booking) return error(res, "Booking not found", 404);

		return success(res, formatBooking(booking), "Booking status updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── PATCH /api/bookings/:id/step/advance ───────────────────────────────────

export const advanceServiceStep = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);
		if (!booking) return error(res, "Booking not found", 404);

		const steps = booking.serviceSteps || [];
		const currentStep = steps.find((s) => s.status === "in_progress");
		const nextPending = steps.find((s) => s.status === "pending");

		if (currentStep) {
			currentStep.status = "completed";
			currentStep.completedAt = new Date();
		}
		if (nextPending) {
			nextPending.status = "in_progress";
			nextPending.startedAt = new Date();
		}

		booking.markModified("serviceSteps");
		await booking.save();

		return success(res, formatBooking(booking), "Service step advanced");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── POST /api/bookings/calculate-price ─────────────────────────────────────

export const calculatePrice = async (req, res) => {
	try {
		const { serviceId, carType, customerId } = req.body;

		const [service, settings] = await Promise.all([
			Service.findById(serviceId).catch(() => null),
			Settings.findOne().catch(() => null),
		]);

		let basePrice = service ? (service.bodyTypePricing?.[0]?.price || 20) : 20;

		if (service?.bodyTypePricing?.length) {
			const carTypeToBody = {
				compact: "Hatchback", sedan: "Sedan", suv: "SUV",
				van: "Van", luxury: "Sedan",
			};
			const bodyType = carTypeToBody[carType] || "Sedan";
			const match = service.bodyTypePricing.find((p) => p.bodyType === bodyType);
			if (match) basePrice = match.price;
		}

		let subscriptionDiscount = 0;
		if (customerId) {
			const customer = await Customer.findById(customerId).catch(() => null);
			if (customer?.subscription?.discountPercentage) {
				subscriptionDiscount = +(basePrice * (customer.subscription.discountPercentage / 100)).toFixed(2);
			}
		}

		const finalPrice = +(basePrice - subscriptionDiscount).toFixed(2);
		const commissionRate = settings?.commission?.customerCommission
			? settings.commission.customerCommission / 100
			: 0.1;
		const platformFee = +(finalPrice * commissionRate).toFixed(2);
		const partnerPayout = +(finalPrice - platformFee).toFixed(2);

		return success(res, {
			basePrice,
			isCustomPrice: false,
			bodyTypeDefault: basePrice,
			finalPrice,
			platformFee,
			partnerPayout,
			subscriptionDiscount: subscriptionDiscount > 0 ? subscriptionDiscount : undefined,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/admin/bookings ─────────────────────────────────────────────────

export const getAdminBookings = async (req, res) => {
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
		if (req.query.serviceCategory) filter.serviceCategory = req.query.serviceCategory;
		if (req.query.dateFrom) filter.slotDate = { $gte: req.query.dateFrom };
		if (req.query.dateTo) filter.slotDate = { ...filter.slotDate, $lte: req.query.dateTo };

		const [items, total] = await Promise.all([
			Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Booking.countDocuments(filter),
		]);

		return success(res, paginatedResponse(items.map(formatBooking), total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/services ───────────────────────────────────────────────────────

export const getPublicServices = async (req, res) => {
	try {
		const services = await Service.find({ status: "active" }).select(
			"_id name basePrice duration serviceCategory bodyTypePricing",
		);

		const formatted = services.map((s) => ({
			id: s._id,
			name: s.name,
			basePrice: s.basePrice || s.bodyTypePricing?.[0]?.price || 0,
			duration: s.duration || 30,
			category: s.serviceCategory,
		}));

		return success(res, formatted);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/subscriptions/plans ───────────────────────────────────────────

export const getSubscriptionPlans = async (req, res) => {
	try {
		const settings = await Settings.findOne().catch(() => null);
		const plans = settings?.subscriptionPlans;

		const defaultPlans = [
			{
				id: "plan_basic",
				tier: "basic",
				name: "Basic",
				price: 15,
				currency: "GBP",
				features: [
					"Access to nearby car wash locations",
					"Standard booking slots (non-peak hours)",
					"In-app booking & status tracking",
					"Basic customer support",
				],
				peakHoursAccess: false,
				priorityBooking: false,
				pickupDelivery: false,
				discountPercentage: 0,
			},
			{
				id: "plan_premium",
				tier: "premium",
				name: "Premium",
				price: 28,
				currency: "GBP",
				features: [
					"Priority booking & peak-time slots",
					"Pick-up & delivery option (where available)",
					"Discounted add-on services (e.g. wax, detailing)",
					"Premium support & faster issue resolution",
					"Exclusive partner offers & promotions",
				],
				peakHoursAccess: true,
				priorityBooking: true,
				pickupDelivery: true,
				discountPercentage: 10,
			},
		];

		if (plans?.basic || plans?.premium) {
			return success(res, [
				{
					id: "plan_basic",
					tier: "basic",
					name: plans.basic?.name || "Basic",
					price: plans.basic?.price || 15,
					features: plans.basic?.features || defaultPlans[0].features,
				},
				{
					id: "plan_premium",
					tier: "premium",
					name: plans.premium?.name || "Premium",
					price: plans.premium?.price || 28,
					features: plans.premium?.features || defaultPlans[1].features,
				},
			]);
		}

		return success(res, defaultPlans);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
