import apiClient from "../apiClient";

export enum MessagesApi {
	Conversations = "/partner/messages/conversations",
}

export interface Message {
	id: string;
	senderId: string;
	text: string;
	timestamp: string;
	read: boolean;
}

export interface Conversation {
	id: string;
	customerId: string;
	customerName: string;
	lastMessage: string;
	lastMessageTime: string;
	unreadCount: number;
	messages: Message[];
}

export interface ConversationsResponse {
	conversations: Conversation[];
}

const getConversations = (params?: { search?: string }) =>
	apiClient.get<ConversationsResponse>({ url: MessagesApi.Conversations, params });

const getConversation = (id: string) =>
	apiClient.get<{ conversation: Conversation }>({
		url: `${MessagesApi.Conversations}/${id}`,
	});

const sendMessage = (id: string, text: string) =>
	apiClient.post<{ message: Message }>({
		url: `${MessagesApi.Conversations}/${id}/send`,
		data: { text },
	});

const markAsRead = (id: string) =>
	apiClient.post({ url: `${MessagesApi.Conversations}/${id}/read` });

export default {
	getConversations,
	getConversation,
	sendMessage,
	markAsRead,
};
