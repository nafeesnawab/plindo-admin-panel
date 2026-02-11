import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Calendar, Car, CheckCircle2, Clock, Filter, MapPin, Package, Sparkles, Truck, XCircle } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import slotBookingService from "@/api/services/slotBookingService";
import {
	CalendarGrid,
	type CalendarGridRef,
	formatTimeDisplay,
	isSlotActive,
	isSlotInPast,
	minutesToPixels,
	SLOT_HEIGHT,
	timeToMinutes,
	timeToPixels,
} from "@/components/calendar/CalendarGrid";
import type { BookingStatus, ServiceCategory, SlotBooking } from "@/types/booking";
import { SERVICE_CATEGORY_COLORS, SERVICE_CATEGORY_LABELS, SERVICE_TYPE_LABELS } from "@/types/booking";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

const PARTNER_ID = "demo-partner-1";

// Status configuration
const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
	booked: { label: "Booked", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
	in_progress: {
		label: "In Progress",
		color: "text-purple-700",
		bgColor: "bg-purple-50",
		borderColor: "border-purple-400",
	},
	completed: { label: "Completed", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-300" },
	picked: { label: "Picked", color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-300" },
	out_for_delivery: {
		label: "Out for Delivery",
		color: "text-amber-700",
		bgColor: "bg-amber-50",
		borderColor: "border-amber-300",
	},
	delivered: { label: "Delivered", color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-300" },
	cancelled: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300" },
	rescheduled: {
		label: "Rescheduled",
		color: "text-orange-700",
		bgColor: "bg-orange-50",
		borderColor: "border-orange-300",
	},
};

// Category border colors for booking blocks
const CATEGORY_BORDER: Record<ServiceCategory, string> = {
	wash: "border-l-blue-500",
	detailing: "border-l-purple-500",
	other: "border-l-gray-500",
};

const CATEGORY_BG: Record<ServiceCategory, string> = {
	wash: "bg-blue-50",
	detailing: "bg-purple-50",
	other: "bg-gray-50",
};

// ============ BOOKING BLOCK ============

function BookingBlock({
	booking,
	onClick,
	onStartService,
	onComplete,
}: {
	booking: SlotBooking;
	onClick: () => void;
	onStartService?: () => void;
	onComplete?: () => void;
}) {
	const config = STATUS_CONFIG[booking.status];
	const startMinutes = timeToMinutes(booking.slot.startTime);
	const endMinutes = timeToMinutes(booking.slot.endTime);
	const durationMinutes = endMinutes - startMinutes;
	const topPosition = timeToPixels(booking.slot.startTime);
	const height = minutesToPixels(durationMinutes);
	const category = booking.service.serviceCategory;

	const slotDate = new Date(booking.slot.date);
	const isPast = isSlotInPast(slotDate, booking.slot.endTime);
	const isActive = isSlotActive(slotDate, booking.slot.startTime, booking.slot.endTime);
	const canStart = booking.status === "booked" && !isPast && !isActive;
	const canComplete = booking.status === "in_progress";

	return (
		<div
			className={cn(
				"absolute left-1 right-1 rounded-md border-l-4 overflow-hidden cursor-pointer transition-all hover:shadow-md",
				CATEGORY_BG[category],
				CATEGORY_BORDER[category],
				isPast && booking.status !== "completed" && booking.status !== "cancelled" && "opacity-60",
				isActive && "ring-2 ring-primary ring-offset-1",
			)}
			style={{
				top: topPosition,
				height: Math.max(height - 2, SLOT_HEIGHT - 2),
			}}
		>
			<button type="button" className="w-full h-full p-1.5 text-left focus:outline-none" onClick={onClick}>
				<div className="flex flex-col h-full overflow-hidden">
					<p className={cn("text-xs font-semibold truncate", config.color)}>
						{formatTimeDisplay(booking.slot.startTime)} • {booking.customer.name}
					</p>
					<p className="text-xs font-medium truncate">{booking.service.name}</p>
					{height > 45 && (
						<p className="text-[10px] text-muted-foreground truncate">
							{booking.bayName} • {booking.service.duration}min
						</p>
					)}
					{height > 65 && (
						<Badge variant="outline" className={cn("mt-auto text-[10px] h-5 w-fit", config.color)}>
							{config.label}
						</Badge>
					)}
				</div>
			</button>

			{(canStart || canComplete) && (
				<div className="absolute top-1 right-1 flex gap-0.5">
					{canStart && (
						<Button
							size="icon"
							variant="ghost"
							className="h-5 w-5 bg-white/80 hover:bg-white"
							onClick={(e) => {
								e.stopPropagation();
								onStartService?.();
							}}
						>
							<Clock className="h-3 w-3 text-purple-600" />
						</Button>
					)}
					{canComplete && (
						<Button
							size="icon"
							variant="ghost"
							className="h-5 w-5 bg-white/80 hover:bg-white"
							onClick={(e) => {
								e.stopPropagation();
								onComplete?.();
							}}
						>
							<CheckCircle2 className="h-3 w-3 text-green-600" />
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

// ============ BOOKING DETAILS DIALOG ============

function BookingDetailsDialog({
	booking,
	open,
	onOpenChange,
	onCancel,
	onReschedule,
	onStartService,
	onComplete,
}: {
	booking: SlotBooking | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCancel: () => void;
	onReschedule: () => void;
	onStartService: () => void;
	onComplete: () => void;
}) {
	if (!booking) return null;

	const config = STATUS_CONFIG[booking.status];
	const slotDate = new Date(booking.slot.date);
	const isPast = isSlotInPast(slotDate, booking.slot.endTime);
	const canModify = booking.status === "booked";
	const canStart = booking.status === "booked" && !isPast;
	const canComplete = booking.status === "in_progress";
	const catColors = SERVICE_CATEGORY_COLORS[booking.service.serviceCategory];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-2 pr-6 flex-wrap">
						<DialogTitle>Booking Details</DialogTitle>
						<Badge className={cn(config.bgColor, config.color, "border", config.borderColor)}>{config.label}</Badge>
						<Badge className={cn(catColors.bg, catColors.text, "border", catColors.border)}>
							{SERVICE_CATEGORY_LABELS[booking.service.serviceCategory]}
						</Badge>
					</div>
					<DialogDescription>
						{format(slotDate, "EEE, MMM d, yyyy")} • {formatTimeDisplay(booking.slot.startTime)} -{" "}
						{formatTimeDisplay(booking.slot.endTime)} • {booking.bayName}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Customer */}
					<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
						<Avatar className="h-10 w-10">
							<AvatarFallback>
								{booking.customer.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="font-medium truncate">{booking.customer.name}</p>
							<p className="text-sm text-muted-foreground truncate">{booking.customer.phone}</p>
						</div>
					</div>

					{/* Vehicle & Service */}
					<div className="grid grid-cols-2 gap-3">
						<div className="p-3 border rounded-lg">
							<div className="flex items-center gap-2 mb-1">
								<Car className="h-4 w-4 text-muted-foreground" />
								<span className="text-xs text-muted-foreground">Vehicle</span>
							</div>
							<p className="text-sm font-medium">
								{booking.vehicle.make} {booking.vehicle.model}
							</p>
							<p className="text-xs text-muted-foreground">{booking.vehicle.plateNumber}</p>
						</div>
						<div className="p-3 border rounded-lg">
							<div className="flex items-center gap-2 mb-1">
								<Sparkles className="h-4 w-4 text-muted-foreground" />
								<span className="text-xs text-muted-foreground">Service</span>
							</div>
							<p className="text-sm font-medium">{booking.service.name}</p>
							<p className="text-xs text-muted-foreground">
								{booking.service.duration}min • £{booking.pricing.finalPrice.toFixed(2)}
							</p>
						</div>
					</div>

					{/* Bay & Type */}
					<div className="flex items-center gap-4 text-sm">
						<div className="flex items-center gap-1.5">
							<MapPin className="h-3.5 w-3.5 text-muted-foreground" />
							<span>{booking.bayName}</span>
						</div>
						<div className="flex items-center gap-1.5">
							{booking.service.serviceType === "pick_by_me" && <Truck className="h-3.5 w-3.5 text-muted-foreground" />}
							<span>{SERVICE_TYPE_LABELS[booking.service.serviceType]}</span>
						</div>
					</div>

					{/* Product Order */}
					{booking.productOrder && (
						<div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
							<Package className="h-4 w-4 text-amber-600" />
							<span>
								{booking.productOrder.productCount} product{booking.productOrder.productCount > 1 ? "s" : ""} • £
								{booking.productOrder.totalAmount.toFixed(2)}
							</span>
						</div>
					)}

					{/* Actions */}
					{(canStart || canComplete || canModify) && (
						<div className="flex gap-2 pt-2 border-t">
							{canStart && (
								<Button size="sm" onClick={onStartService} className="flex-1 bg-purple-600 hover:bg-purple-700">
									<Clock className="mr-2 h-4 w-4" />
									Start Service
								</Button>
							)}
							{canComplete && (
								<Button size="sm" onClick={onComplete} className="flex-1 bg-green-600 hover:bg-green-700">
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Complete
								</Button>
							)}
							{canModify && (
								<Button size="sm" variant="outline" onClick={onReschedule}>
									<Calendar className="mr-2 h-4 w-4" />
									Reschedule
								</Button>
							)}
							{canModify && (
								<Button size="sm" variant="destructive" onClick={onCancel}>
									<XCircle className="mr-2 h-4 w-4" />
									Cancel
								</Button>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Link to={`/partner/bookings/${booking.id}`}>
						<Button variant="outline" size="sm">
							View Full Details
						</Button>
					</Link>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ============ CANCEL DIALOG ============

function CancelDialog({
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
	isLoading: boolean;
}) {
	const [reason, setReason] = useState("");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cancel Booking</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="cancel-reason">Reason</Label>
					<Textarea
						id="cancel-reason"
						placeholder="Reason for cancellation..."
						value={reason}
						onChange={(e) => setReason(e.target.value)}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Keep Booking
					</Button>
					<Button variant="destructive" onClick={() => onConfirm(reason)} disabled={isLoading || !reason.trim()}>
						{isLoading ? "Cancelling..." : "Cancel Booking"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ============ RESCHEDULE DIALOG ============

function RescheduleDialog({
	booking,
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: {
	booking: SlotBooking | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (date: string, startTime: string, endTime: string) => void;
	isLoading: boolean;
}) {
	const [newDate, setNewDate] = useState("");
	const [newStartTime, setNewStartTime] = useState("");

	if (!booking) return null;

	const duration = booking.service.duration;

	const calculateEndTime = (start: string) => {
		const startMin = timeToMinutes(start);
		const endMin = startMin + duration;
		const h = Math.floor(endMin / 60) % 24;
		const m = endMin % 60;
		return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Reschedule Booking</DialogTitle>
					<DialogDescription>Select a new date and time.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="p-3 bg-muted rounded-lg text-sm">
						<p className="font-medium">
							Current: {format(new Date(booking.slot.date), "EEE, MMM d")} at{" "}
							{formatTimeDisplay(booking.slot.startTime)}
						</p>
						<p className="text-muted-foreground">
							{booking.service.name} • {duration}min
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>New Date</Label>
							<Input
								type="date"
								value={newDate}
								onChange={(e) => setNewDate(e.target.value)}
								min={format(new Date(), "yyyy-MM-dd")}
							/>
						</div>
						<div className="space-y-2">
							<Label>Start Time</Label>
							<Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
						</div>
					</div>
					{newStartTime && (
						<p className="text-sm text-muted-foreground">
							End time: {formatTimeDisplay(calculateEndTime(newStartTime))} ({duration}min)
						</p>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={() => onConfirm(newDate, newStartTime, calculateEndTime(newStartTime))}
						disabled={isLoading || !newDate || !newStartTime}
					>
						{isLoading ? "Rescheduling..." : "Confirm"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ============ STATS ============

function WeekStats({ bookings }: { bookings: SlotBooking[] }) {
	const stats = useMemo(() => {
		const active = bookings.filter((b) => b.status !== "cancelled");
		const washCount = active.filter((b) => b.service.serviceCategory === "wash").length;
		const detailCount = active.filter((b) => b.service.serviceCategory === "detailing").length;
		const upcoming = bookings.filter((b) => b.status === "booked").length;
		const revenue = bookings
			.filter((b) => b.status === "completed" || b.status === "in_progress")
			.reduce((sum, b) => sum + b.pricing.finalPrice, 0);
		return { washCount, detailCount, upcoming, revenue };
	}, [bookings]);

	return (
		<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-blue-100">
							<Car className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.washCount}</p>
							<p className="text-xs text-muted-foreground">Wash bookings</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-purple-100">
							<Sparkles className="h-5 w-5 text-purple-600" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.detailCount}</p>
							<p className="text-xs text-muted-foreground">Detail bookings</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-green-100">
							<Calendar className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.upcoming}</p>
							<p className="text-xs text-muted-foreground">Upcoming</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-emerald-100">
							<span className="text-emerald-600 font-bold text-lg">£</span>
						</div>
						<div>
							<p className="text-2xl font-bold">£{stats.revenue.toFixed(0)}</p>
							<p className="text-xs text-muted-foreground">Revenue</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ MAIN PAGE ============

export default function PartnerBookingsPage() {
	const queryClient = useQueryClient();
	const calendarRef = useRef<CalendarGridRef>(null);
	const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
	const [selectedBooking, setSelectedBooking] = useState<SlotBooking | null>(null);
	const [showDetails, setShowDetails] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");

	// Fetch bookings
	const { data: bookingsData, isLoading } = useQuery({
		queryKey: ["partner-bookings", PARTNER_ID, format(weekStart, "yyyy-MM-dd")],
		queryFn: () =>
			slotBookingService.getPartnerBookings({
				partnerId: PARTNER_ID,
				startDate: format(weekStart, "yyyy-MM-dd"),
				endDate: format(addDays(weekStart, 6), "yyyy-MM-dd"),
			}),
	});

	const allBookings = bookingsData?.items ?? [];

	// Filter by category
	const bookings = useMemo(() => {
		if (categoryFilter === "all") return allBookings;
		return allBookings.filter((b) => b.service.serviceCategory === categoryFilter);
	}, [allBookings, categoryFilter]);

	// Group bookings by day
	const bookingsByDay = useMemo(() => {
		const grouped: Record<number, SlotBooking[]> = {};
		for (let i = 0; i < 7; i++) grouped[i] = [];

		bookings.forEach((booking) => {
			const bookingDate = new Date(booking.slot.date);
			for (let i = 0; i < 7; i++) {
				const dayDate = addDays(weekStart, i);
				if (isSameDay(bookingDate, dayDate)) {
					grouped[i].push(booking);
					break;
				}
			}
		});

		return grouped;
	}, [bookings, weekStart]);

	// Mutations
	const cancelMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			slotBookingService.cancelBooking(id, reason, "partner"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			toast.success("Booking cancelled");
			setShowCancelDialog(false);
			setShowDetails(false);
			setSelectedBooking(null);
		},
		onError: () => toast.error("Failed to cancel booking"),
	});

	const rescheduleMutation = useMutation({
		mutationFn: ({ id, newSlot }: { id: string; newSlot: { date: string; startTime: string; endTime: string } }) =>
			slotBookingService.rescheduleBooking(id, newSlot, "partner"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			toast.success("Booking rescheduled");
			setShowRescheduleDialog(false);
			setShowDetails(false);
			setSelectedBooking(null);
		},
		onError: () => toast.error("Failed to reschedule"),
	});

	const updateStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
			slotBookingService.updateBookingStatus(id, status),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			toast.success(`Service ${variables.status === "in_progress" ? "started" : "completed"}`);
			setShowDetails(false);
			setSelectedBooking(null);
		},
		onError: () => toast.error("Failed to update status"),
	});

	// Handlers
	const handleBookingClick = useCallback((booking: SlotBooking) => {
		setSelectedBooking(booking);
		setShowDetails(true);
	}, []);

	const handleStartService = useCallback(
		(booking: SlotBooking) => updateStatusMutation.mutate({ id: booking.id, status: "in_progress" }),
		[updateStatusMutation],
	);

	const handleCompleteService = useCallback(
		(booking: SlotBooking) => updateStatusMutation.mutate({ id: booking.id, status: "completed" }),
		[updateStatusMutation],
	);

	const handleCancelConfirm = useCallback(
		(reason: string) => {
			if (selectedBooking) cancelMutation.mutate({ id: selectedBooking.id, reason });
		},
		[selectedBooking, cancelMutation],
	);

	const handleRescheduleConfirm = useCallback(
		(date: string, startTime: string, endTime: string) => {
			if (selectedBooking) {
				rescheduleMutation.mutate({ id: selectedBooking.id, newSlot: { date, startTime, endTime } });
			}
		},
		[selectedBooking, rescheduleMutation],
	);

	// Render day content
	const renderDayContent = useCallback(
		(dayIndex: number) => {
			const dayBookings = bookingsByDay[dayIndex] ?? [];
			return (
				<>
					{dayBookings.map((booking) => (
						<BookingBlock
							key={booking.id}
							booking={booking}
							onClick={() => handleBookingClick(booking)}
							onStartService={() => handleStartService(booking)}
							onComplete={() => handleCompleteService(booking)}
						/>
					))}
				</>
			);
		},
		[bookingsByDay, handleBookingClick, handleStartService, handleCompleteService],
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-48" />
				<div className="grid gap-4 grid-cols-4">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
				<Skeleton className="h-[600px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Bookings</h1>
					<p className="text-muted-foreground">Manage your scheduled appointments</p>
				</div>
				<div className="flex items-center gap-2">
					<Filter className="h-4 w-4 text-muted-foreground" />
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-40 h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Services</SelectItem>
							<SelectItem value="wash">Car Wash</SelectItem>
							<SelectItem value="detailing">Detailing</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-4 text-sm">
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-blue-500" />
					<span className="text-muted-foreground">Wash</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-purple-500" />
					<span className="text-muted-foreground">Detailing</span>
				</div>
			</div>

			{/* Stats */}
			<WeekStats bookings={allBookings} />

			{/* Calendar */}
			<CalendarGrid
				ref={calendarRef}
				weekStart={weekStart}
				onWeekChange={setWeekStart}
				renderDayContent={renderDayContent}
				showCurrentTime
			/>

			{/* Dialogs */}
			<BookingDetailsDialog
				booking={selectedBooking}
				open={showDetails}
				onOpenChange={setShowDetails}
				onCancel={() => setShowCancelDialog(true)}
				onReschedule={() => setShowRescheduleDialog(true)}
				onStartService={() => selectedBooking && handleStartService(selectedBooking)}
				onComplete={() => selectedBooking && handleCompleteService(selectedBooking)}
			/>

			<CancelDialog
				open={showCancelDialog}
				onOpenChange={setShowCancelDialog}
				onConfirm={handleCancelConfirm}
				isLoading={cancelMutation.isPending}
			/>

			<RescheduleDialog
				booking={selectedBooking}
				open={showRescheduleDialog}
				onOpenChange={setShowRescheduleDialog}
				onConfirm={handleRescheduleConfirm}
				isLoading={rescheduleMutation.isPending}
			/>
		</div>
	);
}
