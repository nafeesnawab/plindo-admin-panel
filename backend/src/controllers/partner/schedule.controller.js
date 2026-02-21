import Booking from "../../models/Booking.model.js";
import PartnerAvailability from "../../models/PartnerAvailability.model.js";
import PartnerCapacity from "../../models/PartnerCapacity.model.js";
import { paginate, paginatedResponse } from "../../utils/pagination.js";
import { error, success } from "../../utils/response.js";

const timeToMinutes = (time) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

const getDefaultAvailability = (partnerId) => ({
	partnerId,
	schedule: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
		(dayName, index) => ({
			dayOfWeek: index,
			dayName,
			isEnabled: index !== 0,
			timeBlocks:
				index === 0
					? []
					: index === 6
						? [{ start: "09:00", end: "14:00" }]
						: [{ start: "08:00", end: "18:00" }],
		}),
	),
	bufferTimeMinutes: 15,
	maxAdvanceBookingDays: 14,
});

const getDefaultCapacity = (partnerId) => ({
	partnerId,
	bays: [
		{ id: "bay-w1", name: "Wash Bay 1", serviceCategory: "wash", isActive: true },
		{ id: "bay-w2", name: "Wash Bay 2", serviceCategory: "wash", isActive: true },
		{ id: "bay-w3", name: "Wash Bay 3", serviceCategory: "wash", isActive: true },
		{ id: "bay-d1", name: "Detail Bay 1", serviceCategory: "detailing", isActive: true },
	],
	capacityByCategory: { wash: 3, detailing: 1, other: 0 },
	bufferTimeMinutes: 15,
});

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
	partner: { id: b.partnerId, businessName: b.partnerBusinessName },
	vehicle: b.vehicle || {},
	service: {
		id: b.serviceId,
		name: b.serviceName,
		serviceType: b.serviceType,
		serviceCategory: b.serviceCategory,
		basePrice: b.pricing?.basePrice || 0,
		duration: b.serviceDuration || 0,
	},
	slot: { date: b.slotDate, startTime: b.slotStartTime, endTime: b.slotEndTime },
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
	cancellationReason: b.cancellationReason,
});

// ─── GET /api/partner/availability/weekly ────────────────────────────────────

export const getWeeklyAvailability = async (req, res) => {
	try {
		const partnerId = req.user.id;

		let availability = await PartnerAvailability.findOne({ partnerId });
		if (!availability) {
			const defaults = getDefaultAvailability(partnerId);
			availability = await PartnerAvailability.create(defaults);
		}

		const capacity = await PartnerCapacity.findOne({ partnerId });
		const cap = capacity || getDefaultCapacity(partnerId);

		return success(res, {
			id: availability._id,
			partnerId,
			schedule: availability.schedule,
			bufferTimeMinutes: availability.bufferTimeMinutes,
			maxAdvanceBookingDays: availability.maxAdvanceBookingDays,
			capacity: cap,
			updatedAt: availability.updatedAt,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── PUT /api/partner/availability/weekly ────────────────────────────────────

export const updateWeeklyAvailability = async (req, res) => {
	try {
		const partnerId = req.user.id;
		const { schedule, bufferTimeMinutes, maxAdvanceBookingDays } = req.body;

		const availability = await PartnerAvailability.findOneAndUpdate(
			{ partnerId },
			{
				...(schedule && { schedule }),
				...(bufferTimeMinutes !== undefined && { bufferTimeMinutes }),
				...(maxAdvanceBookingDays !== undefined && { maxAdvanceBookingDays }),
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true },
		);

		return success(res, availability, "Availability updated successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/partner/capacity ───────────────────────────────────────────────

export const getCapacity = async (req, res) => {
	try {
		const partnerId = req.user.id;
		let capacity = await PartnerCapacity.findOne({ partnerId });
		if (!capacity) {
			capacity = await PartnerCapacity.create(getDefaultCapacity(partnerId));
		}
		return success(res, capacity);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── PUT /api/partner/capacity ───────────────────────────────────────────────

export const updateCapacity = async (req, res) => {
	try {
		const partnerId = req.user.id;
		const { capacityByCategory, bufferTimeMinutes } = req.body;

		const categories = ["wash", "detailing", "other"];
		const categoryLabels = { wash: "Wash Bay", detailing: "Detail Bay", other: "Bay" };
		const categoryPrefixes = { wash: "bay-w", detailing: "bay-d", other: "bay-o" };

		let bays = [];
		if (capacityByCategory) {
			for (const cat of categories) {
				const count = capacityByCategory[cat] || 0;
				for (let i = 1; i <= count; i++) {
					bays.push({
						id: `${categoryPrefixes[cat]}${i}`,
						name: `${categoryLabels[cat]} ${i}`,
						serviceCategory: cat,
						isActive: true,
					});
				}
			}
		}

		const capacity = await PartnerCapacity.findOneAndUpdate(
			{ partnerId },
			{
				...(capacityByCategory && { capacityByCategory, bays }),
				...(bufferTimeMinutes !== undefined && { bufferTimeMinutes }),
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true },
		);

		return success(res, capacity, "Capacity updated successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/partner/bookings ───────────────────────────────────────────────

export const getPartnerBookings = async (req, res) => {
	try {
		const partnerId = req.user.id;
		const { page, limit, skip } = paginate(req.query);

		const filter = { partnerId };
		if (req.query.startDate) filter.slotDate = { $gte: req.query.startDate };
		if (req.query.endDate) filter.slotDate = { ...filter.slotDate, $lte: req.query.endDate };
		if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
		if (req.query.serviceCategory) filter.serviceCategory = req.query.serviceCategory;

		const [items, total] = await Promise.all([
			Booking.find(filter)
				.sort({ slotDate: 1, slotStartTime: 1 })
				.skip(skip)
				.limit(limit),
			Booking.countDocuments(filter),
		]);

		return success(res, paginatedResponse(items.map(formatBooking), total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── GET /api/partner/bookings/timeline ──────────────────────────────────────

export const getBookingsTimeline = async (req, res) => {
	try {
		const partnerId = req.user.id;
		const { weekStart } = req.query;

		const startDate = weekStart ? new Date(weekStart) : new Date();
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 7);

		const startStr = startDate.toISOString().split("T")[0];
		const endStr = endDate.toISOString().split("T")[0];

		const bookings = await Booking.find({
			partnerId,
			slotDate: { $gte: startStr, $lt: endStr },
		}).sort({ slotDate: 1, slotStartTime: 1 });

		const capacity = await PartnerCapacity.findOne({ partnerId });
		const cap = capacity || getDefaultCapacity(partnerId);

		const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		const days = [];

		for (let i = 0; i < 7; i++) {
			const currentDate = new Date(startDate);
			currentDate.setDate(currentDate.getDate() + i);
			const dateStr = currentDate.toISOString().split("T")[0];

			const dayBookings = bookings
				.filter((b) => b.slotDate === dateStr)
				.map(formatBooking);

			const washBookings = dayBookings.filter((b) => b.service.serviceCategory === "wash" && b.status !== "cancelled");
			const detailBookings = dayBookings.filter((b) => b.service.serviceCategory === "detailing" && b.status !== "cancelled");

			days.push({
				date: dateStr,
				dayOfWeek: dayNames[currentDate.getDay()],
				bookings: dayBookings,
				capacityUsage: {
					wash: { used: washBookings.length, total: cap.capacityByCategory.wash },
					detailing: { used: detailBookings.length, total: cap.capacityByCategory.detailing },
				},
			});
		}

		return success(res, { weekStart: startStr, days });
	} catch (err) {
		return error(res, err.message, 500);
	}
};
