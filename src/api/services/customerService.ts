import apiClient from "../apiClient";

export enum CustomerApi {
	List = "/customers",
	Details = "/customers",
}

export interface Vehicle {
	id: string;
	make: string;
	model: string;
	color: string;
	plateNumber: string;
	year: number;
}

export interface PaymentMethod {
	id: string;
	type: "visa" | "mastercard";
	last4: string;
	expiryMonth: number;
	expiryYear: number;
	isDefault: boolean;
}

export interface Subscription {
	plan: string;
	price: number;
	active: boolean;
	startDate: string | null;
	renewalDate: string | null;
	washesRemaining: number;
}

export interface CustomerBooking {
	id: string;
	service: string;
	partnerName: string;
	amount: number;
	status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
	date: string;
	rating: number | null;
}

export interface Customer {
	id: string;
	name: string;
	email: string;
	phone: string;
	avatar: string;
	location: string;
	status: "active" | "suspended";
	registeredAt: string;
	lastActiveAt: string;
	totalBookings: number;
	totalSpent: number;
	vehicles: Vehicle[];
	subscription: Subscription;
	paymentMethods: PaymentMethod[];
	suspendedAt: string | null;
	suspensionReason: string | null;
}

export interface CustomerDetails extends Customer {
	bookingHistory: CustomerBooking[];
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface CustomerFilters {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	dateFrom?: string;
	dateTo?: string;
}

const getCustomers = (params?: CustomerFilters) =>
	apiClient.get<PaginatedResponse<Customer>>({ url: CustomerApi.List, params });

const getCustomerDetails = (id: string) =>
	apiClient.get<CustomerDetails>({ url: `${CustomerApi.Details}/${id}` });

const suspendCustomer = (id: string, reason: string) =>
	apiClient.post({ url: `${CustomerApi.Details}/${id}/suspend`, data: { reason } });

const reactivateCustomer = (id: string) =>
	apiClient.post({ url: `${CustomerApi.Details}/${id}/reactivate` });

const deleteCustomer = (id: string) =>
	apiClient.delete({ url: `${CustomerApi.Details}/${id}` });

const sendNotification = (id: string, message: string) =>
	apiClient.post({ url: `${CustomerApi.Details}/${id}/notify`, data: { message } });

export default {
	getCustomers,
	getCustomerDetails,
	suspendCustomer,
	reactivateCustomer,
	deleteCustomer,
	sendNotification,
};
