import apiClient from "../apiClient";

export enum NotificationApi {
	Send = "/notifications/send",
	History = "/notifications/history",
	Details = "/notifications",
}

export interface NotificationStats {
	sentCount: number;
	deliveredCount: number;
	openedCount: number;
	failedCount: number;
	openRate: number;
	deliveryRate: number;
}

export interface Notification {
	id: string;
	title: string;
	body: string;
	recipientType: "all_users" | "all_customers" | "all_partners" | "specific_user";
	recipientName: string | null;
	notificationType: "push" | "email" | "both";
	scheduledAt: string | null;
	sentAt: string;
	status: "sent" | "delivered" | "failed" | "partial";
	stats: NotificationStats;
}

export interface SendNotificationPayload {
	title: string;
	body: string;
	recipientType: "all_users" | "all_customers" | "all_partners" | "specific_user";
	recipientId?: string;
	notificationType: "push" | "email" | "both";
	scheduledAt?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

const sendNotification = (payload: SendNotificationPayload) =>
	apiClient.post<Notification>({ url: NotificationApi.Send, data: payload });

const getHistory = (params?: { page?: number; limit?: number; recipientType?: string }) =>
	apiClient.get<PaginatedResponse<Notification>>({ url: NotificationApi.History, params });

const getDetails = (id: string) =>
	apiClient.get<Notification>({ url: `${NotificationApi.Details}/${id}` });

export default {
	sendNotification,
	getHistory,
	getDetails,
};
