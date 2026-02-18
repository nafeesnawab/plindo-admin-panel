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
	isTyping?: boolean;
}

export const mockConversations: Conversation[] = [
	{
		id: "conv-1",
		customerId: "c1",
		customerName: "John Smith",
		lastMessage: "Thanks! What time will you arrive?",
		lastMessageTime: "10:30 AM",
		unreadCount: 2,
		messages: [
			{ id: "m1", senderId: "c1", text: "Hi, I booked a car wash for today", timestamp: "10:00 AM", read: true },
			{ id: "m2", senderId: "partner", text: "Hello John! We'll be there soon!", timestamp: "10:05 AM", read: true },
			{ id: "m3", senderId: "c1", text: "Thanks! What time will you arrive?", timestamp: "10:30 AM", read: false },
		],
	},
	{
		id: "conv-2",
		customerId: "c2",
		customerName: "Sarah Johnson",
		lastMessage: "Can we reschedule to 3 PM?",
		lastMessageTime: "Yesterday",
		unreadCount: 1,
		messages: [
			{ id: "m1", senderId: "c2", text: "Hi, I have a booking for tomorrow", timestamp: "Yesterday 2:00 PM", read: true },
			{ id: "m2", senderId: "partner", text: "Yes, scheduled for 11 AM. Is everything okay?", timestamp: "Yesterday 2:15 PM", read: true },
			{ id: "m3", senderId: "c2", text: "Can we reschedule to 3 PM?", timestamp: "Yesterday 2:30 PM", read: false },
		],
	},
	{
		id: "conv-3",
		customerId: "c3",
		customerName: "Mike Brown",
		lastMessage: "The car looks amazing! Thank you!",
		lastMessageTime: "Jan 18",
		unreadCount: 0,
		messages: [
			{ id: "m1", senderId: "partner", text: "Hi Mike, your car wash is complete!", timestamp: "Jan 18 4:00 PM", read: true },
			{ id: "m2", senderId: "c3", text: "The car looks amazing! Thank you!", timestamp: "Jan 18 4:30 PM", read: true },
			{ id: "m3", senderId: "partner", text: "Glad you liked it! See you next time.", timestamp: "Jan 18 4:35 PM", read: true },
		],
	},
];
