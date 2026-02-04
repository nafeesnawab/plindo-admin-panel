// New Preply-style Booking System Types

// ============ AVAILABILITY TYPES ============

export interface TimeSlot {
	id: string;
	startTime: string; // "09:00"
	endTime: string; // "09:30"
	isAvailable: boolean;
}

export interface DayAvailability {
	dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
	dayName: string;
	isEnabled: boolean;
	slots: TimeSlot[];
}

export interface WeeklyAvailability {
	id: string;
	partnerId: string;
	schedule: DayAvailability[];
	slotDurationMinutes: number; // 30, 45, 60
	bufferTimeMinutes: number; // time between bookings
	maxAdvanceBookingDays: number; // max 14 days
	updatedAt: string;
}

// ============ BOOKING TYPES ============

export type BookingStatus =
	| "booked" // initial status when customer books a slot
	| "in_progress" // service has started
	| "completed" // service finished at partner location
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
	endTime: string; // "09:30"
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
	basePrice: number;
	duration: number; // in minutes
	description?: string;
}

export interface BookingPricing {
	basePrice: number;
	carTypeMultiplier: number;
	finalPrice: number;
	platformFee: number;
	partnerPayout: number;
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

export const CAR_TYPE_MULTIPLIERS: Record<CarType, number> = {
	compact: 1.0,
	sedan: 1.2,
	suv: 1.4,
	van: 1.6,
	luxury: 1.8,
};

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
}

export interface GetAvailableSlotsResponse {
	date: string;
	slots: TimeSlot[];
	partnerInfo: PartnerInfo;
}

export interface CreateBookingRequest {
	partnerId: string;
	customerId: string;
	vehicleId: string;
	serviceId: string;
	slot: BookingSlot;
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
}

export interface WeekBookings {
	weekStart: string;
	weekEnd: string;
	days: DayBookings[];
	totalBookings: number;
	totalRevenue: number;
}
