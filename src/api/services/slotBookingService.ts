import type {
	BookingPricing,
	BookingSlot,
	CarType,
	SlotBooking,
	TimeSlot,
	WeekBookings,
	WeeklyAvailability,
} from "@/types/booking";
import apiClient from "../apiClient";

export enum SlotBookingApi {
	// Partner availability
	WeeklyAvailability = "/partner/availability/weekly",
	AvailableSlots = "/bookings/slots",
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
}

export interface ServiceOption {
	id: string;
	name: string;
	basePrice: number;
	duration: number;
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

const getAvailableSlots = (partnerId: string, date: string, serviceId?: string) =>
	apiClient.get<{ date: string; slots: TimeSlot[]; partnerId: string }>({
		url: SlotBookingApi.AvailableSlots,
		params: { partnerId, date, serviceId },
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
	// Services & Pricing
	getServices,
	calculatePrice,
	// Subscriptions
	getSubscriptionPlans,
};
