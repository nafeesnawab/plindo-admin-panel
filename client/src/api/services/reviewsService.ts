import apiClient from "../apiClient";

export enum ReviewsApi {
	List = "/partner/reviews",
	Respond = "/partner/reviews/:id/respond",
}

export interface PartnerResponse {
	text: string;
	date: string;
}

export interface Review {
	id: string;
	customerId: string;
	customerName: string;
	isAnonymous: boolean;
	rating: number;
	reviewText: string;
	date: string;
	bookingId: string;
	service: string;
	partnerResponse?: PartnerResponse;
}

export interface ReviewsResponse {
	reviews: Review[];
}

export interface ReviewFilters {
	rating?: string;
	search?: string;
}

const getReviews = (params?: ReviewFilters) =>
	apiClient.get<ReviewsResponse>({ url: ReviewsApi.List, params });

const respondToReview = (id: string, text: string) =>
	apiClient.post<{ review: Review }>({
		url: `/partner/reviews/${id}/respond`,
		data: { text },
	});

const deleteResponse = (id: string) =>
	apiClient.delete({ url: `/partner/reviews/${id}/respond` });

export default {
	getReviews,
	respondToReview,
	deleteResponse,
};
