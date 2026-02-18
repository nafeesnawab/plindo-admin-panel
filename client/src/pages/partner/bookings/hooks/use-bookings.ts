import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfWeek } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import slotBookingService from "@/api/services/slotBookingService";
import type { BookingStatus, SlotBooking } from "@/types/booking";

import { CATEGORY_COLORS, PARTNER_ID, STATUS_COLORS } from "../types";

export function useBookings() {
	const queryClient = useQueryClient();
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

	const filteredBookings = useMemo(() => {
		if (categoryFilter === "all") return allBookings;
		return allBookings.filter((b) => b.service.serviceCategory === categoryFilter);
	}, [allBookings, categoryFilter]);

	// Map SlotBooking[] → CalendarEvent[] for IlamyCalendar
	const calendarEvents = useMemo(() => {
		return filteredBookings.map((b) => {
			const dateStr = b.slot.date;
			const [sh, sm] = b.slot.startTime.split(":").map(Number);
			const [eh, em] = b.slot.endTime.split(":").map(Number);
			const start = new Date(dateStr);
			start.setHours(sh, sm, 0, 0);
			const end = new Date(dateStr);
			end.setHours(eh, em, 0, 0);

			const cat = b.service.serviceCategory;
			const statusColor = STATUS_COLORS[b.status];

			return {
				id: b.id,
				title: `${b.service.name}`,
				description: `${b.customer.name} • ${b.vehicle.make} ${b.vehicle.model}`,
				start,
				end,
				backgroundColor: statusColor?.bg ?? CATEGORY_COLORS[cat]?.bg ?? "#6b7280",
				color: statusColor?.text ?? CATEGORY_COLORS[cat]?.text ?? "#ffffff",
				data: { booking: b },
			};
		});
	}, [filteredBookings]);

	// Lookup map for finding original booking from event id
	const bookingsMap = useMemo(() => {
		const map = new Map<string, SlotBooking>();
		allBookings.forEach((b) => map.set(b.id, b));
		return map;
	}, [allBookings]);

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
	const handleEventClick = useCallback(
		(event: { id: string | number }) => {
			const booking = bookingsMap.get(String(event.id));
			if (booking) {
				setSelectedBooking(booking);
				setShowDetails(true);
			}
		},
		[bookingsMap],
	);

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

	return {
		weekStart,
		setWeekStart,
		selectedBooking,
		showDetails,
		setShowDetails,
		showCancelDialog,
		setShowCancelDialog,
		showRescheduleDialog,
		setShowRescheduleDialog,
		categoryFilter,
		setCategoryFilter,
		allBookings,
		calendarEvents,
		isLoading,
		cancelMutation,
		rescheduleMutation,
		handleEventClick,
		handleStartService,
		handleCompleteService,
		handleCancelConfirm,
		handleRescheduleConfirm,
	};
}
