import apiClient from "../apiClient";

enum LegalApi {
	TermsConditions = "/legal/terms",
	TermsHistory = "/legal/terms/history",
	PrivacyPolicy = "/legal/privacy",
	PrivacyHistory = "/legal/privacy/history",
	RefundPolicy = "/legal/refund",
	AboutUs = "/legal/about",
	FAQs = "/legal/faqs",
}

export interface LegalVersion {
	id: string;
	version: string;
	content: string;
	publishedAt: string;
	publishedBy: string;
	isActive: boolean;
}

export interface RefundPolicy {
	id: string;
	content: string;
	updatedAt: string;
	updatedBy: string;
}

export interface SocialLinks {
	facebook: string;
	twitter: string;
	instagram: string;
	linkedin: string;
}

export interface AboutUs {
	id: string;
	companyName: string;
	tagline: string;
	description: string;
	email: string;
	phone: string;
	address: string;
	socialLinks: SocialLinks;
	updatedAt: string;
}

export interface FAQ {
	id: string;
	question: string;
	answer: string;
	category: string;
	order: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface FAQsResponse {
	faqs: FAQ[];
	categories: string[];
}

const legalService = {
	getTermsConditions: () =>
		apiClient.get<LegalVersion>({ url: LegalApi.TermsConditions }),

	getTermsHistory: () =>
		apiClient.get<LegalVersion[]>({ url: LegalApi.TermsHistory }),

	updateTermsConditions: (data: { content: string; publish?: boolean }) =>
		apiClient.put<LegalVersion>({ url: LegalApi.TermsConditions, data }),

	getPrivacyPolicy: () =>
		apiClient.get<LegalVersion>({ url: LegalApi.PrivacyPolicy }),

	getPrivacyHistory: () =>
		apiClient.get<LegalVersion[]>({ url: LegalApi.PrivacyHistory }),

	updatePrivacyPolicy: (data: { content: string; publish?: boolean }) =>
		apiClient.put<LegalVersion>({ url: LegalApi.PrivacyPolicy, data }),

	getRefundPolicy: () =>
		apiClient.get<RefundPolicy>({ url: LegalApi.RefundPolicy }),

	updateRefundPolicy: (data: { content: string }) =>
		apiClient.put<RefundPolicy>({ url: LegalApi.RefundPolicy, data }),

	getAboutUs: () =>
		apiClient.get<AboutUs>({ url: LegalApi.AboutUs }),

	updateAboutUs: (data: Partial<AboutUs>) =>
		apiClient.put<AboutUs>({ url: LegalApi.AboutUs, data }),

	getFAQs: (category?: string) =>
		apiClient.get<FAQsResponse>({
			url: LegalApi.FAQs,
			params: category ? { category } : undefined,
		}),

	createFAQ: (data: { question: string; answer: string; category: string }) =>
		apiClient.post<FAQ>({ url: LegalApi.FAQs, data }),

	updateFAQ: (id: string, data: Partial<FAQ>) =>
		apiClient.put<FAQ>({ url: `${LegalApi.FAQs}/${id}`, data }),

	deleteFAQ: (id: string) =>
		apiClient.delete({ url: `${LegalApi.FAQs}/${id}` }),

	reorderFAQs: (ids: string[]) =>
		apiClient.put({ url: `${LegalApi.FAQs}/reorder`, data: { ids } }),
};

export default legalService;
