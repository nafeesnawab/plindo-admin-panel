import apiClient from "../apiClient";

enum SupportApi {
	Tickets = "/support/tickets",
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type UserType = "customer" | "partner";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface TicketUser {
	id: string;
	name: string;
	email: string;
	avatar: string;
}

export interface TicketMessage {
	id: string;
	senderId: string;
	senderName: string;
	senderType: "user" | "admin";
	message: string;
	timestamp: string;
}

export interface SupportTicket {
	id: string;
	ticketNumber: string;
	subject: string;
	description: string;
	status: TicketStatus;
	priority: Priority;
	userType: UserType;
	user: TicketUser;
	assignedTo: string | null;
	messages: TicketMessage[];
	createdAt: string;
	updatedAt: string;
}

export interface TicketsResponse {
	tickets: SupportTicket[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface TicketFilters {
	status?: string;
	userType?: string;
	page?: number;
	limit?: number;
}

const supportService = {
	getTickets: (filters: TicketFilters = {}) =>
		apiClient.get<TicketsResponse>({
			url: SupportApi.Tickets,
			params: filters,
		}),

	getTicketDetails: (id: string) => apiClient.get<SupportTicket>({ url: `${SupportApi.Tickets}/${id}` }),

	replyToTicket: (id: string, message: string) =>
		apiClient.post<SupportTicket>({
			url: `${SupportApi.Tickets}/${id}/reply`,
			data: { message },
		}),

	assignTicket: (id: string, adminName: string) =>
		apiClient.post<SupportTicket>({
			url: `${SupportApi.Tickets}/${id}/assign`,
			data: { adminName },
		}),

	closeTicket: (id: string) => apiClient.post<SupportTicket>({ url: `${SupportApi.Tickets}/${id}/close` }),
};

export default supportService;
