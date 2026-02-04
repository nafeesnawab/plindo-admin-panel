import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import type {
	BookingPricing,
	BookingSlot,
	BookingStatus,
	CarType,
	CustomerInfo,
	CustomerSubscription,
	DayAvailability,
	DayBookings,
	PartnerInfo,
	ServiceInfo,
	SlotBooking,
	SubscriptionPlan,
	TimeSlot,
	VehicleInfo,
	WeekBookings,
	WeeklyAvailability,
} from "@/types/booking";
import { ResultStatus } from "@/types/enum";

// ============ CONSTANTS ============

const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
	basic: {
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
	premium: {
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
};

const CAR_TYPE_MULTIPLIERS_MAP: Record<CarType, number> = {
	compact: 1.0,
	sedan: 1.2,
	suv: 1.4,
	van: 1.6,
	luxury: 1.8,
};

const SERVICES = [
	{ id: "svc_basic", name: "Basic Wash", basePrice: 12, duration: 30 },
	{ id: "svc_premium", name: "Premium Wash", basePrice: 20, duration: 45 },
	{ id: "svc_interior", name: "Interior Cleaning", basePrice: 25, duration: 45 },
	{ id: "svc_full", name: "Full Detail", basePrice: 45, duration: 90 },
	{ id: "svc_express", name: "Express Wash", basePrice: 8, duration: 20 },
	{ id: "svc_wax", name: "Wax & Polish", basePrice: 35, duration: 60 },
];

const CAR_TYPES: CarType[] = ["compact", "sedan", "suv", "van", "luxury"];

// ============ IN-MEMORY STORES ============

const availabilityStore = new Map<string, WeeklyAvailability>();
const bookingsStore = new Map<string, SlotBooking>();
const customerSubscriptions = new Map<string, CustomerSubscription>();

// ============ HELPER FUNCTIONS ============

const generateTimeSlots = (startHour: number, endHour: number, durationMinutes: number): TimeSlot[] => {
	const slots: TimeSlot[] = [];
	let currentMinutes = startHour * 60;
	const endMinutes = endHour * 60;

	while (currentMinutes + durationMinutes <= endMinutes) {
		const startHr = Math.floor(currentMinutes / 60);
		const startMin = currentMinutes % 60;
		const endHr = Math.floor((currentMinutes + durationMinutes) / 60);
		const endMin = (currentMinutes + durationMinutes) % 60;

		slots.push({
			id: faker.string.uuid(),
			startTime: `${startHr.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`,
			endTime: `${endHr.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`,
			isAvailable: true,
		});

		currentMinutes += durationMinutes;
	}

	return slots;
};

const createDefaultAvailability = (partnerId: string): WeeklyAvailability => {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const schedule: DayAvailability[] = days.map((dayName, index) => {
		const isSunday = index === 0;
		const isSaturday = index === 6;

		return {
			dayOfWeek: index,
			dayName,
			isEnabled: !isSunday,
			slots: isSunday ? [] : generateTimeSlots(isSaturday ? 9 : 8, isSaturday ? 14 : 18, 30),
		};
	});

	return {
		id: faker.string.uuid(),
		partnerId,
		schedule,
		slotDurationMinutes: 30,
		bufferTimeMinutes: 15,
		maxAdvanceBookingDays: 14,
		updatedAt: new Date().toISOString(),
	};
};

const generateBookingNumber = () => {
	const prefix = "BK";
	const date = new Date();
	const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
	const random = faker.string.alphanumeric({ length: 6, casing: "upper" });
	return `${prefix}-${dateStr}-${random}`;
};

const generatePartnerName = () => {
	const prefixes = ["Crystal", "Sparkle", "Diamond", "Premium", "Express", "Pro", "Elite", "Golden"];
	const suffixes = ["Car Wash", "Auto Spa", "Detailing", "Car Care"];
	return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(suffixes)}`;
};

const cyprusCities = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia"];
const vehicleMakes = ["Toyota", "Mercedes-Benz", "BMW", "Volkswagen", "Audi", "Honda", "Nissan"];

const calculatePricing = (
	service: ServiceInfo,
	carType: CarType,
	subscription?: CustomerSubscription,
): BookingPricing => {
	const basePrice = service.basePrice;
	const multiplier = CAR_TYPE_MULTIPLIERS_MAP[carType];
	let finalPrice = basePrice * multiplier;

	let subscriptionDiscount = 0;
	if (subscription?.plan.discountPercentage) {
		subscriptionDiscount = finalPrice * (subscription.plan.discountPercentage / 100);
		finalPrice -= subscriptionDiscount;
	}

	const platformFee = +(finalPrice * 0.1).toFixed(2);
	const partnerPayout = +(finalPrice - platformFee).toFixed(2);

	return {
		basePrice,
		carTypeMultiplier: multiplier,
		finalPrice: +finalPrice.toFixed(2),
		platformFee,
		partnerPayout,
		subscriptionDiscount: subscriptionDiscount > 0 ? +subscriptionDiscount.toFixed(2) : undefined,
	};
};

// Helper to format date as YYYY-MM-DD
const formatDateStr = (date: Date): string => {
	return date.toISOString().split("T")[0];
};

// Helper to add days to a date
const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

// Generate mock bookings with realistic dates relative to current time
const generateMockBookings = () => {
	const today = new Date();
	const currentHour = today.getHours();

	// Define time slots for the day
	const timeSlots = [
		{ start: "08:00", end: "09:00" },
		{ start: "09:00", end: "10:00" },
		{ start: "10:00", end: "11:00" },
		{ start: "11:00", end: "12:00" },
		{ start: "13:00", end: "14:00" },
		{ start: "14:00", end: "15:00" },
		{ start: "15:00", end: "16:00" },
		{ start: "16:00", end: "17:00" },
		{ start: "17:00", end: "18:00" },
	];

	const createBooking = (
		date: Date,
		slotIndex: number,
		status: BookingStatus,
		partnerId: string = "demo-partner-1",
	): SlotBooking => {
		const service = faker.helpers.arrayElement(SERVICES);
		const carType = faker.helpers.arrayElement(CAR_TYPES);
		const slot = timeSlots[slotIndex % timeSlots.length];

		const customer: CustomerInfo = {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			phone: faker.phone.number("+357 9# ### ###"),
			avatar: faker.image.avatarGitHub(),
			subscription: faker.helpers.maybe(() => ({
				id: faker.string.uuid(),
				customerId: faker.string.uuid(),
				plan: faker.helpers.arrayElement([SUBSCRIPTION_PLANS.basic, SUBSCRIPTION_PLANS.premium]),
				status: "active" as const,
				startDate: faker.date.past().toISOString(),
				endDate: faker.date.future().toISOString(),
				autoRenew: true,
			})),
		};

		const partner: PartnerInfo = {
			id: partnerId,
			businessName: "Crystal Car Wash",
			ownerName: "John Smith",
			phone: faker.phone.number("+357 9# ### ###"),
			location: `${faker.helpers.arrayElement(cyprusCities)}, Cyprus`,
			address: faker.location.streetAddress(),
			rating: 4.8,
		};

		const vehicle: VehicleInfo = {
			id: faker.string.uuid(),
			make: faker.helpers.arrayElement(vehicleMakes),
			model: faker.vehicle.model(),
			year: faker.number.int({ min: 2018, max: 2024 }),
			color: faker.helpers.arrayElement(["Black", "White", "Silver", "Blue", "Red"]),
			plateNumber: `${faker.string.alpha({ length: 3, casing: "upper" })} ${faker.number.int({ min: 100, max: 999 })}`,
			type: carType,
		};

		const bookingSlot: BookingSlot = {
			date: formatDateStr(date),
			startTime: slot.start,
			endTime: slot.end,
		};

		const serviceInfo: ServiceInfo = {
			id: service.id,
			name: service.name,
			basePrice: service.basePrice,
			duration: service.duration,
		};

		const pricing = calculatePricing(serviceInfo, carType, customer.subscription);
		const createdAt = addDays(date, -faker.number.int({ min: 1, max: 7 }));

		const booking: SlotBooking = {
			id: faker.string.uuid(),
			bookingNumber: generateBookingNumber(),
			customer,
			partner,
			vehicle,
			service: serviceInfo,
			slot: bookingSlot,
			pricing,
			status,
			createdAt: createdAt.toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Add status-specific fields
		if (status === "cancelled") {
			booking.cancelledAt = faker.date.recent({ days: 3 }).toISOString();
			booking.cancelledBy = faker.helpers.arrayElement(["customer", "partner"] as const);
			booking.cancellationReason = faker.helpers.arrayElement(["Schedule conflict", "Emergency", "Weather conditions"]);
		}

		if (status === "completed") {
			booking.startedAt = new Date(date.getTime() + parseInt(slot.start.split(":")[0]) * 3600000).toISOString();
			booking.completedAt = new Date(date.getTime() + parseInt(slot.end.split(":")[0]) * 3600000).toISOString();
			if (faker.datatype.boolean()) {
				booking.rating = {
					score: faker.number.int({ min: 4, max: 5 }),
					comment: faker.helpers.maybe(() => faker.lorem.sentence()),
					createdAt: faker.date.recent({ days: 2 }).toISOString(),
				};
			}
		}

		if (status === "in_progress") {
			booking.startedAt = new Date().toISOString();
		}

		return booking;
	};

	// Generate PAST bookings (completed) - last 5 days
	for (let dayOffset = -5; dayOffset < 0; dayOffset++) {
		const date = addDays(today, dayOffset);
		// Skip weekends for past bookings
		if (date.getDay() === 0) continue; // Sunday

		// 2-4 bookings per past day, all completed
		const numBookings = faker.number.int({ min: 2, max: 4 });
		const usedSlots = new Set<number>();

		for (let i = 0; i < numBookings; i++) {
			let slotIdx: number;
			do {
				slotIdx = faker.number.int({ min: 0, max: timeSlots.length - 1 });
			} while (usedSlots.has(slotIdx));
			usedSlots.add(slotIdx);

			const booking = createBooking(date, slotIdx, "completed");
			bookingsStore.set(booking.id, booking);
		}
	}

	// Generate TODAY's bookings
	const todaySlots = new Set<number>();

	// Past slots today - completed
	for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
		const slotHour = parseInt(timeSlots[slotIdx].start.split(":")[0]);

		if (slotHour < currentHour - 1) {
			// Past slot - 60% chance of having a completed booking
			if (faker.datatype.boolean(0.6)) {
				const booking = createBooking(today, slotIdx, "completed");
				bookingsStore.set(booking.id, booking);
				todaySlots.add(slotIdx);
			}
		} else if (slotHour === currentHour || slotHour === currentHour - 1) {
			// Current slot - might be in progress
			if (faker.datatype.boolean(0.7)) {
				const booking = createBooking(today, slotIdx, "in_progress");
				bookingsStore.set(booking.id, booking);
				todaySlots.add(slotIdx);
			}
		} else if (slotHour > currentHour) {
			// Future slot today - booked bookings
			if (faker.datatype.boolean(0.5)) {
				const booking = createBooking(today, slotIdx, "booked");
				bookingsStore.set(booking.id, booking);
				todaySlots.add(slotIdx);
			}
		}
	}

	// Generate FUTURE bookings (booked) - next 7 days
	for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
		const date = addDays(today, dayOffset);
		// Skip Sundays
		if (date.getDay() === 0) continue;

		// 1-3 bookings per future day
		const numBookings = faker.number.int({ min: 1, max: 3 });
		const usedSlots = new Set<number>();

		for (let i = 0; i < numBookings; i++) {
			let slotIdx: number;
			do {
				slotIdx = faker.number.int({ min: 0, max: timeSlots.length - 1 });
			} while (usedSlots.has(slotIdx));
			usedSlots.add(slotIdx);

			const booking = createBooking(date, slotIdx, "booked");
			bookingsStore.set(booking.id, booking);
		}
	}

	// Add a few cancelled bookings for variety
	for (let i = 0; i < 3; i++) {
		const dayOffset = faker.number.int({ min: -3, max: 3 });
		const date = addDays(today, dayOffset);
		if (date.getDay() === 0) continue;

		const slotIdx = faker.number.int({ min: 0, max: timeSlots.length - 1 });
		const booking = createBooking(date, slotIdx, "cancelled");
		bookingsStore.set(booking.id, booking);
	}
};

// Initialize mock data
generateMockBookings();
availabilityStore.set("demo-partner-1", createDefaultAvailability("demo-partner-1"));

// ============ API HANDLERS ============

// Get partner's weekly availability
export const getPartnerAvailability = http.get("/api/partner/availability/weekly", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	if (!availabilityStore.has(partnerId)) {
		availabilityStore.set(partnerId, createDefaultAvailability(partnerId));
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: availabilityStore.get(partnerId),
	});
});

// Update partner's weekly availability
export const updatePartnerAvailability = http.put("/api/partner/availability/weekly", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Partial<WeeklyAvailability>;

	const existing = availabilityStore.get(partnerId) || createDefaultAvailability(partnerId);
	const updated: WeeklyAvailability = {
		...existing,
		...body,
		updatedAt: new Date().toISOString(),
	};

	availabilityStore.set(partnerId, updated);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Availability updated successfully",
		data: updated,
	});
});

// Get available slots for a specific date
export const getAvailableSlots = http.get("/api/bookings/slots", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const date = url.searchParams.get("date");
	// serviceId can be used for duration-based slot filtering in the future
	const _serviceId = url.searchParams.get("serviceId");

	if (!date) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Date is required" }, { status: 400 });
	}

	const availability = availabilityStore.get(partnerId) || createDefaultAvailability(partnerId);
	// Parse date as local to avoid timezone issues (YYYY-MM-DD format)
	const [year, month, day] = date.split("-").map(Number);
	const requestedDate = new Date(year, month - 1, day);
	const dayOfWeek = requestedDate.getDay();
	const dayAvailability = availability.schedule.find((d) => d.dayOfWeek === dayOfWeek);

	if (!dayAvailability || !dayAvailability.isEnabled) {
		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			data: {
				date,
				slots: [],
				message: "Partner is not available on this day",
			},
		});
	}

	// Check which slots are already booked
	const bookedSlots = Array.from(bookingsStore.values())
		.filter((b) => b.partner.id === partnerId && b.slot.date === date && b.status !== "cancelled")
		.map((b) => b.slot.startTime);

	const availableSlots = dayAvailability.slots.map((slot) => ({
		...slot,
		isAvailable: !bookedSlots.includes(slot.startTime),
	}));

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			date,
			slots: availableSlots,
			partnerId,
		},
	});
});

// Create a new booking (customer books a slot)
export const createSlotBooking = http.post("/api/bookings/slot", async ({ request }) => {
	await delay(300);
	const body = (await request.json()) as {
		partnerId: string;
		customerId: string;
		vehicleId: string;
		serviceId: string;
		slot: BookingSlot;
		carType: CarType;
	};

	// Validate 2-week advance limit
	const slotDate = new Date(body.slot.date);
	const today = new Date();
	const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

	if (slotDate > twoWeeksFromNow) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Bookings can only be made up to 2 weeks in advance" },
			{ status: 400 },
		);
	}

	const service = SERVICES.find((s) => s.id === body.serviceId) || SERVICES[0];

	const customer: CustomerInfo = {
		id: body.customerId,
		name: faker.person.fullName(),
		email: faker.internet.email(),
		phone: faker.phone.number("+357 9# ### ###"),
		avatar: faker.image.avatarGitHub(),
	};

	const partner: PartnerInfo = {
		id: body.partnerId,
		businessName: generatePartnerName(),
		ownerName: faker.person.fullName(),
		phone: faker.phone.number("+357 9# ### ###"),
		location: `${faker.helpers.arrayElement(cyprusCities)}, Cyprus`,
		address: faker.location.streetAddress(),
		rating: faker.number.float({ min: 4, max: 5, fractionDigits: 1 }),
	};

	const vehicle: VehicleInfo = {
		id: body.vehicleId,
		make: faker.helpers.arrayElement(vehicleMakes),
		model: faker.vehicle.model(),
		year: faker.number.int({ min: 2018, max: 2024 }),
		color: faker.helpers.arrayElement(["Black", "White", "Silver"]),
		plateNumber: `${faker.string.alpha({ length: 3, casing: "upper" })} ${faker.number.int({ min: 100, max: 999 })}`,
		type: body.carType,
	};

	const serviceInfo: ServiceInfo = {
		id: service.id,
		name: service.name,
		basePrice: service.basePrice,
		duration: service.duration,
	};

	const pricing = calculatePricing(serviceInfo, body.carType);

	const booking: SlotBooking = {
		id: faker.string.uuid(),
		bookingNumber: generateBookingNumber(),
		customer,
		partner,
		vehicle,
		service: serviceInfo,
		slot: body.slot,
		pricing,
		status: "booked", // Auto-booked when customer selects a slot
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	bookingsStore.set(booking.id, booking);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking created successfully",
		data: booking,
	});
});

// Get partner's bookings (timeline view)
export const getPartnerBookings = http.get("/api/partner/bookings", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const startDate = url.searchParams.get("startDate");
	const endDate = url.searchParams.get("endDate");
	const status = url.searchParams.get("status");
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "20");

	let bookings = Array.from(bookingsStore.values()).filter((b) => b.partner.id === partnerId);

	if (startDate) {
		bookings = bookings.filter((b) => b.slot.date >= startDate);
	}
	if (endDate) {
		bookings = bookings.filter((b) => b.slot.date <= endDate);
	}
	if (status && status !== "all") {
		bookings = bookings.filter((b) => b.status === status);
	}

	// Sort by date and time
	bookings.sort((a, b) => {
		const dateCompare = a.slot.date.localeCompare(b.slot.date);
		if (dateCompare !== 0) return dateCompare;
		return a.slot.startTime.localeCompare(b.slot.startTime);
	});

	const total = bookings.length;
	const start = (page - 1) * limit;
	const paginatedBookings = bookings.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			items: paginatedBookings,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get bookings grouped by day (for timeline view)
export const getBookingsTimeline = http.get("/api/partner/bookings/timeline", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const weekStart = url.searchParams.get("weekStart");

	const startDate = weekStart ? new Date(weekStart) : new Date();
	startDate.setHours(0, 0, 0, 0);

	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + 7);

	const bookings = Array.from(bookingsStore.values()).filter((b) => {
		const bookingDate = new Date(b.slot.date);
		return b.partner.id === partnerId && bookingDate >= startDate && bookingDate < endDate;
	});

	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const days: DayBookings[] = [];

	for (let i = 0; i < 7; i++) {
		const currentDate = new Date(startDate);
		currentDate.setDate(currentDate.getDate() + i);
		const dateStr = currentDate.toISOString().split("T")[0];

		const dayBookings = bookings
			.filter((b) => b.slot.date === dateStr)
			.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));

		days.push({
			date: dateStr,
			dayOfWeek: dayNames[currentDate.getDay()],
			bookings: dayBookings,
			totalBookings: dayBookings.length,
			completedCount: dayBookings.filter((b) => b.status === "completed").length,
			cancelledCount: dayBookings.filter((b) => b.status === "cancelled").length,
		});
	}

	const weekData: WeekBookings = {
		weekStart: startDate.toISOString().split("T")[0],
		weekEnd: endDate.toISOString().split("T")[0],
		days,
		totalBookings: bookings.length,
		totalRevenue: bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.pricing.partnerPayout, 0),
	};

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: weekData,
	});
});

// Cancel booking (by partner or customer)
export const cancelSlotBooking = http.post("/api/bookings/:id/cancel", async ({ params, request }) => {
	await delay(200);
	const { id } = params;
	const body = (await request.json()) as { reason: string; cancelledBy: "customer" | "partner" };

	const booking = bookingsStore.get(id as string);
	if (!booking) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking not found" }, { status: 404 });
	}

	if (booking.status === "cancelled") {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking is already cancelled" }, { status: 400 });
	}

	if (booking.status === "completed") {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Cannot cancel a completed booking" },
			{ status: 400 },
		);
	}

	const updatedBooking: SlotBooking = {
		...booking,
		status: "cancelled",
		cancelledAt: new Date().toISOString(),
		cancelledBy: body.cancelledBy,
		cancellationReason: body.reason,
		updatedAt: new Date().toISOString(),
	};

	bookingsStore.set(id as string, updatedBooking);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking cancelled successfully",
		data: updatedBooking,
	});
});

// Reschedule booking (by partner or customer)
export const rescheduleSlotBooking = http.post("/api/bookings/:id/reschedule", async ({ params, request }) => {
	await delay(200);
	const { id } = params;
	const body = (await request.json()) as {
		newSlot: BookingSlot;
		reason?: string;
		rescheduledBy: "customer" | "partner";
	};

	const booking = bookingsStore.get(id as string);
	if (!booking) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking not found" }, { status: 404 });
	}

	if (booking.status === "cancelled" || booking.status === "completed") {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Cannot reschedule this booking" },
			{ status: 400 },
		);
	}

	// Validate 2-week advance limit
	const newSlotDate = new Date(body.newSlot.date);
	const today = new Date();
	const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

	if (newSlotDate > twoWeeksFromNow) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "Bookings can only be rescheduled up to 2 weeks in advance" },
			{ status: 400 },
		);
	}

	const updatedBooking: SlotBooking = {
		...booking,
		rescheduledFrom: booking.slot,
		slot: body.newSlot,
		rescheduledAt: new Date().toISOString(),
		rescheduledBy: body.rescheduledBy,
		updatedAt: new Date().toISOString(),
	};

	bookingsStore.set(id as string, updatedBooking);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking rescheduled successfully",
		data: updatedBooking,
	});
});

// Update booking status (start service, complete service)
export const updateBookingStatus = http.patch("/api/bookings/:id/status", async ({ params, request }) => {
	await delay(200);
	const { id } = params;
	const body = (await request.json()) as { status: BookingStatus };

	const booking = bookingsStore.get(id as string);
	if (!booking) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking not found" }, { status: 404 });
	}

	const updatedBooking: SlotBooking = {
		...booking,
		status: body.status,
		updatedAt: new Date().toISOString(),
		...(body.status === "in_progress" && { startedAt: new Date().toISOString() }),
		...(body.status === "completed" && { completedAt: new Date().toISOString() }),
	};

	bookingsStore.set(id as string, updatedBooking);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking status updated",
		data: updatedBooking,
	});
});

// Get booking details
export const getSlotBookingDetails = http.get("/api/bookings/slot/:id", async ({ params }) => {
	await delay(200);
	const { id } = params;

	const booking = bookingsStore.get(id as string);
	if (!booking) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking not found" }, { status: 404 });
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: booking,
	});
});

// Get all bookings (admin view)
export const getAllSlotBookings = http.get("/api/admin/bookings", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const search = url.searchParams.get("search") || "";
	const status = url.searchParams.get("status");
	const partnerId = url.searchParams.get("partnerId");
	const customerId = url.searchParams.get("customerId");
	const dateFrom = url.searchParams.get("dateFrom");
	const dateTo = url.searchParams.get("dateTo");

	let bookings = Array.from(bookingsStore.values());

	if (search) {
		const searchLower = search.toLowerCase();
		bookings = bookings.filter(
			(b) =>
				b.bookingNumber.toLowerCase().includes(searchLower) ||
				b.customer.name.toLowerCase().includes(searchLower) ||
				b.partner.businessName.toLowerCase().includes(searchLower),
		);
	}

	if (status && status !== "all") {
		bookings = bookings.filter((b) => b.status === status);
	}

	if (partnerId) {
		bookings = bookings.filter((b) => b.partner.id === partnerId);
	}

	if (customerId) {
		bookings = bookings.filter((b) => b.customer.id === customerId);
	}

	if (dateFrom) {
		bookings = bookings.filter((b) => b.slot.date >= dateFrom);
	}

	if (dateTo) {
		bookings = bookings.filter((b) => b.slot.date <= dateTo);
	}

	// Sort by created date descending
	bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	const total = bookings.length;
	const start = (page - 1) * limit;
	const paginatedBookings = bookings.slice(start, start + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			items: paginatedBookings,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get subscription plans
export const getSubscriptionPlans = http.get("/api/subscriptions/plans", async () => {
	await delay(100);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: Object.values(SUBSCRIPTION_PLANS),
	});
});

// Get customer subscription
export const getCustomerSubscription = http.get("/api/subscriptions/:customerId", async ({ params }) => {
	await delay(100);
	const { customerId } = params;
	const subscription = customerSubscriptions.get(customerId as string);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: subscription || null,
	});
});

// Get services list
export const getServicesList = http.get("/api/services", async () => {
	await delay(100);
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: SERVICES,
	});
});

// Calculate price preview
export const calculatePrice = http.post("/api/bookings/calculate-price", async ({ request }) => {
	await delay(100);
	const body = (await request.json()) as {
		serviceId: string;
		carType: CarType;
		customerId?: string;
	};

	const service = SERVICES.find((s) => s.id === body.serviceId);
	if (!service) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Service not found" }, { status: 404 });
	}

	const serviceInfo: ServiceInfo = {
		id: service.id,
		name: service.name,
		basePrice: service.basePrice,
		duration: service.duration,
	};

	let subscription: CustomerSubscription | undefined;
	if (body.customerId) {
		subscription = customerSubscriptions.get(body.customerId);
	}

	const pricing = calculatePricing(serviceInfo, body.carType, subscription);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: pricing,
	});
});

export const slotBookingHandlers = [
	// Availability
	getPartnerAvailability,
	updatePartnerAvailability,
	getAvailableSlots,
	// Bookings
	createSlotBooking,
	getPartnerBookings,
	getBookingsTimeline,
	cancelSlotBooking,
	rescheduleSlotBooking,
	updateBookingStatus,
	getSlotBookingDetails,
	getAllSlotBookings,
	// Subscriptions
	getSubscriptionPlans,
	getCustomerSubscription,
	// Services & Pricing
	getServicesList,
	calculatePrice,
];
