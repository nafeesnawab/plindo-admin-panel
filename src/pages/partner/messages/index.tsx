import { Check, CheckCheck, Image, MoreVertical, Search, Send, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { cn } from "@/utils";

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
	customerAvatar?: string;
	bookingId: string;
	bookingStatus: "active" | "completed" | "upcoming";
	service: string;
	lastMessage: string;
	lastMessageTime: string;
	unreadCount: number;
	messages: Message[];
	isTyping?: boolean;
}

// Mock data
const mockConversations: Conversation[] = [
	{
		id: "conv-1",
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
		id: "conv-2",
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
		id: "conv-3",
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
		id: "conv-4",
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
	{
		id: "conv-5",
		customerId: "c5",
		customerName: "James Wilson",
		bookingId: "BK-1995",
		bookingStatus: "completed",
		service: "Premium Detail",
		lastMessage: "Will book again next month!",
		lastMessageTime: "Jan 15",
		unreadCount: 0,
		messages: [
			{
				id: "m1",
				senderId: "partner",
				text: "All done James! Your Tesla is sparkling clean.",
				timestamp: "Jan 15 3:00 PM",
				read: true,
				type: "text",
			},
			{
				id: "m2",
				senderId: "c5",
				text: "Wow, excellent work! Very impressed.",
				timestamp: "Jan 15 3:30 PM",
				read: true,
				type: "text",
			},
			{
				id: "m3",
				senderId: "c5",
				text: "Will book again next month!",
				timestamp: "Jan 15 3:31 PM",
				read: true,
				type: "text",
			},
		],
	},
];

export default function PartnerMessagesPage() {
	const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
	const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState("all");
	const [newMessage, setNewMessage] = useState("");
	const [showBookingDetails, setShowBookingDetails] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Total unread count
	const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

	// Filter conversations
	const filteredConversations = conversations.filter((conv) => {
		if (filter === "unread" && conv.unreadCount === 0) return false;
		if (filter === "active" && conv.bookingStatus !== "active") return false;
		if (filter === "past" && conv.bookingStatus !== "completed") return false;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return conv.customerName.toLowerCase().includes(query) || conv.bookingId.toLowerCase().includes(query);
		}
		return true;
	});

	// Scroll to bottom when messages change
	const messagesLength = selectedConversation?.messages.length;
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messagesLength]);

	// Mark messages as read when conversation is selected
	useEffect(() => {
		if (selectedConversation) {
			const convId = selectedConversation.id;
			setConversations((prev) =>
				prev.map((c) =>
					c.id === convId
						? {
								...c,
								unreadCount: 0,
								messages: c.messages.map((m) => ({ ...m, read: true })),
							}
						: c,
				),
			);
		}
	}, [selectedConversation]);

	// Handle send message
	const handleSendMessage = () => {
		if (!newMessage.trim() || !selectedConversation) return;

		const message: Message = {
			id: `m-${Date.now()}`,
			senderId: "partner",
			text: newMessage.trim(),
			timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			read: false,
			type: "text",
		};

		setConversations((prev) =>
			prev.map((c) =>
				c.id === selectedConversation.id
					? {
							...c,
							messages: [...c.messages, message],
							lastMessage: message.text,
							lastMessageTime: message.timestamp,
						}
					: c,
			),
		);

		setSelectedConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : null));

		setNewMessage("");

		// Simulate typing indicator and response after 2 seconds
		setTimeout(() => {
			setConversations((prev) => prev.map((c) => (c.id === selectedConversation.id ? { ...c, isTyping: true } : c)));
			setSelectedConversation((prev) => (prev ? { ...prev, isTyping: true } : null));
		}, 1000);

		setTimeout(() => {
			setConversations((prev) => prev.map((c) => (c.id === selectedConversation.id ? { ...c, isTyping: false } : c)));
			setSelectedConversation((prev) => (prev ? { ...prev, isTyping: false } : null));
		}, 3000);
	};

	// Handle send image
	const handleSendImage = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !selectedConversation) return;

		// Simulate image upload
		const message: Message = {
			id: `m-${Date.now()}`,
			senderId: "partner",
			text: "Sent a photo",
			timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			read: false,
			type: "image",
			imageUrl: URL.createObjectURL(file),
		};

		setConversations((prev) =>
			prev.map((c) =>
				c.id === selectedConversation.id
					? {
							...c,
							messages: [...c.messages, message],
							lastMessage: "📷 Photo",
							lastMessageTime: message.timestamp,
						}
					: c,
			),
		);

		setSelectedConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : null));

		toast.success("Photo sent");
		e.target.value = "";
	};

	// Select conversation
	const handleSelectConversation = (conv: Conversation) => {
		setSelectedConversation(conv);
	};

	return (
		<div className="h-[calc(100vh-120px)] flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-2xl font-bold">Messages</h1>
					<p className="text-muted-foreground">
						{totalUnread > 0 ? `${totalUnread} unread messages` : "All caught up!"}
					</p>
				</div>
				{totalUnread > 0 && (
					<Badge variant="destructive" className="text-sm px-3 py-1">
						{totalUnread} Unread
					</Badge>
				)}
			</div>

			{/* Main Content */}
			<div className="flex-1 flex gap-4 overflow-hidden">
				{/* Conversations List */}
				<Card className="w-80 flex flex-col overflow-hidden">
					<CardHeader className="pb-3 space-y-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search conversations..."
								className="pl-10"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<Select value={filter} onValueChange={setFilter}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Conversations</SelectItem>
								<SelectItem value="unread">Unread</SelectItem>
								<SelectItem value="active">Active Bookings</SelectItem>
								<SelectItem value="past">Past Bookings</SelectItem>
							</SelectContent>
						</Select>
					</CardHeader>
					<CardContent className="flex-1 overflow-y-auto p-0">
						{filteredConversations.length === 0 ? (
							<div className="p-6 text-center text-muted-foreground">No conversations found</div>
						) : (
							<div className="divide-y">
								{filteredConversations.map((conv) => (
									<button
										type="button"
										key={conv.id}
										onClick={() => handleSelectConversation(conv)}
										className={cn(
											"p-4 cursor-pointer hover:bg-muted/50 transition-colors",
											selectedConversation?.id === conv.id && "bg-muted",
										)}
									>
										<div className="flex items-start gap-3">
											<div className="relative">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
													<User className="h-5 w-5 text-primary" />
												</div>
												{conv.unreadCount > 0 && (
													<Badge
														variant="destructive"
														shape="circle"
														className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px]"
													>
														{conv.unreadCount}
													</Badge>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<p className={cn("font-medium truncate", conv.unreadCount > 0 && "font-semibold")}>
														{conv.customerName}
													</p>
													<span className="text-xs text-muted-foreground whitespace-nowrap">
														{conv.lastMessageTime}
													</span>
												</div>
												<p className="text-xs text-muted-foreground truncate">
													{conv.bookingId} • {conv.service}
												</p>
												<p
													className={cn(
														"text-sm truncate mt-1",
														conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground",
													)}
												>
													{conv.isTyping ? <span className="italic text-primary">typing...</span> : conv.lastMessage}
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Chat Window */}
				{selectedConversation ? (
					<Card className="flex-1 flex flex-col overflow-hidden">
						{/* Chat Header */}
						<CardHeader className="pb-3 border-b flex-row items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<User className="h-5 w-5 text-primary" />
								</div>
								<div>
									<CardTitle className="text-base">{selectedConversation.customerName}</CardTitle>
									<p className="text-xs text-muted-foreground">
										{selectedConversation.bookingId} • {selectedConversation.service}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={
										selectedConversation.bookingStatus === "active"
											? "success"
											: selectedConversation.bookingStatus === "upcoming"
												? "info"
												: "secondary"
									}
								>
									{selectedConversation.bookingStatus}
								</Badge>
								<Button variant="ghost" size="icon" onClick={() => setShowBookingDetails(!showBookingDetails)}>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</div>
						</CardHeader>

						{/* Messages Area */}
						<CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
							{selectedConversation.messages.map((message) => (
								<div
									key={message.id}
									className={cn("flex", message.senderId === "partner" ? "justify-end" : "justify-start")}
								>
									<div
										className={cn(
											"max-w-[70%] rounded-lg px-4 py-2",
											message.senderId === "partner" ? "bg-primary text-primary-foreground" : "bg-muted",
										)}
									>
										{message.type === "image" && message.imageUrl ? (
											<img src={message.imageUrl} alt="Sent" className="rounded-md max-w-full mb-2" />
										) : null}
										<p className="text-sm">{message.text}</p>
										<div
											className={cn(
												"flex items-center justify-end gap-1 mt-1",
												message.senderId === "partner" ? "text-primary-foreground/70" : "text-muted-foreground",
											)}
										>
											<span className="text-[10px]">{message.timestamp}</span>
											{message.senderId === "partner" &&
												(message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
										</div>
									</div>
								</div>
							))}

							{/* Typing Indicator */}
							{selectedConversation.isTyping && (
								<div className="flex justify-start">
									<div className="bg-muted rounded-lg px-4 py-2">
										<div className="flex items-center gap-1">
											<div
												className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
												style={{ animationDelay: "0ms" }}
											/>
											<div
												className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
												style={{ animationDelay: "150ms" }}
											/>
											<div
												className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
												style={{ animationDelay: "300ms" }}
											/>
										</div>
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</CardContent>

						{/* Message Input */}
						<div className="p-4 border-t">
							<div className="flex items-center gap-2">
								<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSendImage} />
								<Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
									<Image className="h-5 w-5" />
								</Button>
								<Input
									placeholder="Type a message..."
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
									className="flex-1"
								/>
								<Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</Card>
				) : (
					<Card className="flex-1 flex items-center justify-center">
						<div className="text-center text-muted-foreground">
							<User className="h-16 w-16 mx-auto mb-4 opacity-30" />
							<p className="text-lg font-medium">Select a conversation</p>
							<p className="text-sm">Choose a customer to start messaging</p>
						</div>
					</Card>
				)}

				{/* Booking Details Sidebar */}
				{selectedConversation && showBookingDetails && (
					<Card className="w-72 flex flex-col overflow-hidden">
						<CardHeader className="pb-3 border-b flex-row items-center justify-between">
							<CardTitle className="text-base">Booking Details</CardTitle>
							<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBookingDetails(false)}>
								<X className="h-4 w-4" />
							</Button>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
							<div>
								<p className="text-xs text-muted-foreground">Booking ID</p>
								<p className="font-medium">{selectedConversation.bookingId}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Service</p>
								<p className="font-medium">{selectedConversation.service}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Status</p>
								<Badge
									variant={
										selectedConversation.bookingStatus === "active"
											? "success"
											: selectedConversation.bookingStatus === "upcoming"
												? "info"
												: "secondary"
									}
								>
									{selectedConversation.bookingStatus}
								</Badge>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Customer</p>
								<p className="font-medium">{selectedConversation.customerName}</p>
							</div>

							<div className="pt-4 border-t space-y-2">
								<Button variant="outline" className="w-full" asChild>
									<a href={`/partner/bookings/${selectedConversation.bookingId.replace("BK-", "")}`}>
										View Full Booking
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
