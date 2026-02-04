import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Calendar, Car, CheckCircle2, Clock, MapPin, Phone, User, XCircle } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
import type { BookingStatus, SlotBooking } from "@/types/booking";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

const PARTNER_ID = "demo-partner-1";

// Status configuration for visual styling
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

// Booking block component rendered inside day columns
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

	const slotDate = new Date(booking.slot.date);
	const isPast = isSlotInPast(slotDate, booking.slot.endTime);
	const isActive = isSlotActive(slotDate, booking.slot.startTime, booking.slot.endTime);
	const canStart = booking.status === "booked" && !isPast && !isActive;
	const canComplete = booking.status === "in_progress";

	return (
		<div
			className={cn(
				"absolute left-1 right-1 rounded-md border-l-4 overflow-hidden cursor-pointer transition-all hover:shadow-md",
				config.bgColor,
				config.borderColor,
				isPast && booking.status !== "completed" && booking.status !== "cancelled" && "opacity-60",
				isActive && "ring-2 ring-primary ring-offset-1",
			)}
			style={{
				top: topPosition,
				height: Math.max(height - 2, SLOT_HEIGHT - 2),
			}}
		>
			<button
				type="button"
				className="w-full h-full p-1.5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
				onClick={onClick}
			>
				<div className="flex flex-col h-full overflow-hidden">
					<p className={cn("text-xs font-semibold truncate", config.color)}>
						{formatTimeDisplay(booking.slot.startTime)}
					</p>
					<p className="text-xs font-medium truncate">{booking.customer.name}</p>
					{height > 50 && <p className="text-xs text-muted-foreground truncate">{booking.service.name}</p>}
					{height > 70 && (
						<Badge variant="outline" className={cn("mt-auto text-[10px] h-5 w-fit", config.color)}>
							{config.label}
						</Badge>
					)}
				</div>
			</button>

			{/* Quick action buttons */}
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

// Booking details dialog
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>Booking Details</DialogTitle>
						<Badge className={cn(config.bgColor, config.color, "border", config.borderColor)}>{config.label}</Badge>
					</div>
					<DialogDescription>
						{format(slotDate, "EEEE, MMMM d, yyyy")} • {formatTimeDisplay(booking.slot.startTime)} -{" "}
						{formatTimeDisplay(booking.slot.endTime)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Customer Info */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<User className="h-4 w-4" />
								Customer
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10">
									<AvatarFallback>
										{booking.customer.name
											.split(" ")
											.map((n) => n[0])
											.join("")}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-medium">{booking.customer.name}</p>
									<p className="text-sm text-muted-foreground">{booking.customer.email}</p>
								</div>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Phone className="h-3 w-3" />
								{booking.customer.phone}
							</div>
						</CardContent>
					</Card>

					{/* Vehicle Info */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Car className="h-4 w-4" />
								Vehicle
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-medium">
								{booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
							</p>
							<p className="text-sm text-muted-foreground">
								{booking.vehicle.color} • {booking.vehicle.plateNumber}
							</p>
							<Badge variant="outline" className="mt-1">
								{booking.vehicle.type}
							</Badge>
						</CardContent>
					</Card>

					{/* Service Info */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4" />
								Service
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-medium">{booking.service.name}</p>
							<p className="text-sm text-muted-foreground">{booking.service.description}</p>
							<div className="flex items-center justify-between mt-2">
								<span className="text-sm text-muted-foreground">Duration: {booking.service.duration} min</span>
								<span className="font-semibold">${booking.pricing.finalPrice.toFixed(2)}</span>
							</div>
						</CardContent>
					</Card>

					{/* Location */}
					{booking.partner.address && (
						<div className="flex items-start gap-2 text-sm">
							<MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
							<span>{booking.partner.address}</span>
						</div>
					)}
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					{canStart && (
						<Button onClick={onStartService} className="bg-purple-600 hover:bg-purple-700">
							<Clock className="mr-2 h-4 w-4" />
							Start Service
						</Button>
					)}
					{canComplete && (
						<Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Complete Service
						</Button>
					)}
					{canModify && (
						<>
							<Button variant="outline" onClick={onReschedule}>
								<Calendar className="mr-2 h-4 w-4" />
								Reschedule
							</Button>
							<Button variant="destructive" onClick={onCancel}>
								<XCircle className="mr-2 h-4 w-4" />
								Cancel
							</Button>
						</>
					)}
					{!canStart && !canComplete && !canModify && (
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Cancel dialog
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
					<DialogDescription>
						Are you sure you want to cancel this booking? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="cancel-reason">Reason for cancellation</Label>
					<Textarea
						id="cancel-reason"
						placeholder="Please provide a reason..."
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

// Reschedule dialog with available slots selection
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
	const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);

	// Fetch available slots for selected date
	const { data: slotsData, isLoading: slotsLoading } = useQuery({
		queryKey: ["available-slots", PARTNER_ID, newDate],
		queryFn: () => slotBookingService.getAvailableSlots(PARTNER_ID, newDate),
		enabled: !!newDate && open,
	});

	const availableSlots = useMemo(() => {
		if (!slotsData?.slots) return [];
		// Filter only available slots and calculate end time based on service duration
		const serviceDuration = booking?.service.duration || 60;
		return slotsData.slots
			.filter((slot) => slot.isAvailable)
			.map((slot) => {
				const startMinutes = timeToMinutes(slot.startTime);
				const endMinutes = startMinutes + serviceDuration;
				const endHours = Math.floor(endMinutes / 60);
				const endMins = endMinutes % 60;
				const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
				return { startTime: slot.startTime, endTime };
			});
	}, [slotsData, booking?.service.duration]);

	// Reset selected slot when date changes
	const handleDateChange = (date: string) => {
		setNewDate(date);
		setSelectedSlot(null);
	};

	if (!booking) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Reschedule Booking</DialogTitle>
					<DialogDescription>Select a new date and available time slot for this booking.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					{/* Current booking info */}
					<div className="p-3 bg-muted rounded-lg text-sm">
						<p className="font-medium">Current: {format(new Date(booking.slot.date), "EEE, MMM d")}</p>
						<p className="text-muted-foreground">
							{formatTimeDisplay(booking.slot.startTime)} - {formatTimeDisplay(booking.slot.endTime)}
						</p>
					</div>

					{/* Date selection */}
					<div className="space-y-2">
						<Label htmlFor="new-date">New Date</Label>
						<Input
							id="new-date"
							type="date"
							value={newDate}
							onChange={(e) => handleDateChange(e.target.value)}
							min={format(new Date(), "yyyy-MM-dd")}
						/>
					</div>

					{/* Available slots */}
					{newDate && (
						<div className="space-y-2">
							<Label>Available Time Slots</Label>
							{slotsLoading ? (
								<div className="grid grid-cols-3 gap-2">
									{[1, 2, 3, 4, 5, 6].map((i) => (
										<Skeleton key={i} className="h-10" />
									))}
								</div>
							) : availableSlots.length > 0 ? (
								<div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
									{availableSlots.map((slot: { startTime: string; endTime: string }) => (
										<Button
											key={slot.startTime}
											type="button"
											variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
											size="sm"
											className="text-xs"
											onClick={() => setSelectedSlot(slot)}
										>
											{formatTimeDisplay(slot.startTime)}
										</Button>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
									No available slots for this date
								</p>
							)}
						</div>
					)}

					{/* Selected slot preview */}
					{selectedSlot && (
						<div className="p-3 bg-primary/10 rounded-lg text-sm border border-primary/20">
							<p className="font-medium text-primary">New Time:</p>
							<p>
								{formatTimeDisplay(selectedSlot.startTime)} - {formatTimeDisplay(selectedSlot.endTime)}
							</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={() => selectedSlot && onConfirm(newDate, selectedSlot.startTime, selectedSlot.endTime)}
						disabled={isLoading || !newDate || !selectedSlot}
					>
						{isLoading ? "Rescheduling..." : "Confirm Reschedule"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Stats cards component
function WeekStats({ bookings }: { bookings: SlotBooking[] }) {
	const stats = useMemo(() => {
		const upcoming = bookings.filter((b) => b.status === "booked").length;
		const inProgress = bookings.filter((b) => b.status === "in_progress").length;
		const completed = bookings.filter((b) => b.status === "completed").length;
		const revenue = bookings
			.filter((b) => b.status === "completed" || b.status === "in_progress")
			.reduce((sum, b) => sum + b.pricing.finalPrice, 0);
		return { upcoming, inProgress, completed, revenue };
	}, [bookings]);

	return (
		<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-blue-100">
							<Calendar className="h-5 w-5 text-blue-600" />
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
						<div className="p-2 rounded-lg bg-purple-100">
							<Clock className="h-5 w-5 text-purple-600" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.inProgress}</p>
							<p className="text-xs text-muted-foreground">In Progress</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-green-100">
							<CheckCircle2 className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.completed}</p>
							<p className="text-xs text-muted-foreground">Completed</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-emerald-100">
							<span className="text-emerald-600 font-bold text-lg">$</span>
						</div>
						<div>
							<p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p>
							<p className="text-xs text-muted-foreground">Week Revenue</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function PartnerBookingsPage() {
	const queryClient = useQueryClient();
	const calendarRef = useRef<CalendarGridRef>(null);
	const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
	const [selectedBooking, setSelectedBooking] = useState<SlotBooking | null>(null);
	const [showDetails, setShowDetails] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

	// Fetch bookings for the week
	const { data: bookingsData, isLoading } = useQuery({
		queryKey: ["partner-bookings", PARTNER_ID, format(weekStart, "yyyy-MM-dd")],
		queryFn: () =>
			slotBookingService.getPartnerBookings({
				partnerId: PARTNER_ID,
				startDate: format(weekStart, "yyyy-MM-dd"),
				endDate: format(addDays(weekStart, 6), "yyyy-MM-dd"),
			}),
	});

	const bookings = bookingsData?.items ?? [];

	// Group bookings by day index
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
			toast.success("Booking cancelled successfully");
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
			toast.success("Booking rescheduled successfully");
			setShowRescheduleDialog(false);
			setShowDetails(false);
			setSelectedBooking(null);
		},
		onError: () => toast.error("Failed to reschedule booking"),
	});

	const updateStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
			slotBookingService.updateBookingStatus(id, status),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			const statusLabel = variables.status === "in_progress" ? "started" : "completed";
			toast.success(`Service ${statusLabel} successfully`);
			setShowDetails(false);
			setSelectedBooking(null);
		},
		onError: () => toast.error("Failed to update booking status"),
	});

	// Handlers
	const handleBookingClick = useCallback((booking: SlotBooking) => {
		setSelectedBooking(booking);
		setShowDetails(true);
	}, []);

	const handleStartService = useCallback(
		(booking: SlotBooking) => {
			updateStatusMutation.mutate({ id: booking.id, status: "in_progress" });
		},
		[updateStatusMutation],
	);

	const handleCompleteService = useCallback(
		(booking: SlotBooking) => {
			updateStatusMutation.mutate({ id: booking.id, status: "completed" });
		},
		[updateStatusMutation],
	);

	const handleCancelConfirm = useCallback(
		(reason: string) => {
			if (selectedBooking) {
				cancelMutation.mutate({ id: selectedBooking.id, reason });
			}
		},
		[selectedBooking, cancelMutation],
	);

	const handleRescheduleConfirm = useCallback(
		(date: string, startTime: string, endTime: string) => {
			if (selectedBooking) {
				rescheduleMutation.mutate({
					id: selectedBooking.id,
					newSlot: { date, startTime, endTime },
				});
			}
		},
		[selectedBooking, rescheduleMutation],
	);

	// Render bookings for a specific day
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
			<div>
				<h1 className="text-2xl font-bold">Bookings Schedule</h1>
				<p className="text-muted-foreground">View and manage all your scheduled appointments</p>
			</div>

			{/* Stats */}
			<WeekStats bookings={bookings} />

			{/* Calendar Grid */}
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
