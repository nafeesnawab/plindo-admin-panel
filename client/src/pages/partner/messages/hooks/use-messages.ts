import { useEffect, useRef, useState } from "react";

import type { Conversation, Message } from "../types";
import { mockConversations } from "../types";

export function useMessages() {
	const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
	const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const filteredConversations = conversations.filter((conv) => {
		if (!searchQuery) return true;
		return conv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const messagesLength = selectedConversation?.messages.length;
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messagesLength]);

	useEffect(() => {
		if (!selectedConversation) return;
		const convId = selectedConversation.id;
		setConversations((prev) =>
			prev.map((c) =>
				c.id === convId
					? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
					: c,
			),
		);
	}, [selectedConversation]);

	const handleSendMessage = () => {
		if (!newMessage.trim() || !selectedConversation) return;

		const message: Message = {
			id: `m-${Date.now()}`,
			senderId: "partner",
			text: newMessage.trim(),
			timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			read: false,
		};

		setConversations((prev) =>
			prev.map((c) =>
				c.id === selectedConversation.id
					? { ...c, messages: [...c.messages, message], lastMessage: message.text, lastMessageTime: message.timestamp }
					: c,
			),
		);

		setSelectedConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : null));
		setNewMessage("");

		setTimeout(() => {
			setConversations((prev) => prev.map((c) => (c.id === selectedConversation.id ? { ...c, isTyping: true } : c)));
			setSelectedConversation((prev) => (prev ? { ...prev, isTyping: true } : null));
		}, 1000);

		setTimeout(() => {
			setConversations((prev) => prev.map((c) => (c.id === selectedConversation.id ? { ...c, isTyping: false } : c)));
			setSelectedConversation((prev) => (prev ? { ...prev, isTyping: false } : null));
		}, 3000);
	};

	return {
		conversations: filteredConversations,
		selectedConversation,
		searchQuery,
		newMessage,
		messagesEndRef,
		setSearchQuery,
		setNewMessage,
		setSelectedConversation,
		handleSendMessage,
	};
}
