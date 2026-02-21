import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import messagingService, {
	type ApiConversation,
	type ApiMessage,
} from "@/api/services/messagingService";
import authStore from "@/store/authStore";
import type { Conversation, Message } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

function toConversation(api: ApiConversation): Conversation {
	return {
		id: api.id ?? (api as unknown as { _id: string })._id,
		customerId: api.customerId,
		customerName: api.customerName,
		lastMessage: api.lastMessage,
		lastMessageTime: api.lastMessageTime,
		unreadCount: api.unreadCount,
		messages: (api.messages ?? []).map(toMessage),
	};
}

function toMessage(m: ApiMessage): Message {
	return {
		id: m._id ?? m.id ?? `${Date.now()}-${Math.random()}`,
		senderId: m.senderId,
		text: m.text,
		timestamp: m.createdAt
			? new Date(m.createdAt).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})
			: (m.timestamp ?? ""),
		read: m.read,
	};
}

export function useMessages() {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConversation, setSelectedConversationRaw] =
		useState<Conversation | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const socketRef = useRef<Socket | null>(null);

	// Fetch conversation list on mount
	useEffect(() => {
		messagingService
			.getConversations()
			.then((data) => {
				setConversations((data.conversations ?? []).map(toConversation));
			})
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, []);

	// Connect socket once
	useEffect(() => {
		const state = authStore.getState();
		const token =
			state.currentRole === "partner"
				? state.partnerToken?.accessToken
				: state.userToken?.accessToken;
		if (!token) return;

		const socket = io(SOCKET_URL, {
			auth: { token },
			transports: ["websocket", "polling"],
		});
		socketRef.current = socket;

		socket.on("new_message", (rawMsg: ApiMessage) => {
			const msg = toMessage(rawMsg);
			const convId = String(rawMsg.conversationId);
			setConversations((prev) =>
				prev.map((c) =>
					c.id === convId
						? {
								...c,
								messages: [...c.messages, msg],
								lastMessage: msg.text,
								lastMessageTime: msg.timestamp,
								unreadCount:
									msg.senderId !== "partner"
										? c.unreadCount + 1
										: c.unreadCount,
							}
						: c,
				),
			);
			setSelectedConversationRaw((prev) =>
				prev?.id === convId
					? { ...prev, messages: [...prev.messages, msg] }
					: prev,
			);
		});

		socket.on(
			"messages_read",
			({ conversationId }: { conversationId: string }) => {
				setConversations((prev) =>
					prev.map((c) =>
						c.id === conversationId ? { ...c, unreadCount: 0 } : c,
					),
				);
			},
		);

		return () => {
			socket.disconnect();
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every conversation/message change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [selectedConversation]);

	const setSelectedConversation = useCallback(
		async (conv: Conversation | null) => {
			if (!conv) {
				setSelectedConversationRaw(null);
				return;
			}

			// Fetch messages for the selected conversation
			try {
				const data = await messagingService.getConversation(conv.id);
				const full = toConversation(data.conversation);
				setSelectedConversationRaw(full);
				setConversations((prev) =>
					prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
				);
			} catch {
				setSelectedConversationRaw(conv);
			}

			// Join socket room
			socketRef.current?.emit("join_conversation", { conversationId: conv.id });
			socketRef.current?.emit("mark_read", { conversationId: conv.id });
		},
		[],
	);

	const handleSendMessage = useCallback(async () => {
		if (!newMessage.trim() || !selectedConversation) return;
		const text = newMessage.trim();
		setNewMessage("");

		if (socketRef.current?.connected) {
			socketRef.current.emit("send_message", {
				conversationId: selectedConversation.id,
				text,
			});
		} else {
			// REST fallback
			try {
				const data = await messagingService.sendMessage(
					selectedConversation.id,
					text,
				);
				const msg = toMessage(data.message);
				setSelectedConversationRaw((prev) =>
					prev ? { ...prev, messages: [...prev.messages, msg] } : null,
				);
				setConversations((prev) =>
					prev.map((c) =>
						c.id === selectedConversation.id
							? { ...c, lastMessage: msg.text, lastMessageTime: msg.timestamp }
							: c,
					),
				);
			} catch {}
		}
	}, [newMessage, selectedConversation]);

	const filteredConversations = conversations.filter((conv) => {
		if (!searchQuery) return true;
		return conv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
	});

	return {
		conversations: filteredConversations,
		selectedConversation,
		searchQuery,
		newMessage,
		messagesEndRef,
		isLoading,
		setSearchQuery,
		setNewMessage,
		setSelectedConversation,
		handleSendMessage,
	};
}
