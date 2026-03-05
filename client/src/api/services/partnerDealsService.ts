import apiClient from "../apiClient";

export interface PartnerDeal {
	_id: string;
	partnerId: string;
	title: string;
	description?: string;
	services: string[];
	originalPrice: number;
	discountedPrice: number;
	validUntil?: string;
	isMonthlyPackage: boolean;
	isActive: boolean;
	createdAt: string;
}

const partnerDealsService = {
	getDeals: () => apiClient.get<PartnerDeal[]>({ url: "/partner/deals" }),

	createDeal: (data: Omit<PartnerDeal, "_id" | "partnerId" | "createdAt">) =>
		apiClient.post<PartnerDeal>({ url: "/partner/deals", data }),

	updateDeal: (id: string, data: Partial<PartnerDeal>) =>
		apiClient.put<PartnerDeal>({ url: `/partner/deals/${id}`, data }),

	deleteDeal: (id: string) => apiClient.delete({ url: `/partner/deals/${id}` }),
};

export default partnerDealsService;
