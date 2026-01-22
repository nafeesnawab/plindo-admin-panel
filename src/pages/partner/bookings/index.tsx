import {
	AlertCircle,
	Calendar,
	Car,
	CheckCircle,
	Clock,
	Filter,
	MessageCircle,
	MoreHorizontal,
	Search,
	Timer,
	User,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

// Types
interface Order {
	id: string;
	bookingId: string;
	customer: {
		name: string;
		phone: string;
		avatar?: string;
	};
	service: string;
	vehicle: {
		make: string;
		model: string;
		plate: string;
		color: string;
	};
	scheduledDate: string;
	scheduledTime: string;
	price: number;
	status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
	driver?: string;
	rating?: number;
	review?: string;
	cancellationReason?: string;
	cancelledBy?: "partner" | "customer";
	createdAt: string;
	expiresAt?: string;
}

// Mock data
const mockOrders: Order[] = [
	{
		id: "1",
		bookingId: "BK-2024-001",
		customer: { name: "John Smith", phone: "+353 86 123 4567" },
		service: "Full Detail Wash",
		vehicle: { make: "BMW", model: "X5", plate: "D 123 ABC", color: "Black" },
		scheduledDate: "2024-01-22",
		scheduledTime: "09:00",
		price: 85,
		status: "pending",
		createdAt: new Date(Date.now() - 60000).toISOString(),
		expiresAt: new Date(Date.now() + 60000).toISOString(),
	},
	{
		id: "2",
		bookingId: "BK-2024-002",
		customer: { name: "Sarah Johnson", phone: "+353 87 234 5678" },
		service: "Premium Wash",
		vehicle: { make: "Tesla", model: "Model 3", plate: "D 456 DEF", color: "White" },
		scheduledDate: "2024-01-22",
		scheduledTime: "10:30",
		price: 55,
		status: "pending",
		createdAt: new Date(Date.now() - 30000).toISOString(),
		expiresAt: new Date(Date.now() + 90000).toISOString(),
	},
	{
		id: "3",
		bookingId: "BK-2024-003",
		customer: { name: "Mike Brown", phone: "+353 85 345 6789" },
		service: "Interior Clean",
		vehicle: { make: "Audi", model: "A4", plate: "D 789 GHI", color: "Silver" },
		scheduledDate: "2024-01-22",
		scheduledTime: "12:00",
		price: 45,
		status: "accepted",
		createdAt: new Date(Date.now() - 3600000).toISOString(),
	},
	{
		id: "4",
		bookingId: "BK-2024-004",
		customer: { name: "Emily Davis", phone: "+353 89 456 7890" },
		service: "Basic Wash",
		vehicle: { make: "Honda", model: "Civic", plate: "D 012 JKL", color: "Red" },
		scheduledDate: "2024-01-22",
		scheduledTime: "14:00",
		price: 25,
		status: "in_progress",
		driver: "James Wilson",
		createdAt: new Date(Date.now() - 7200000).toISOString(),
	},
	{
		id: "5",
		bookingId: "BK-2024-005",
		customer: { name: "David Lee", phone: "+353 83 567 8901" },
		service: "Full Detail Wash",
		vehicle: { make: "Mercedes", model: "C-Class", plate: "D 345 MNO", color: "Blue" },
		scheduledDate: "2024-01-21",
		scheduledTime: "15:30",
		price: 85,
		status: "completed",
		driver: "James Wilson",
		rating: 5,
		review: "Excellent service! Very thorough and professional.",
		createdAt: new Date(Date.now() - 86400000).toISOString(),
	},
	{
		id: "6",
		bookingId: "BK-2024-006",
		customer: { name: "Lisa Chen", phone: "+353 86 678 9012" },
		service: "Premium Wash",
		vehicle: { make: "Volkswagen", model: "Golf", plate: "D 678 PQR", color: "Gray" },
		scheduledDate: "2024-01-21",
		scheduledTime: "11:00",
		price: 55,
		status: "completed",
		driver: "Mark Thompson",
		rating: 4,
		createdAt: new Date(Date.now() - 90000000).toISOString(),
	},
	{
		id: "7",
		bookingId: "BK-2024-007",
		customer: { name: "Tom Wilson", phone: "+353 87 789 0123" },
		service: "Interior Clean",
		vehicle: { make: "Ford", model: "Focus", plate: "D 901 STU", color: "Green" },
		scheduledDate: "2024-01-20",
		scheduledTime: "09:30",
		price: 45,
		status: "cancelled",
		cancellationReason: "Customer requested cancellation due to schedule conflict",
		cancelledBy: "customer",
		createdAt: new Date(Date.now() - 172800000).toISOString(),
	},
	{
		id: "8",
		bookingId: "BK-2024-008",
		customer: { name: "Anna Martinez", phone: "+353 85 890 1234" },
		service: "Basic Wash",
		vehicle: { make: "Toyota", model: "Corolla", plate: "D 234 VWX", color: "White" },
		scheduledDate: "2024-01-23",
		scheduledTime: "16:00",
		price: 25,
		status: "accepted",
		createdAt: new Date(Date.now() - 1800000).toISOString(),
	},
];

// Countdown Timer Component
function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
	const [timeLeft, setTimeLeft] = useState<number>(0);

	useEffect(() => {
		const calculateTimeLeft = () => {
			const difference = new Date(expiresAt).getTime() - Date.now();
			return Math.max(0, Math.floor(difference / 1000));
		};

		setTimeLeft(calculateTimeLeft());

		const timer = setInterval(() => {
			const remaining = calculateTimeLeft();
			setTimeLeft(remaining);
			if (remaining <= 0) {
				clearInterval(timer);
				onExpire();
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [expiresAt, onExpire]);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const isUrgent = timeLeft < 30;

	return (
		<div
			className={cn(
				"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
				isUrgent
					? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
					: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
			)}
		>
			<Timer className="h-3.5 w-3.5" />
			{minutes}:{seconds.toString().padStart(2, "0")}
		</div>
	);
}

// Status Badge Component
function StatusBadge({ status }: { status: Order["status"] }) {
	const config: Record<Order["status"], { label: string; className: string; icon: React.ReactNode }> = {
		pending: {
			label: "Pending",
			className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
			icon: <Clock className="h-3 w-3" />,
		},
		accepted: {
			label: "Scheduled",
			className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
			icon: <Calendar className="h-3 w-3" />,
		},
		in_progress: {
			label: "In Progress",
			className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
			icon: <Car className="h-3 w-3" />,
		},
		completed: {
			label: "Completed",
			className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
			icon: <CheckCircle className="h-3 w-3" />,
		},
		cancelled: {
			label: "Cancelled",
			className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
			icon: <XCircle className="h-3 w-3" />,
		},
	};

	const { label, className, icon } = config[status];

	return (
		<Badge className={cn("flex items-center gap-1", className)}>
			{icon}
			{label}
		</Badge>
	);
}

// Order Card Component
function OrderCard({
	order,
	onAccept,
	onDecline,
	onCancel,
	onViewDetails,
	onChat,
	showTimer = false,
}: {
	order: Order;
	onAccept?: () => void;
	onDecline?: () => void;
	onCancel?: () => void;
	onViewDetails: () => void;
	onChat?: () => void;
	showTimer?: boolean;
}) {
	const handleCardClick = (e: React.MouseEvent) => {
		// Don't navigate if clicking on buttons or interactive elements
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest('[role="menuitem"]')) {
			return;
		}
		onViewDetails();
	};

	return (
		<Card className="transition-shadow hover:shadow-md cursor-pointer" onClick={handleCardClick}>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					{/* Left: Order Info */}
					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-3">
							<StatusBadge status={order.status} />
							<span className="text-sm text-muted-foreground">{order.bookingId}</span>
							{showTimer && order.expiresAt && (
								<CountdownTimer
									expiresAt={order.expiresAt}
									onExpire={() => toast.error(`Order ${order.bookingId} expired`)}
								/>
							)}
						</div>

						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="font-medium">{order.customer.name}</p>
								<p className="text-sm text-muted-foreground">{order.customer.phone}</p>
							</div>
						</div>

						<div className="grid gap-2 text-sm sm:grid-cols-2">
							<div>
								<span className="text-muted-foreground">Service:</span>{" "}
								<span className="font-medium">{order.service}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Vehicle:</span>{" "}
								<span className="font-medium">
									{order.vehicle.make} {order.vehicle.model}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Date:</span>{" "}
								<span className="font-medium">{order.scheduledDate}</span>
							</div>
							<div>
								<span className="text-muted-foreground">Time:</span>{" "}
								<span className="font-medium">{order.scheduledTime}</span>
							</div>
						</div>

						{order.driver && (
							<div className="text-sm">
								<span className="text-muted-foreground">Driver:</span>{" "}
								<span className="font-medium">{order.driver}</span>
							</div>
						)}

						{order.rating && (
							<div className="flex items-center gap-1 text-sm">
								<span className="text-muted-foreground">Rating:</span>
								<div className="flex items-center gap-0.5">
									{[1, 2, 3, 4, 5].map((star) => (
										<span
											key={`star-${star}`}
											className={cn("text-lg", star <= (order.rating ?? 0) ? "text-yellow-500" : "text-gray-300")}
										>
											★
										</span>
									))}
								</div>
							</div>
						)}

						{order.cancellationReason && (
							<div className="rounded-lg bg-red-50 p-2 text-sm dark:bg-red-950">
								<span className="text-red-600 dark:text-red-400">
									Cancelled by {order.cancelledBy}: {order.cancellationReason}
								</span>
							</div>
						)}
					</div>

					{/* Right: Price & Actions */}
					<div className="flex flex-col items-end gap-3">
						<p className="text-2xl font-bold">€{order.price}</p>

						{order.status === "pending" && onAccept && onDecline && (
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={onDecline} className="text-destructive">
									<XCircle className="mr-1 h-4 w-4" />
									Decline
								</Button>
								<Button size="sm" onClick={onAccept}>
									<CheckCircle className="mr-1 h-4 w-4" />
									Accept
								</Button>
							</div>
						)}

						{(order.status === "accepted" || order.status === "in_progress") && (
							<div className="flex gap-2">
								{onChat && (
									<Button size="sm" variant="outline" onClick={onChat}>
										<MessageCircle className="mr-1 h-4 w-4" />
										Chat
									</Button>
								)}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="sm" variant="outline">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={onViewDetails}>View Details</DropdownMenuItem>
										{order.status === "accepted" && onCancel && (
											<DropdownMenuItem onClick={onCancel} className="text-destructive">
												Cancel Booking
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						)}

						{(order.status === "completed" || order.status === "cancelled") && (
							<Button size="sm" variant="outline" onClick={onViewDetails}>
								View Details
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function PartnerBookingsPage() {
	const navigate = useNavigate();
	const [orders, setOrders] = useState<Order[]>(mockOrders);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [cancelReason, setCancelReason] = useState("");

	// Filter orders by tab
	const pendingOrders = orders.filter((o) => o.status === "pending");
	const activeOrders = orders.filter((o) => o.status === "accepted" || o.status === "in_progress");
	const historyOrders = orders.filter((o) => o.status === "completed" || o.status === "cancelled");

	// Search and filter
	const filterOrders = (orderList: Order[]) => {
		return orderList.filter((order) => {
			const matchesSearch =
				searchQuery === "" ||
				order.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.service.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesStatus = statusFilter === "all" || order.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	};

	const handleAccept = (orderId: string) => {
		setOrders((prev) =>
			prev.map((o) => (o.id === orderId ? { ...o, status: "accepted" as const, expiresAt: undefined } : o)),
		);
		toast.success("Order accepted successfully");
	};

	const handleDecline = (orderId: string) => {
		setOrders((prev) =>
			prev.map((o) =>
				o.id === orderId
					? {
							...o,
							status: "cancelled" as const,
							cancelledBy: "partner" as const,
							cancellationReason: "Declined by partner",
							expiresAt: undefined,
						}
					: o,
			),
		);
		toast.info("Order declined");
	};

	const handleCancelClick = (order: Order) => {
		setSelectedOrder(order);
		setCancelDialogOpen(true);
	};

	const handleCancelConfirm = () => {
		if (selectedOrder && cancelReason) {
			setOrders((prev) =>
				prev.map((o) =>
					o.id === selectedOrder.id
						? {
								...o,
								status: "cancelled" as const,
								cancelledBy: "partner" as const,
								cancellationReason: cancelReason,
							}
						: o,
				),
			);
			toast.info("Order cancelled");
			setCancelDialogOpen(false);
			setCancelReason("");
			setSelectedOrder(null);
		}
	};

	const handleViewDetails = (order: Order) => {
		navigate(`/partner/bookings/${order.id}`);
	};

	const handleChat = (order: Order) => {
		toast.info(`Opening chat with ${order.customer.name}`);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold">Orders</h1>
				<p className="text-muted-foreground">Manage your bookings and orders</p>
			</div>

			{/* Search & Filters */}
			<div className="flex flex-col gap-4 sm:flex-row">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by booking ID, customer, or service..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full sm:w-[180px]">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="accepted">Scheduled</SelectItem>
						<SelectItem value="in_progress">In Progress</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
						<SelectItem value="cancelled">Cancelled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="pending" className="space-y-4">
				<TabsList>
					<TabsTrigger value="pending" className="gap-2">
						<AlertCircle className="h-4 w-4" />
						Pending
						{pendingOrders.length > 0 && (
							<Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
								{pendingOrders.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="active" className="gap-2">
						<Car className="h-4 w-4" />
						Active
						{activeOrders.length > 0 && (
							<Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
								{activeOrders.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="history" className="gap-2">
						<Clock className="h-4 w-4" />
						History
					</TabsTrigger>
				</TabsList>

				{/* Pending Orders Tab */}
				<TabsContent value="pending" className="space-y-4">
					<Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Timer className="h-5 w-5 text-yellow-600" />
								Action Required
							</CardTitle>
							<CardDescription>You have 2 minutes to respond to each booking request</CardDescription>
						</CardHeader>
					</Card>

					{filterOrders(pendingOrders).length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<CheckCircle className="h-12 w-12 text-green-500" />
								<p className="mt-4 text-lg font-medium">All caught up!</p>
								<p className="text-muted-foreground">No pending orders at the moment</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filterOrders(pendingOrders).map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									showTimer
									onAccept={() => handleAccept(order.id)}
									onDecline={() => handleDecline(order.id)}
									onViewDetails={() => handleViewDetails(order)}
								/>
							))}
						</div>
					)}
				</TabsContent>

				{/* Active Orders Tab */}
				<TabsContent value="active" className="space-y-4">
					{filterOrders(activeOrders).length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Calendar className="h-12 w-12 text-muted-foreground" />
								<p className="mt-4 text-lg font-medium">No active orders</p>
								<p className="text-muted-foreground">Accept pending orders to see them here</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filterOrders(activeOrders).map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									onCancel={() => handleCancelClick(order)}
									onViewDetails={() => handleViewDetails(order)}
									onChat={() => handleChat(order)}
								/>
							))}
						</div>
					)}
				</TabsContent>

				{/* History Tab */}
				<TabsContent value="history" className="space-y-4">
					{filterOrders(historyOrders).length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Clock className="h-12 w-12 text-muted-foreground" />
								<p className="mt-4 text-lg font-medium">No order history</p>
								<p className="text-muted-foreground">Completed and cancelled orders will appear here</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{filterOrders(historyOrders).map((order) => (
								<OrderCard key={order.id} order={order} onViewDetails={() => handleViewDetails(order)} />
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Cancel Dialog */}
			<Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Booking</DialogTitle>
						<DialogDescription>
							Please provide a reason for cancelling this booking. This will be shared with the customer.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter cancellation reason..."
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
						className="min-h-[100px]"
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
							Keep Booking
						</Button>
						<Button variant="destructive" onClick={handleCancelConfirm} disabled={!cancelReason.trim()}>
							Cancel Booking
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
