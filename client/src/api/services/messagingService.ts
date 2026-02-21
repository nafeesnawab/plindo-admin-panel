import apiClient from "@/api/apiClient";

export interface ApiMessage {
	_id?: string;
	id?: string;
	conversationId?: string;
	senderId: string;
	text: string;
	read: boolean;
	createdAt?: string;
	timestamp?: string;
}

export interface ApiConversation {
	id: string;
	customerId: string;
	customerName: string;
	lastMessage: string;
	lastMessageTime: string;
	unreadCount: number;
	messages: ApiMessage[];
}

const messagingService = {
	getConversations: () =>
		apiClient.get<{ conversations: ApiConversation[] }>({
			url: "/partner/messages/conversations",
		}),

	getConversation: (id: string) =>
		apiClient.get<{ conversation: ApiConversation }>({
			url: `/partner/messages/conversations/${id}`,
		}),

	sendMessage: (conversationId: string, text: string) =>
		apiClient.post<{ message: ApiMessage }>({
			url: `/partner/messages/conversations/${conversationId}/send`,
			data: { text },
		}),

	markAsRead: (conversationId: string) =>
		apiClient.post<unknown>({
			url: `/partner/messages/conversations/${conversationId}/read`,
		}),
};

export default messagingService;
