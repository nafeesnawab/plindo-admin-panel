import type { ServiceFormData } from "@/pages/partner/services/types";

import apiClient from "../apiClient";

export interface PartnerServicesResponse {
	services: Array<Record<string, unknown>>;
}

export interface PartnerServiceResponse {
	service: Record<string, unknown>;
}

const partnerServicesService = {
	getAll: (partnerId?: string) =>
		apiClient.get<PartnerServicesResponse>({
			url: "/partner/services",
			params: partnerId ? { partnerId } : undefined,
		}),

	getById: (id: string) =>
		apiClient.get<PartnerServiceResponse>({ url: `/partner/services/${id}` }),

	create: (data: ServiceFormData) =>
		apiClient.post<PartnerServiceResponse>({ url: "/partner/services", data }),

	update: (id: string, data: Partial<ServiceFormData>) =>
		apiClient.put<PartnerServiceResponse>({ url: `/partner/services/${id}`, data }),

	delete: (id: string) =>
		apiClient.delete({ url: `/partner/services/${id}` }),

	toggleStatus: (id: string) =>
		apiClient.patch<PartnerServiceResponse>({ url: `/partner/services/${id}/status` }),

	duplicate: (id: string) =>
		apiClient.post<PartnerServiceResponse>({ url: `/partner/services/${id}/duplicate` }),
};

export default partnerServicesService;
