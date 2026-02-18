import type {
	AvailableWindow,
	BookingPricing,
	BookingSlot,
	CarType,
	PartnerCapacity,
	ServiceCategory,
	SlotBooking,
	WeekBookings,
	WeeklyAvailability,
} from "@/types/booking";
import apiClient from "../apiClient";

export enum SlotBookingApi {
	// Partner availability
	WeeklyAvailability = "/partner/availability/weekly",
	AvailableSlots = "/bookings/slots",
	// Capacity
	PartnerCapacity = "/partner/capacity",
	// Bookings
	PartnerBookings = "/partner/bookings",
	BookingsTimeline = "/partner/bookings/timeline",
	SlotBooking = "/bookings/slot",
	AdminBookings = "/admin/bookings",
	// Actions
	CancelBooking = "/bookings",
	RescheduleBooking = "/bookings",
	UpdateStatus = "/bookings",
	// Services & pricing
	Services = "/services",
	CalculatePrice = "/bookings/calculate-price",
	// Subscriptions
	SubscriptionPlans = "/subscriptions/plans",
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface PartnerBookingsFilter {
	partnerId?: string;
	startDate?: string;
	endDate?: string;
	status?: string;
	serviceCategory?: ServiceCategory;
	page?: number;
	limit?: number;
}

export interface AdminBookingsFilter {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	partnerId?: string;
	customerId?: string;
	dateFrom?: string;
	dateTo?: string;
	serviceCategory?: ServiceCategory;
}

export interface ServiceOption {
	id: string;
	name: string;
	basePrice: number;
	duration: number;
	category: ServiceCategory;
}

// ============ Partner Availability ============

const getWeeklyAvailability = (partnerId?: string) =>
	apiClient.get<WeeklyAvailability>({
		url: SlotBookingApi.WeeklyAvailability,
		params: { partnerId },
	});

const updateWeeklyAvailability = (data: Partial<WeeklyAvailability>, partnerId?: string) =>
	apiClient.put<WeeklyAvailability>({
		url: SlotBookingApi.WeeklyAvailability,
		params: { partnerId },
		data,
	});

// ============ Capacity ============

const getPartnerCapacity = (partnerId?: string) =>
	apiClient.get<PartnerCapacity>({
		url: SlotBookingApi.PartnerCapacity,
		params: { partnerId },
	});

const updatePartnerCapacity = (data: Partial<PartnerCapacity>, partnerId?: string) =>
	apiClient.put<PartnerCapacity>({
		url: SlotBookingApi.PartnerCapacity,
		params: { partnerId },
		data,
	});

// ============ Available Windows ============

const getAvailableSlots = (partnerId: string, date: string, serviceCategory?: ServiceCategory, duration?: number) =>
	apiClient.get<{ date: string; windows: AvailableWindow[]; capacity: Record<ServiceCategory, number> }>({
		url: SlotBookingApi.AvailableSlots,
		params: { partnerId, date, serviceCategory, duration },
	});

// ============ Bookings ============

const getPartnerBookings = (params: PartnerBookingsFilter) =>
	apiClient.get<PaginatedResponse<SlotBooking>>({
		url: SlotBookingApi.PartnerBookings,
		params,
	});

const getBookingsTimeline = (partnerId: string, weekStart?: string) =>
	apiClient.get<WeekBookings>({
		url: SlotBookingApi.BookingsTimeline,
		params: { partnerId, weekStart },
	});

const getBookingDetails = (id: string) => apiClient.get<SlotBooking>({ url: `${SlotBookingApi.SlotBooking}/${id}` });

const createBooking = (data: {
	partnerId: string;
	customerId: string;
	vehicleId: string;
	serviceId: string;
	slot: BookingSlot;
	carType: CarType;
	serviceCategory?: ServiceCategory;
	serviceType?: string;
}) => apiClient.post<SlotBooking>({ url: SlotBookingApi.SlotBooking, data });

// ============ Admin Bookings ============

const getAdminBookings = (params: AdminBookingsFilter) =>
	apiClient.get<PaginatedResponse<SlotBooking>>({
		url: SlotBookingApi.AdminBookings,
		params,
	});

// ============ Actions ============

const cancelBooking = (id: string, reason: string, cancelledBy: "customer" | "partner") =>
	apiClient.post<SlotBooking>({
		url: `${SlotBookingApi.CancelBooking}/${id}/cancel`,
		data: { reason, cancelledBy },
	});

const rescheduleBooking = (id: string, newSlot: BookingSlot, rescheduledBy: "customer" | "partner", reason?: string) =>
	apiClient.post<SlotBooking>({
		url: `${SlotBookingApi.RescheduleBooking}/${id}/reschedule`,
		data: { newSlot, rescheduledBy, reason },
	});

const updateBookingStatus = (id: string, status: string) =>
	apiClient.patch<SlotBooking>({
		url: `${SlotBookingApi.UpdateStatus}/${id}/status`,
		data: { status },
	});

const advanceServiceStep = (bookingId: string) =>
	apiClient.patch<SlotBooking>({
		url: `${SlotBookingApi.UpdateStatus}/${bookingId}/step/advance`,
	});

// ============ Services & Pricing ============

const getServices = () => apiClient.get<ServiceOption[]>({ url: SlotBookingApi.Services });

const calculatePrice = (serviceId: string, carType: CarType, customerId?: string) =>
	apiClient.post<BookingPricing>({
		url: SlotBookingApi.CalculatePrice,
		data: { serviceId, carType, customerId },
	});

// ============ Subscriptions ============

const getSubscriptionPlans = () =>
	apiClient.get<Array<{ id: string; tier: string; name: string; price: number; features: string[] }>>({
		url: SlotBookingApi.SubscriptionPlans,
	});

export default {
	// Availability
	getWeeklyAvailability,
	updateWeeklyAvailability,
	// Capacity
	getPartnerCapacity,
	updatePartnerCapacity,
	// Available Windows
	getAvailableSlots,
	// Bookings
	getPartnerBookings,
	getBookingsTimeline,
	getBookingDetails,
	createBooking,
	getAdminBookings,
	// Actions
	cancelBooking,
	rescheduleBooking,
	updateBookingStatus,
	advanceServiceStep,
	// Services & Pricing
	getServices,
	calculatePrice,
	// Subscriptions
	getSubscriptionPlans,
};
