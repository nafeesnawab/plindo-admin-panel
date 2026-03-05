import apiClient from "../apiClient";

export interface RefundRequest {
	_id: string;
	bookingId: string;
	bookingNumber: string;
	customerId: string;
	customerName: string;
	customerEmail: string;
	amount: number;
	reason: string;
	cancellationCount: number;
	status: "pending_review" | "approved" | "rejected";
	reviewedBy?: string;
	reviewedAt?: string;
	reviewNote?: string;
	createdAt: string;
}

export interface RefundRequestsResponse {
	requests: RefundRequest[];
	total: number;
	pendingCount: number;
	page: number;
	totalPages: number;
}

const refundRequestsService = {
	getAll: (params?: { status?: string; from?: string; to?: string; page?: number }) =>
		apiClient.get<RefundRequestsResponse>({ url: "/admin/refund-requests", params }),

	approve: (id: string, note?: string) =>
		apiClient.post<{ message: string; request: RefundRequest }>({
			url: `/admin/refund-requests/${id}/approve`,
			data: { note },
		}),

	reject: (id: string, note?: string) =>
		apiClient.post<{ message: string; request: RefundRequest }>({
			url: `/admin/refund-requests/${id}/reject`,
			data: { note },
		}),
};

export default refundRequestsService;
