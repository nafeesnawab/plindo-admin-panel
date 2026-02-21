import apiClient from "../apiClient";

export enum PartnerApi {
	Pending = "/partners/pending",
	Active = "/partners/active",
	Suspended = "/partners/suspended",
	Details = "/partners",
	Approve = "/partners/:id/approve",
	Reject = "/partners/:id/reject",
	Suspend = "/partners/:id/suspend",
	Reactivate = "/partners/:id/reactivate",
}

export interface PartnerService {
	name: string;
	price: number;
}

export interface PartnerDocument {
	name: string;
	url: string;
	verified: boolean;
}

export interface PartnerDriver {
	id: string;
	fullName: string;
	contactNumber: string;
	driverLicenseUrl: string | null;
	driverInsuranceUrl: string | null;
}

export interface TimeBlock {
	start: string;
	end: string;
}

export interface ScheduleDay {
	dayOfWeek: number;
	dayName: string;
	isEnabled: boolean;
	timeBlocks: TimeBlock[];
}

export interface Partner {
	id: string;
	ownerName: string;
	businessName: string;
	email: string;
	phone: string;
	location: string;
	address: string;
	status: "pending" | "active" | "suspended";
	services: PartnerService[];
	rating: number | null;
	totalBookings: number;
	completionRate: number | null;
	totalEarnings: number;
	isVerified: boolean;
	businessLicense: string;
	description: string;
	logo: string | null;
	coverPhoto: string | null;
	createdAt: string;
	appliedAt: string;
	suspendedAt: string | null;
	suspensionReason: string | null;
	schedule: ScheduleDay[];
	photos: string[];
	documents: PartnerDocument[];
	drivers: PartnerDriver[];
}

export interface PartnerReview {
	id: string;
	customerName: string;
	rating: number;
	comment: string;
	createdAt: string;
}

export interface EarningsHistory {
	month: string;
	earnings: number;
	bookings: number;
}

export interface PartnerDetails extends Partner {
	reviews: PartnerReview[];
	earningsHistory: EarningsHistory[];
	capacityByCategory?: Record<string, number>;
	carWashBays?: number;
	detailingBays?: number;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface PartnerFilters {
	page?: number;
	limit?: number;
	search?: string;
	rating?: string;
	location?: string;
	verified?: string;
}

const getPendingPartners = (params?: PartnerFilters) =>
	apiClient.get<PaginatedResponse<Partner>>({
		url: PartnerApi.Pending,
		params,
	});

const getActivePartners = (params?: PartnerFilters) =>
	apiClient.get<PaginatedResponse<Partner>>({ url: PartnerApi.Active, params });

const getSuspendedPartners = (params?: PartnerFilters) =>
	apiClient.get<PaginatedResponse<Partner>>({
		url: PartnerApi.Suspended,
		params,
	});

const getPartnerDetails = (id: string) =>
	apiClient.get<PartnerDetails>({ url: `${PartnerApi.Details}/${id}` });

const approvePartner = (id: string) =>
	apiClient.post({ url: `/partners/${id}/approve` });

const rejectPartner = (id: string, reason: string) =>
	apiClient.post({ url: `/partners/${id}/reject`, data: { reason } });

const suspendPartner = (id: string, reason: string) =>
	apiClient.post({ url: `/partners/${id}/suspend`, data: { reason } });

const reactivatePartner = (id: string) =>
	apiClient.post({ url: `/partners/${id}/reactivate` });

const removePartner = (id: string) =>
	apiClient.delete({ url: `${PartnerApi.Details}/${id}` });

export default {
	getPendingPartners,
	getActivePartners,
	getSuspendedPartners,
	getPartnerDetails,
	approvePartner,
	rejectPartner,
	suspendPartner,
	reactivatePartner,
	removePartner,
};
