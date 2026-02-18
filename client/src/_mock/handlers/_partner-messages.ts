import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

interface Message {
	id: string;
	senderId: string;
	text: string;
	timestamp: string;
	read: boolean;
}

interface Conversation {
	id: string;
	customerId: string;
	customerName: string;
	lastMessage: string;
	lastMessageTime: string;
	unreadCount: number;
	messages: Message[];
}

const conversationsStore = new Map<string, Conversation[]>();

const generateMockConversations = (partnerId: string): Conversation[] => [
	{
		id: `${partnerId}-conv-1`,
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
		id: `${partnerId}-conv-2`,
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
		id: `${partnerId}-conv-3`,
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

const initializePartnerData = (partnerId: string) => {
	if (!conversationsStore.has(partnerId)) {
		conversationsStore.set(partnerId, generateMockConversations(partnerId));
	}
};

initializePartnerData("demo-partner-1");

const getConversations = http.get("/api/partner/messages/conversations", async ({ request }) => {
	await delay(300);
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const search = url.searchParams.get("search");

	initializePartnerData(partnerId);
	let conversations = conversationsStore.get(partnerId) || [];

	if (search) {
		const query = search.toLowerCase();
		conversations = conversations.filter((c) => c.customerName.toLowerCase().includes(query));
	}

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "", data: { conversations } });
});

const getConversation = http.get("/api/partner/messages/conversations/:id", async ({ params, request }) => {
	await delay(200);
	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const conversation = (conversationsStore.get(partnerId) || []).find((c) => c.id === id);

	if (!conversation) {
		return HttpResponse.json({ status: 10001, message: "Conversation not found" }, { status: 404 });
	}

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "", data: { conversation } });
});

const sendMessage = http.post("/api/partner/messages/conversations/:id/send", async ({ params, request }) => {
	await delay(300);
	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { text: string };

	initializePartnerData(partnerId);
	const conversations = conversationsStore.get(partnerId) || [];
	const convIndex = conversations.findIndex((c) => c.id === id);

	if (convIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Conversation not found" }, { status: 404 });
	}

	const message: Message = {
		id: `m-${Date.now()}`,
		senderId: "partner",
		text: body.text,
		timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		read: false,
	};

	conversations[convIndex].messages.push(message);
	conversations[convIndex].lastMessage = body.text;
	conversations[convIndex].lastMessageTime = message.timestamp;
	conversationsStore.set(partnerId, conversations);

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "Message sent", data: { message } });
});

const markAsRead = http.post("/api/partner/messages/conversations/:id/read", async ({ params, request }) => {
	await delay(100);
	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const conversations = conversationsStore.get(partnerId) || [];
	const convIndex = conversations.findIndex((c) => c.id === id);

	if (convIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Conversation not found" }, { status: 404 });
	}

	conversations[convIndex].unreadCount = 0;
	conversations[convIndex].messages = conversations[convIndex].messages.map((m) => ({ ...m, read: true }));
	conversationsStore.set(partnerId, conversations);

	return HttpResponse.json({ status: ResultStatus.SUCCESS, message: "Marked as read" });
});

export const partnerMessagesHandlers = [getConversations, getConversation, sendMessage, markAsRead];
