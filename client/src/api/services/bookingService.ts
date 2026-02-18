import apiClient from "../apiClient";

export enum BookingApi {
	List = "/bookings",
	Details = "/bookings",
	Disputes = "/bookings/disputes",
}

export interface BookingCustomer {
	id: string;
	name: string;
	email: string;
	phone: string;
	avatar: string;
}

export interface BookingPartner {
	id: string;
	businessName: string;
	ownerName: string;
	phone: string;
	location: string;
	address: string;
	rating: number;
}

export interface BookingVehicle {
	make: string;
	model: string;
	color: string;
	plateNumber: string;
	year: number;
}

export interface BookingService {
	name: string;
	price: number;
	duration: number;
}

export interface BookingPayment {
	method: "card" | "cash" | "wallet";
	amount: number;
	platformFee: number;
	partnerPayout: number;
	status: "pending" | "paid" | "refunded";
	transactionId: string;
}

export interface BookingRating {
	score: number;
	comment?: string;
	createdAt: string;
}

export interface StatusTimelineItem {
	status: string;
	timestamp: string;
	note?: string;
}

export interface DisputeEvidence {
	type: "photo" | "video";
	url: string;
	uploadedAt: string;
}

export interface BookingDispute {
	id: string;
	reason: string;
	description: string;
	createdAt: string;
	status: "pending" | "resolved";
	customerEvidence: DisputeEvidence[];
	partnerResponse?: {
		response: string;
		evidence: DisputeEvidence[];
		respondedAt: string;
	};
}

export interface Booking {
	id: string;
	bookingNumber: string;
	customer: BookingCustomer;
	partner: BookingPartner;
	vehicle: BookingVehicle;
	service: BookingService;
	scheduledDate: string;
	createdAt: string;
	status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
	statusTimeline: StatusTimelineItem[];
	payment: BookingPayment;
	rating: BookingRating | null;
	isDisputed: boolean;
	dispute: BookingDispute | null;
	notes?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface BookingFilters {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	partnerId?: string;
	customerId?: string;
	dateFrom?: string;
	dateTo?: string;
}

const getBookings = (params?: BookingFilters) =>
	apiClient.get<PaginatedResponse<Booking>>({ url: BookingApi.List, params });

const getBookingDetails = (id: string) =>
	apiClient.get<Booking>({ url: `${BookingApi.Details}/${id}` });

const cancelBooking = (id: string, reason: string) =>
	apiClient.post({ url: `${BookingApi.Details}/${id}/cancel`, data: { reason } });

const issueRefund = (id: string, amount: number, reason: string) =>
	apiClient.post({ url: `${BookingApi.Details}/${id}/refund`, data: { amount, reason } });

const getDisputes = (params?: { page?: number; limit?: number }) =>
	apiClient.get<PaginatedResponse<Booking>>({ url: BookingApi.Disputes, params });

const resolveDispute = (id: string, resolution: { action: string; notes: string; refundAmount?: number }) =>
	apiClient.post({ url: `${BookingApi.Details}/${id}/resolve-dispute`, data: resolution });

export default {
	getBookings,
	getBookingDetails,
	cancelBooking,
	issueRefund,
	getDisputes,
	resolveDispute,
};
