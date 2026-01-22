import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface Message {
	id: string;
	senderId: string;
	text: string;
	timestamp: string;
	read: boolean;
	type: "text" | "image";
	imageUrl?: string;
}

interface Conversation {
	id: string;
	customerId: string;
	customerName: string;
	bookingId: string;
	bookingStatus: "active" | "completed" | "upcoming";
	service: string;
	lastMessage: string;
	lastMessageTime: string;
	unreadCount: number;
	messages: Message[];
}

// In-memory storage
const conversationsStore = new Map<string, Conversation[]>();

// Generate mock conversations
const generateMockConversations = (partnerId: string): Conversation[] => {
	return [
		{
			id: `${partnerId}-conv-1`,
			customerId: "c1",
			customerName: "John Smith",
			bookingId: "BK-2001",
			bookingStatus: "active",
			service: "Premium Full Detail",
			lastMessage: "Thanks! What time will you arrive?",
			lastMessageTime: "10:30 AM",
			unreadCount: 2,
			messages: [
				{
					id: "m1",
					senderId: "c1",
					text: "Hi, I booked a car wash for today",
					timestamp: "10:00 AM",
					read: true,
					type: "text",
				},
				{
					id: "m2",
					senderId: "partner",
					text: "Hello John! Yes, I can see your booking. We'll be there soon!",
					timestamp: "10:05 AM",
					read: true,
					type: "text",
				},
				{
					id: "m3",
					senderId: "c1",
					text: "Great! My car is the blue BMW in the driveway",
					timestamp: "10:15 AM",
					read: true,
					type: "text",
				},
				{
					id: "m4",
					senderId: "partner",
					text: "Perfect, I'll look for it. See you shortly!",
					timestamp: "10:20 AM",
					read: true,
					type: "text",
				},
				{
					id: "m5",
					senderId: "c1",
					text: "Thanks! What time will you arrive?",
					timestamp: "10:30 AM",
					read: false,
					type: "text",
				},
				{
					id: "m6",
					senderId: "c1",
					text: "Also, please be careful with the side mirrors",
					timestamp: "10:31 AM",
					read: false,
					type: "text",
				},
			],
		},
		{
			id: `${partnerId}-conv-2`,
			customerId: "c2",
			customerName: "Sarah Johnson",
			bookingId: "BK-2002",
			bookingStatus: "upcoming",
			service: "Interior Deep Clean",
			lastMessage: "Can we reschedule to 3 PM?",
			lastMessageTime: "Yesterday",
			unreadCount: 1,
			messages: [
				{
					id: "m1",
					senderId: "c2",
					text: "Hi, I have a booking for tomorrow",
					timestamp: "Yesterday 2:00 PM",
					read: true,
					type: "text",
				},
				{
					id: "m2",
					senderId: "partner",
					text: "Yes, I see it scheduled for 11 AM. Is everything okay?",
					timestamp: "Yesterday 2:15 PM",
					read: true,
					type: "text",
				},
				{
					id: "m3",
					senderId: "c2",
					text: "Can we reschedule to 3 PM?",
					timestamp: "Yesterday 2:30 PM",
					read: false,
					type: "text",
				},
			],
		},
		{
			id: `${partnerId}-conv-3`,
			customerId: "c3",
			customerName: "Mike Brown",
			bookingId: "BK-1998",
			bookingStatus: "completed",
			service: "Basic Exterior Wash",
			lastMessage: "The car looks amazing! Thank you!",
			lastMessageTime: "Jan 18",
			unreadCount: 0,
			messages: [
				{
					id: "m1",
					senderId: "partner",
					text: "Hi Mike, your car wash is complete!",
					timestamp: "Jan 18 4:00 PM",
					read: true,
					type: "text",
				},
				{
					id: "m2",
					senderId: "partner",
					text: "Here's a photo of your car:",
					timestamp: "Jan 18 4:01 PM",
					read: true,
					type: "image",
					imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400",
				},
				{
					id: "m3",
					senderId: "c3",
					text: "The car looks amazing! Thank you!",
					timestamp: "Jan 18 4:30 PM",
					read: true,
					type: "text",
				},
			],
		},
		{
			id: `${partnerId}-conv-4`,
			customerId: "c4",
			customerName: "Emily Davis",
			bookingId: "BK-2003",
			bookingStatus: "active",
			service: "Full Detail Package",
			lastMessage: "On my way now",
			lastMessageTime: "9:45 AM",
			unreadCount: 0,
			messages: [
				{
					id: "m1",
					senderId: "c4",
					text: "Good morning! Are you still coming at 10?",
					timestamp: "9:30 AM",
					read: true,
					type: "text",
				},
				{
					id: "m2",
					senderId: "partner",
					text: "Good morning Emily! Yes, absolutely.",
					timestamp: "9:35 AM",
					read: true,
					type: "text",
				},
				{ id: "m3", senderId: "partner", text: "On my way now", timestamp: "9:45 AM", read: true, type: "text" },
			],
		},
	];
};

// Initialize partner data
const initializePartnerData = (partnerId: string) => {
	if (!conversationsStore.has(partnerId)) {
		conversationsStore.set(partnerId, generateMockConversations(partnerId));
	}
};

// Initialize demo partner
initializePartnerData("demo-partner-1");

// API Handlers
const getConversations = http.get("/api/partner/messages/conversations", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const filter = url.searchParams.get("filter") || "all";
	const search = url.searchParams.get("search");

	initializePartnerData(partnerId);
	let conversations = conversationsStore.get(partnerId) || [];

	// Apply filters
	if (filter === "unread") {
		conversations = conversations.filter((c) => c.unreadCount > 0);
	} else if (filter === "active") {
		conversations = conversations.filter((c) => c.bookingStatus === "active");
	} else if (filter === "past") {
		conversations = conversations.filter((c) => c.bookingStatus === "completed");
	}

	if (search) {
		const query = search.toLowerCase();
		conversations = conversations.filter(
			(c) => c.customerName.toLowerCase().includes(query) || c.bookingId.toLowerCase().includes(query),
		);
	}

	const totalUnread = (conversationsStore.get(partnerId) || []).reduce((sum, c) => sum + c.unreadCount, 0);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { conversations, totalUnread },
	});
});

const getConversation = http.get("/api/partner/messages/conversations/:id", async ({ params, request }) => {
	await delay(200);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const conversations = conversationsStore.get(partnerId) || [];
	const conversation = conversations.find((c) => c.id === id);

	if (!conversation) {
		return HttpResponse.json({ status: 10001, message: "Conversation not found" }, { status: 404 });
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { conversation },
	});
});

const sendMessage = http.post("/api/partner/messages/conversations/:id/send", async ({ params, request }) => {
	await delay(300);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const body = (await request.json()) as { text: string; type?: "text" | "image"; imageUrl?: string };

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
		type: body.type || "text",
		imageUrl: body.imageUrl,
	};

	conversations[convIndex].messages.push(message);
	conversations[convIndex].lastMessage = body.type === "image" ? "📷 Photo" : body.text;
	conversations[convIndex].lastMessageTime = message.timestamp;

	conversationsStore.set(partnerId, conversations);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Message sent",
		data: { message },
	});
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

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Marked as read",
	});
});

const getUnreadCount = http.get("/api/partner/messages/unread-count", async ({ request }) => {
	await delay(100);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const conversations = conversationsStore.get(partnerId) || [];
	const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { unreadCount: totalUnread },
	});
});

export const partnerMessagesHandlers = [getConversations, getConversation, sendMessage, markAsRead, getUnreadCount];
