import { faker } from "@faker-js/faker";
import { delay, HttpResponse, http } from "msw";
import type {
	AvailableWindow,
	Bay,
	BookingPricing,
	BookingProductOrder,
	BookingSlot,
	BookingStatus,
	CarType,
	CustomerInfo,
	CustomerSubscription,
	DayAvailability,
	DayBookings,
	PartnerCapacity,
	PartnerInfo,
	ServiceCategory,
	ServiceInfo,
	ServiceStep,
	ServiceType,
	SlotBooking,
	SubscriptionPlan,
	VehicleInfo,
	WeekBookings,
	WeeklyAvailability,
} from "@/types/booking";
import {
	PICK_BY_ME_PREFIX_STEPS,
	PICK_BY_ME_SUFFIX_STEPS,
	SERVICE_STEPS_TEMPLATE,
	WASHING_VAN_PREFIX_STEPS,
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

// TODO: Phase 5 — use this mapping to look up body type pricing from partner services
// const BODY_TYPE_FROM_CAR_TYPE: Record<CarType, string> = {
// 	compact: "Hatchback",
// 	sedan: "Sedan",
// 	suv: "SUV",
// 	van: "Van",
// 	luxury: "Sedan",
// };

// Services now include serviceCategory
const SERVICES: Array<{
	id: string;
	name: string;
	basePrice: number;
	duration: number;
	category: ServiceCategory;
}> = [
	{ id: "svc_basic", name: "Basic Wash", basePrice: 12, duration: 30, category: "wash" },
	{ id: "svc_premium", name: "Premium Wash", basePrice: 20, duration: 45, category: "wash" },
	{ id: "svc_express", name: "Express Wash", basePrice: 8, duration: 20, category: "wash" },
	{ id: "svc_interior", name: "Interior Cleaning", basePrice: 25, duration: 60, category: "detailing" },
	{ id: "svc_full", name: "Full Detail", basePrice: 45, duration: 180, category: "detailing" },
	{ id: "svc_wax", name: "Wax & Polish", basePrice: 35, duration: 90, category: "detailing" },
];

const SERVICE_TYPES: ServiceType[] = ["book_me", "pick_by_me", "washing_van"];

const ADDON_PRODUCTS = [
	{ name: "Premium Engine Oil 5W-30", price: 42.99 },
	{ name: "Car Wash Shampoo 1L", price: 8.99 },
	{ name: "Air Freshener", price: 4.99 },
	{ name: "Microfiber Cleaning Cloth Set", price: 14.99 },
	{ name: "Tire Shine Gel", price: 9.99 },
	{ name: "Leather Conditioner", price: 13.99 },
	{ name: "Glass Cleaner Spray", price: 6.5 },
	{ name: "Wiper Blade Set", price: 24.99 },
];

const CAR_TYPES: CarType[] = ["compact", "sedan", "suv", "van", "luxury"];
const cyprusCities = ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia"];
const vehicleMakes = ["Toyota", "Mercedes-Benz", "BMW", "Volkswagen", "Audi", "Honda", "Nissan"];

// ============ HELPER: Build service steps ============

const buildServiceSteps = (
	serviceId: string,
	serviceType: ServiceType,
	bookingStatus: BookingStatus,
): ServiceStep[] => {
	const baseStepNames = SERVICE_STEPS_TEMPLATE[serviceId] || ["Wash", "Dry"];
	let allStepNames = [...baseStepNames];

	if (serviceType === "pick_by_me") {
		allStepNames = [...PICK_BY_ME_PREFIX_STEPS, ...allStepNames, ...PICK_BY_ME_SUFFIX_STEPS];
	} else if (serviceType === "washing_van") {
		allStepNames = [...WASHING_VAN_PREFIX_STEPS, ...allStepNames];
	}

	return allStepNames.map((name, index) => {
		let status: ServiceStep["status"] = "pending";

		if (bookingStatus === "completed" || bookingStatus === "delivered") {
			status = "completed";
		} else if (bookingStatus === "in_progress") {
			const progressPoint = Math.floor(allStepNames.length * 0.4);
			if (index < progressPoint) status = "completed";
			else if (index === progressPoint) status = "in_progress";
		}

		return {
			id: faker.string.uuid(),
			name,
			status,
			startedAt: status !== "pending" ? faker.date.recent({ days: 1 }).toISOString() : undefined,
			completedAt: status === "completed" ? faker.date.recent({ days: 1 }).toISOString() : undefined,
			order: index,
		};
	});
};

const maybeGenerateProductOrder = (): BookingProductOrder | undefined => {
	if (!faker.datatype.boolean(0.3)) return undefined;
	const count = faker.number.int({ min: 1, max: 3 });
	const selectedProducts = faker.helpers.arrayElements(ADDON_PRODUCTS, count);
	const total = selectedProducts.reduce((sum, p) => sum + p.price, 0);
	return {
		orderNumber: `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
		productCount: count,
		totalAmount: Math.round(total * 100) / 100,
	};
};

// ============ IN-MEMORY STORES ============

const availabilityStore = new Map<string, WeeklyAvailability>();
const bookingsStore = new Map<string, SlotBooking>();
const customerSubscriptions = new Map<string, CustomerSubscription>();
const capacityStore = new Map<string, PartnerCapacity>();

// ============ DEFAULT CAPACITY ============

const createDefaultCapacity = (partnerId: string): PartnerCapacity => {
	const bays: Bay[] = [
		// 5 wash bays
		{ id: "bay-w1", name: "Wash Bay 1", serviceCategory: "wash", isActive: true },
		{ id: "bay-w2", name: "Wash Bay 2", serviceCategory: "wash", isActive: true },
		{ id: "bay-w3", name: "Wash Bay 3", serviceCategory: "wash", isActive: true },
		{ id: "bay-w4", name: "Wash Bay 4", serviceCategory: "wash", isActive: true },
		{ id: "bay-w5", name: "Wash Bay 5", serviceCategory: "wash", isActive: true },
		// 2 detailing bays
		{ id: "bay-d1", name: "Detail Bay 1", serviceCategory: "detailing", isActive: true },
		{ id: "bay-d2", name: "Detail Bay 2", serviceCategory: "detailing", isActive: true },
	];

	return {
		partnerId,
		bays,
		capacityByCategory: { wash: 5, detailing: 2, other: 0 },
		bufferTimeMinutes: 15,
	};
};

// ============ DEFAULT AVAILABILITY ============

const createDefaultAvailability = (partnerId: string): WeeklyAvailability => {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const schedule: DayAvailability[] = days.map((dayName, index) => {
		const isSunday = index === 0;
		const isSaturday = index === 6;

		return {
			dayOfWeek: index,
			dayName,
			isEnabled: !isSunday,
			timeBlocks: isSunday ? [] : isSaturday ? [{ start: "09:00", end: "14:00" }] : [{ start: "08:00", end: "18:00" }],
		};
	});

	const capacity = capacityStore.get(partnerId) || createDefaultCapacity(partnerId);
	if (!capacityStore.has(partnerId)) {
		capacityStore.set(partnerId, capacity);
	}

	return {
		id: faker.string.uuid(),
		partnerId,
		schedule,
		bufferTimeMinutes: 15,
		maxAdvanceBookingDays: 14,
		capacity,
		updatedAt: new Date().toISOString(),
	};
};

// ============ HELPER FUNCTIONS ============

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

const calculatePricing = (
	service: ServiceInfo,
	_carType: CarType,
	subscription?: CustomerSubscription,
): BookingPricing => {
	const basePrice = service.basePrice;
	let finalPrice = basePrice;

	let subscriptionDiscount = 0;
	if (subscription?.plan.discountPercentage) {
		subscriptionDiscount = finalPrice * (subscription.plan.discountPercentage / 100);
		finalPrice -= subscriptionDiscount;
	}

	const platformFee = +(finalPrice * 0.1).toFixed(2);
	const partnerPayout = +(finalPrice - platformFee).toFixed(2);

	return {
		basePrice,
		isCustomPrice: false,
		bodyTypeDefault: basePrice,
		finalPrice: +finalPrice.toFixed(2),
		platformFee,
		partnerPayout,
		subscriptionDiscount: subscriptionDiscount > 0 ? +subscriptionDiscount.toFixed(2) : undefined,
	};
};

const formatDateStr = (date: Date): string => date.toISOString().split("T")[0];

const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

const timeToMinutes = (time: string): number => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

const minutesToTime = (minutes: number): string => {
	const h = Math.floor(minutes / 60) % 24;
	const m = minutes % 60;
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

// ============ CAPACITY-AWARE HELPERS ============

/**
 * Get bookings that overlap with a given time range for a specific partner, date, and category
 */
const getOverlappingBookings = (
	partnerId: string,
	date: string,
	startTime: string,
	endTime: string,
	category: ServiceCategory,
): SlotBooking[] => {
	const startMin = timeToMinutes(startTime);
	const endMin = timeToMinutes(endTime);

	return Array.from(bookingsStore.values()).filter((b) => {
		if (b.partner.id !== partnerId) return false;
		if (b.slot.date !== date) return false;
		if (b.status === "cancelled") return false;
		if (b.service.serviceCategory !== category) return false;

		const bStart = timeToMinutes(b.slot.startTime);
		const bEnd = timeToMinutes(b.slot.endTime);

		// Check overlap: two ranges overlap if start1 < end2 AND start2 < end1
		return startMin < bEnd && bStart < endMin;
	});
};

/**
 * Find an available bay for a given time range and category
 */
const findAvailableBay = (
	partnerId: string,
	date: string,
	startTime: string,
	endTime: string,
	category: ServiceCategory,
): Bay | null => {
	const capacity = capacityStore.get(partnerId);
	if (!capacity) return null;

	const categoryBays = capacity.bays.filter((b) => b.serviceCategory === category && b.isActive);
	const overlapping = getOverlappingBookings(partnerId, date, startTime, endTime, category);
	const usedBayIds = new Set(overlapping.map((b) => b.bayId));

	return categoryBays.find((bay) => !usedBayIds.has(bay.id)) || null;
};

// ============ GENERATE MOCK BOOKINGS ============

const generateMockBookings = () => {
	const today = new Date();
	const currentHour = today.getHours();
	const capacity = capacityStore.get("demo-partner-1") || createDefaultCapacity("demo-partner-1");

	const createBooking = (
		date: Date,
		startTime: string,
		service: (typeof SERVICES)[number],
		status: BookingStatus,
		partnerId: string = "demo-partner-1",
	): SlotBooking => {
		const carType = faker.helpers.arrayElement(CAR_TYPES);
		const startMin = timeToMinutes(startTime);
		const endMin = startMin + service.duration;
		const endTime = minutesToTime(endMin);
		const dateStr = formatDateStr(date);

		// Find available bay
		const categoryBays = capacity.bays.filter((b) => b.serviceCategory === service.category && b.isActive);
		const overlapping = getOverlappingBookings(partnerId, dateStr, startTime, endTime, service.category);
		const usedBayIds = new Set(overlapping.map((b) => b.bayId));
		const availableBay = categoryBays.find((bay) => !usedBayIds.has(bay.id)) || categoryBays[0];

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
			date: dateStr,
			startTime,
			endTime,
		};

		const serviceType = faker.helpers.arrayElement(SERVICE_TYPES);

		const serviceInfo: ServiceInfo = {
			id: service.id,
			name: service.name,
			serviceType,
			serviceCategory: service.category,
			basePrice: service.basePrice,
			duration: service.duration,
		};

		const pricing = calculatePricing(serviceInfo, carType, customer.subscription);
		const createdAt = addDays(date, -faker.number.int({ min: 1, max: 7 }));
		const serviceSteps = buildServiceSteps(service.id, serviceType, status);
		const productOrder = maybeGenerateProductOrder();

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
			serviceSteps,
			bayId: availableBay?.id || "bay-w1",
			bayName: availableBay?.name || "Wash Bay 1",
			productOrder,
			createdAt: createdAt.toISOString(),
			updatedAt: new Date().toISOString(),
		};

		if (status === "cancelled") {
			booking.cancelledAt = faker.date.recent({ days: 3 }).toISOString();
			booking.cancelledBy = faker.helpers.arrayElement(["customer", "partner"] as const);
			booking.cancellationReason = faker.helpers.arrayElement(["Schedule conflict", "Emergency", "Weather conditions"]);
		}

		if (status === "completed") {
			booking.startedAt = new Date(date.getTime() + timeToMinutes(startTime) * 60000).toISOString();
			booking.completedAt = new Date(date.getTime() + endMin * 60000).toISOString();
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
		if (date.getDay() === 0) continue; // Skip Sunday

		// Multiple bookings per day using capacity
		const numWash = faker.number.int({ min: 2, max: 4 });
		const numDetail = faker.number.int({ min: 0, max: 2 });

		const washServices = SERVICES.filter((s) => s.category === "wash");
		const detailServices = SERVICES.filter((s) => s.category === "detailing");

		let washTime = 8 * 60; // Start at 8:00
		for (let i = 0; i < numWash; i++) {
			const svc = faker.helpers.arrayElement(washServices);
			const startTime = minutesToTime(washTime);
			const booking = createBooking(date, startTime, svc, "completed");
			bookingsStore.set(booking.id, booking);
			washTime += svc.duration + 15; // duration + buffer
		}

		let detailTime = 9 * 60; // Start at 9:00
		for (let i = 0; i < numDetail; i++) {
			const svc = faker.helpers.arrayElement(detailServices);
			const startTime = minutesToTime(detailTime);
			const booking = createBooking(date, startTime, svc, "completed");
			bookingsStore.set(booking.id, booking);
			detailTime += svc.duration + 15;
		}
	}

	// Generate TODAY's bookings
	const washServices = SERVICES.filter((s) => s.category === "wash");
	const detailServices = SERVICES.filter((s) => s.category === "detailing");

	// Past wash bookings today
	let washTime = 8 * 60;
	while (washTime < currentHour * 60 - 60) {
		if (faker.datatype.boolean(0.6)) {
			const svc = faker.helpers.arrayElement(washServices);
			const booking = createBooking(today, minutesToTime(washTime), svc, "completed");
			bookingsStore.set(booking.id, booking);
		}
		washTime += faker.helpers.arrayElement(washServices).duration + 15;
	}

	// Current in-progress booking
	if (currentHour >= 8 && currentHour < 17) {
		const svc = faker.helpers.arrayElement(washServices);
		const booking = createBooking(today, minutesToTime(currentHour * 60), svc, "in_progress");
		bookingsStore.set(booking.id, booking);
	}

	// Future bookings today
	let futureTime = (currentHour + 2) * 60;
	while (futureTime < 17 * 60) {
		if (faker.datatype.boolean(0.5)) {
			const svc = faker.helpers.arrayElement([...washServices, ...detailServices]);
			const booking = createBooking(today, minutesToTime(futureTime), svc, "booked");
			bookingsStore.set(booking.id, booking);
		}
		futureTime += 60;
	}

	// Generate FUTURE bookings - next 7 days
	for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
		const date = addDays(today, dayOffset);
		if (date.getDay() === 0) continue;

		const numBookings = faker.number.int({ min: 1, max: 4 });
		let time = 8 * 60 + faker.number.int({ min: 0, max: 4 }) * 30;

		for (let i = 0; i < numBookings; i++) {
			const svc = faker.helpers.arrayElement(SERVICES);
			const booking = createBooking(date, minutesToTime(time), svc, "booked");
			bookingsStore.set(booking.id, booking);
			time += svc.duration + 30;
			if (time > 17 * 60) break;
		}
	}

	// Add a few cancelled bookings
	for (let i = 0; i < 3; i++) {
		const dayOffset = faker.number.int({ min: -3, max: 3 });
		const date = addDays(today, dayOffset);
		if (date.getDay() === 0) continue;
		const svc = faker.helpers.arrayElement(SERVICES);
		const booking = createBooking(date, minutesToTime(9 * 60 + i * 60), svc, "cancelled");
		bookingsStore.set(booking.id, booking);
	}
};

// Initialize mock data
capacityStore.set("demo-partner-1", createDefaultCapacity("demo-partner-1"));
availabilityStore.set("demo-partner-1", createDefaultAvailability("demo-partner-1"));
generateMockBookings();

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

// Get partner capacity configuration
export const getPartnerCapacity = http.get("/api/partner/capacity", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	if (!capacityStore.has(partnerId)) {
		capacityStore.set(partnerId, createDefaultCapacity(partnerId));
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: capacityStore.get(partnerId),
	});
});

// Update partner capacity
export const updatePartnerCapacity = http.put("/api/partner/capacity", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as Partial<PartnerCapacity>;

	const existing = capacityStore.get(partnerId) || createDefaultCapacity(partnerId);

	// Rebuild bays based on new capacity numbers
	const newCapacity = body.capacityByCategory || existing.capacityByCategory;
	const bays: Bay[] = [];

	const categories: ServiceCategory[] = ["wash", "detailing", "other"];
	const categoryLabels: Record<ServiceCategory, string> = {
		wash: "Wash Bay",
		detailing: "Detail Bay",
		other: "Bay",
	};
	const categoryPrefixes: Record<ServiceCategory, string> = {
		wash: "bay-w",
		detailing: "bay-d",
		other: "bay-o",
	};

	for (const cat of categories) {
		const count = newCapacity[cat] || 0;
		for (let i = 1; i <= count; i++) {
			bays.push({
				id: `${categoryPrefixes[cat]}${i}`,
				name: `${categoryLabels[cat]} ${i}`,
				serviceCategory: cat,
				isActive: true,
			});
		}
	}

	const updated: PartnerCapacity = {
		...existing,
		...body,
		bays,
		capacityByCategory: newCapacity,
	};

	capacityStore.set(partnerId, updated);

	// Also update availability store
	const availability = availabilityStore.get(partnerId);
	if (availability) {
		availability.capacity = updated;
		availabilityStore.set(partnerId, availability);
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Capacity updated successfully",
		data: updated,
	});
});

// Get available time windows for a specific date, service category, and duration
export const getAvailableSlots = http.get("/api/bookings/slots", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const date = url.searchParams.get("date");
	const serviceCategory = (url.searchParams.get("serviceCategory") || "wash") as ServiceCategory;
	const durationMinutes = parseInt(url.searchParams.get("duration") || "30");

	if (!date) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Date is required" }, { status: 400 });
	}

	const availability = availabilityStore.get(partnerId) || createDefaultAvailability(partnerId);
	const capacity = capacityStore.get(partnerId) || createDefaultCapacity(partnerId);

	// Parse date
	const [year, month, day] = date.split("-").map(Number);
	const requestedDate = new Date(year, month - 1, day);
	const dayOfWeek = requestedDate.getDay();
	const dayAvailability = availability.schedule.find((d) => d.dayOfWeek === dayOfWeek);

	if (!dayAvailability || !dayAvailability.isEnabled) {
		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			data: {
				date,
				windows: [],
				message: "Partner is not available on this day",
				capacity: capacity.capacityByCategory,
			},
		});
	}

	const totalBays = capacity.capacityByCategory[serviceCategory] || 0;
	if (totalBays === 0) {
		return HttpResponse.json({
			status: ResultStatus.SUCCESS,
			data: {
				date,
				windows: [],
				message: "No bays available for this service category",
				capacity: capacity.capacityByCategory,
			},
		});
	}

	// Generate available time windows per time block
	const windows: AvailableWindow[] = [];
	for (const block of dayAvailability.timeBlocks) {
		const blockStartMin = timeToMinutes(block.start);
		const blockEndMin = timeToMinutes(block.end);
		for (let startMin = blockStartMin; startMin + durationMinutes <= blockEndMin; startMin += 15) {
			const startTime = minutesToTime(startMin);
			const endTime = minutesToTime(startMin + durationMinutes);

			const availableBay = findAvailableBay(partnerId, date, startTime, endTime, serviceCategory);
			const overlapping = getOverlappingBookings(partnerId, date, startTime, endTime, serviceCategory);
			const usedBays = overlapping.length;
			const freeBays = totalBays - usedBays;

			if (freeBays > 0) {
				windows.push({
					startTime,
					endTime,
					availableBays: freeBays,
					totalBays,
					bayId: availableBay?.id,
				});
			}
		}
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			date,
			windows,
			capacity: capacity.capacityByCategory,
		},
	});
});

// Create a new booking
export const createSlotBooking = http.post("/api/bookings/slot", async ({ request }) => {
	await delay(300);
	const body = (await request.json()) as {
		partnerId: string;
		customerId: string;
		vehicleId: string;
		serviceId: string;
		slot: BookingSlot;
		carType: CarType;
		serviceType?: ServiceType;
		serviceCategory?: ServiceCategory;
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
	const serviceCategory = body.serviceCategory || service.category;

	// Find available bay
	const availableBay = findAvailableBay(
		body.partnerId,
		body.slot.date,
		body.slot.startTime,
		body.slot.endTime,
		serviceCategory,
	);

	if (!availableBay) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "No available bays for this time slot" },
			{ status: 400 },
		);
	}

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

	const serviceType: ServiceType = body.serviceType || faker.helpers.arrayElement(SERVICE_TYPES);

	const serviceInfo: ServiceInfo = {
		id: service.id,
		name: service.name,
		serviceType,
		serviceCategory,
		basePrice: service.basePrice,
		duration: service.duration,
	};

	const pricing = calculatePricing(serviceInfo, body.carType);
	const serviceSteps = buildServiceSteps(service.id, serviceType, "booked");
	const productOrder = maybeGenerateProductOrder();

	const booking: SlotBooking = {
		id: faker.string.uuid(),
		bookingNumber: generateBookingNumber(),
		customer,
		partner,
		vehicle,
		service: serviceInfo,
		slot: body.slot,
		pricing,
		status: "booked",
		serviceSteps,
		bayId: availableBay.id,
		bayName: availableBay.name,
		productOrder,
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

// Get partner's bookings
export const getPartnerBookings = http.get("/api/partner/bookings", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const startDate = url.searchParams.get("startDate");
	const endDate = url.searchParams.get("endDate");
	const status = url.searchParams.get("status");
	const serviceCategory = url.searchParams.get("serviceCategory") as ServiceCategory | null;
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "50");

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
	if (serviceCategory) {
		bookings = bookings.filter((b) => b.service.serviceCategory === serviceCategory);
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

// Get bookings timeline
export const getBookingsTimeline = http.get("/api/partner/bookings/timeline", async ({ request }) => {
	await delay(200);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const weekStart = url.searchParams.get("weekStart");

	const startDate = weekStart ? new Date(weekStart) : new Date();
	startDate.setHours(0, 0, 0, 0);

	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + 7);

	const capacity = capacityStore.get(partnerId) || createDefaultCapacity(partnerId);

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

		// Calculate capacity usage
		const washBookings = dayBookings.filter((b) => b.service.serviceCategory === "wash" && b.status !== "cancelled");
		const detailBookings = dayBookings.filter(
			(b) => b.service.serviceCategory === "detailing" && b.status !== "cancelled",
		);

		days.push({
			date: dateStr,
			dayOfWeek: dayNames[currentDate.getDay()],
			bookings: dayBookings,
			totalBookings: dayBookings.length,
			completedCount: dayBookings.filter((b) => b.status === "completed").length,
			cancelledCount: dayBookings.filter((b) => b.status === "cancelled").length,
			capacityUsage: {
				wash: { used: washBookings.length, total: capacity.capacityByCategory.wash },
				detailing: { used: detailBookings.length, total: capacity.capacityByCategory.detailing },
				other: { used: 0, total: capacity.capacityByCategory.other },
			},
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

// Cancel booking
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

// Reschedule booking
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

	// Find new bay for the rescheduled time
	const newBay = findAvailableBay(
		booking.partner.id,
		body.newSlot.date,
		body.newSlot.startTime,
		body.newSlot.endTime,
		booking.service.serviceCategory,
	);

	if (!newBay) {
		return HttpResponse.json(
			{ status: ResultStatus.ERROR, message: "No available bays for the new time slot" },
			{ status: 400 },
		);
	}

	const updatedBooking: SlotBooking = {
		...booking,
		rescheduledFrom: booking.slot,
		slot: body.newSlot,
		bayId: newBay.id,
		bayName: newBay.name,
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

// Update booking status
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

// Advance service step
export const advanceServiceStep = http.patch("/api/bookings/:id/step/advance", async ({ params }) => {
	await delay(200);
	const { id } = params;

	const booking = bookingsStore.get(id as string);
	if (!booking) {
		return HttpResponse.json({ status: ResultStatus.ERROR, message: "Booking not found" }, { status: 404 });
	}

	const steps = [...booking.serviceSteps];
	const inProgressIdx = steps.findIndex((s) => s.status === "in_progress");
	const now = new Date().toISOString();

	if (inProgressIdx >= 0) {
		steps[inProgressIdx] = { ...steps[inProgressIdx], status: "completed", completedAt: now };
		if (inProgressIdx + 1 < steps.length) {
			steps[inProgressIdx + 1] = { ...steps[inProgressIdx + 1], status: "in_progress", startedAt: now };
		}
	} else {
		const firstPending = steps.findIndex((s) => s.status === "pending");
		if (firstPending >= 0) {
			steps[firstPending] = { ...steps[firstPending], status: "in_progress", startedAt: now };
		}
	}

	const allDone = steps.every((s) => s.status === "completed" || s.status === "skipped");
	const updatedBooking: SlotBooking = {
		...booking,
		serviceSteps: steps,
		status: allDone ? "completed" : booking.status === "booked" ? "in_progress" : booking.status,
		...(allDone && { completedAt: now }),
		...(booking.status === "booked" && { startedAt: now }),
		updatedAt: now,
	};

	bookingsStore.set(id as string, updatedBooking);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: allDone ? "Service completed" : "Step advanced",
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
	const serviceCategory = url.searchParams.get("serviceCategory") as ServiceCategory | null;

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

	if (serviceCategory) {
		bookings = bookings.filter((b) => b.service.serviceCategory === serviceCategory);
	}

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
		serviceType: "book_me",
		serviceCategory: service.category,
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
	// Availability & Capacity
	getPartnerAvailability,
	updatePartnerAvailability,
	getPartnerCapacity,
	updatePartnerCapacity,
	getAvailableSlots,
	// Bookings
	createSlotBooking,
	getPartnerBookings,
	getBookingsTimeline,
	cancelSlotBooking,
	rescheduleSlotBooking,
	updateBookingStatus,
	advanceServiceStep,
	getSlotBookingDetails,
	getAllSlotBookings,
	// Subscriptions
	getSubscriptionPlans,
	// Services & Pricing
	getServicesList,
	calculatePrice,
];
