// Capacity-Based Dynamic Scheduling System Types

// ============ SERVICE CATEGORY ============

export type ServiceCategory = "wash" | "detailing" | "other";

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
	wash: "Car Wash",
	detailing: "Detailing",
	other: "Other",
};

export const SERVICE_CATEGORY_COLORS: Record<ServiceCategory, { bg: string; text: string; border: string }> = {
	wash: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
	detailing: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300" },
	other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300" },
};

// ============ BAY / CAPACITY ============

export interface Bay {
	id: string;
	name: string;
	serviceCategory: ServiceCategory;
	isActive: boolean;
}

export interface CategoryCapacity {
	category: ServiceCategory;
	totalBays: number;
	activeBays: number;
}

export interface PartnerCapacity {
	partnerId: string;
	bays: Bay[];
	capacityByCategory: Record<ServiceCategory, number>; // e.g. { wash: 5, detailing: 2, other: 0 }
	bufferTimeMinutes: number; // time between bookings per bay
}

// ============ AVAILABILITY TYPES ============

export interface TimeSlot {
	id: string;
	startTime: string; // "09:00"
	endTime: string; // "09:30"
	isAvailable: boolean;
	// Capacity tracking per category
	capacityUsed: Record<ServiceCategory, number>; // e.g. { wash: 3, detailing: 1 }
	capacityTotal: Record<ServiceCategory, number>; // e.g. { wash: 5, detailing: 2 }
}

export interface AvailableWindow {
	startTime: string; // "09:00"
	endTime: string; // "10:30" (based on service duration)
	availableBays: number; // how many bays are free for this category
	totalBays: number;
	bayId?: string; // suggested bay assignment
}

export interface TimeBlock {
	start: string; // "08:00"
	end: string; // "18:00"
}

export interface DayAvailability {
	dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
	dayName: string;
	isEnabled: boolean;
	timeBlocks: TimeBlock[];
}

export interface WeeklyAvailability {
	id: string;
	partnerId: string;
	schedule: DayAvailability[];
	bufferTimeMinutes: number; // time between bookings
	maxAdvanceBookingDays: number; // max 14 days
	capacity: PartnerCapacity;
	updatedAt: string;
}

// ============ SERVICE TYPE ============

export type ServiceType = "book_me" | "pick_by_me" | "washing_van";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
	book_me: "Book Me",
	pick_by_me: "Pick by Me",
	washing_van: "Washing Van",
};

// ============ SERVICE STEPS ============

export type ServiceStepStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface ServiceStep {
	id: string;
	name: string;
	status: ServiceStepStatus;
	startedAt?: string;
	completedAt?: string;
	order: number;
}

// Predefined steps per service — partner updates these as work progresses
export const SERVICE_STEPS_TEMPLATE: Record<string, string[]> = {
	svc_basic: ["Inspection", "Rinse", "Wash", "Dry"],
	svc_premium: ["Inspection", "Pre-Wash", "Wash", "Rinse", "Dry", "Finish"],
	svc_interior: ["Vacuum", "Dashboard Wipe", "Seat Shampoo", "Dry", "Condition"],
	svc_full: ["Inspection", "Pre-Wash", "Wash", "Clay Bar", "Polish", "Wax", "Interior Clean", "Final Check"],
	svc_express: ["Rinse", "Wash", "Dry"],
	svc_wax: ["Wash", "Clay", "Polish", "Wax", "Buff"],
};

// Extra steps prepended/appended based on service type
export const PICK_BY_ME_PREFIX_STEPS = ["Pick Up Vehicle"];
export const PICK_BY_ME_SUFFIX_STEPS = ["Deliver Vehicle"];
export const WASHING_VAN_PREFIX_STEPS = ["Travel to Customer"];

// ============ BOOKING PRODUCT INFO ============

export interface BookingProductOrder {
	orderNumber: string;
	productCount: number;
	totalAmount: number;
}

// ============ BOOKING TYPES ============

export type BookingStatus =
	| "booked" // initial status when customer books
	| "in_progress" // service has started
	| "completed" // service finished
	// Extra statuses for "pick by me" service type:
	| "picked" // car is picked from customer's location
	| "out_for_delivery" // vehicle being delivered back
	| "delivered" // vehicle delivered to customer
	| "cancelled"
	| "rescheduled";

export type CancelledBy = "customer" | "partner";

export interface BookingSlot {
	date: string; // "2024-01-15"
	startTime: string; // "09:00"
	endTime: string; // "10:30" (dynamic based on service duration)
}

export interface CustomerInfo {
	id: string;
	name: string;
	email: string;
	phone: string;
	avatar?: string;
	subscription?: CustomerSubscription;
}

export interface VehicleInfo {
	id: string;
	make: string;
	model: string;
	year: number;
	color: string;
	plateNumber: string;
	type: CarType; // affects pricing
}

export interface ServiceInfo {
	id: string;
	name: string;
	serviceType: ServiceType;
	serviceCategory: ServiceCategory;
	basePrice: number;
	duration: number; // in minutes
	description?: string;
}

export interface BookingPricing {
	basePrice: number;
	isCustomPrice: boolean;
	bodyTypeDefault: number;
	finalPrice: number;
	platformFee: number;
	partnerPayout: number;
	distanceCharge?: number;
	discountApplied?: number;
	subscriptionDiscount?: number;
}

export interface PartnerInfo {
	id: string;
	businessName: string;
	ownerName: string;
	phone: string;
	location: string;
	address: string;
	rating: number;
	avatar?: string;
}

export interface SlotBooking {
	id: string;
	bookingNumber: string;
	customer: CustomerInfo;
	partner: PartnerInfo;
	vehicle: VehicleInfo;
	service: ServiceInfo;
	slot: BookingSlot;
	pricing: BookingPricing;
	status: BookingStatus;
	serviceSteps: ServiceStep[];
	// Bay assignment
	bayId: string;
	bayName: string;
	// Product order
	productOrder?: BookingProductOrder;
	createdAt: string;
	updatedAt: string;
	// Cancellation info
	cancelledAt?: string;
	cancelledBy?: CancelledBy;
	cancellationReason?: string;
	// Reschedule info
	rescheduledFrom?: BookingSlot;
	rescheduledAt?: string;
	rescheduledBy?: CancelledBy;
	// Service progress
	startedAt?: string;
	completedAt?: string;
	// Rating
	rating?: {
		score: number;
		comment?: string;
		createdAt: string;
	};
	notes?: string;
}

// ============ SUBSCRIPTION TYPES ============

export type SubscriptionTier = "none" | "basic" | "premium";

export interface SubscriptionPlan {
	id: string;
	tier: SubscriptionTier;
	name: string;
	price: number; // monthly price
	currency: string;
	features: string[];
	peakHoursAccess: boolean;
	priorityBooking: boolean;
	pickupDelivery: boolean;
	discountPercentage: number;
}

export interface CustomerSubscription {
	id: string;
	customerId: string;
	plan: SubscriptionPlan;
	status: "active" | "cancelled" | "expired";
	startDate: string;
	endDate: string;
	autoRenew: boolean;
}

// ============ CAR TYPE & PRICING ============

export type CarType =
	| "compact" // Small cars - 1.0x multiplier
	| "sedan" // Medium cars - 1.2x multiplier
	| "suv" // SUVs - 1.4x multiplier
	| "van" // Vans - 1.6x multiplier
	| "luxury"; // Luxury cars - 1.8x multiplier

export const CAR_TYPE_LABELS: Record<CarType, string> = {
	compact: "Compact",
	sedan: "Sedan",
	suv: "SUV",
	van: "Van/MPV",
	luxury: "Luxury",
};

// ============ API REQUEST/RESPONSE TYPES ============

export interface GetAvailableSlotsRequest {
	partnerId: string;
	serviceId: string;
	date: string; // specific date
	serviceCategory: ServiceCategory;
	durationMinutes: number;
}

export interface GetAvailableSlotsResponse {
	date: string;
	windows: AvailableWindow[];
	partnerInfo: PartnerInfo;
	capacity: Record<ServiceCategory, number>;
}

export interface CreateBookingRequest {
	partnerId: string;
	customerId: string;
	vehicleId: string;
	serviceId: string;
	slot: BookingSlot;
	serviceCategory: ServiceCategory;
}

export interface RescheduleBookingRequest {
	bookingId: string;
	newSlot: BookingSlot;
	reason?: string;
}

export interface CancelBookingRequest {
	bookingId: string;
	reason: string;
	cancelledBy: CancelledBy;
}

export interface PartnerBookingsFilter {
	partnerId: string;
	startDate?: string;
	endDate?: string;
	status?: BookingStatus;
	serviceCategory?: ServiceCategory;
	page?: number;
	limit?: number;
}

// ============ TIMELINE VIEW TYPES ============

export interface DayBookings {
	date: string;
	dayOfWeek: string;
	bookings: SlotBooking[];
	totalBookings: number;
	completedCount: number;
	cancelledCount: number;
	capacityUsage: Record<ServiceCategory, { used: number; total: number }>;
}

export interface WeekBookings {
	weekStart: string;
	weekEnd: string;
	days: DayBookings[];
	totalBookings: number;
	totalRevenue: number;
}
