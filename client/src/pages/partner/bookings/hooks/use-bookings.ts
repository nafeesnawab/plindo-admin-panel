import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from "date-fns";
import type { Dayjs } from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import apiClient from "@/api/apiClient";
import slotBookingService from "@/api/services/slotBookingService";
import { usePartnerInfo } from "@/store/authStore";
import type { BookingStatus, SlotBooking } from "@/types/booking";

import { CATEGORY_COLORS, STATUS_COLORS } from "../types";

type CalendarView = "day" | "week" | "month" | "year";

interface CalendarEventPayload {
	title: string;
	description?: string;
	start: string;
	end: string;
	color?: string;
	backgroundColor?: string;
}

export function useBookings() {
	const queryClient = useQueryClient();
	const partnerInfo = usePartnerInfo();
	const partnerId = partnerInfo.id ?? "";
	const [currentView, setCurrentView] = useState<CalendarView>("week");
	const [currentDate, setCurrentDate] = useState<Date>(new Date());
	const [selectedBooking, setSelectedBooking] = useState<SlotBooking | null>(
		null,
	);
	const [showDetails, setShowDetails] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");

	// Calculate date range based on current view and date
	const dateRange = useMemo(() => {
		const date = currentDate;
		let start: Date;
		let end: Date;

		switch (currentView) {
			case "day":
				start = startOfDay(date);
				end = startOfDay(date);
				break;
			case "week":
				start = startOfWeek(date, { weekStartsOn: 1 });
				end = endOfWeek(date, { weekStartsOn: 1 });
				break;
			case "month":
				start = startOfMonth(date);
				end = endOfMonth(date);
				break;
			case "year":
				start = startOfYear(date);
				end = endOfYear(date);
				break;
			default:
				start = startOfWeek(date, { weekStartsOn: 1 });
				end = endOfWeek(date, { weekStartsOn: 1 });
		}

		return {
			startDate: format(start, "yyyy-MM-dd"),
			endDate: format(end, "yyyy-MM-dd"),
		};
	}, [currentView, currentDate]);

	// Fetch bookings
	const { data: bookingsData, isLoading } = useQuery({
		queryKey: ["partner-bookings", partnerId, dateRange.startDate, dateRange.endDate],
		queryFn: () =>
			slotBookingService.getPartnerBookings({
				partnerId: partnerId,
				startDate: dateRange.startDate,
				endDate: dateRange.endDate,
			}),
		enabled: !!partnerId,
	});

	const allBookings = bookingsData?.items ?? [];

	const filteredBookings = useMemo(() => {
		if (categoryFilter === "all") return allBookings;
		return allBookings.filter(
			(b) => b.service.serviceCategory === categoryFilter,
		);
	}, [allBookings, categoryFilter]);

	// Fetch persisted partner calendar events
	const { data: savedEventsData } = useQuery({
		queryKey: ["partner-calendar-events", partnerId],
		queryFn: () =>
			apiClient.get<{
				events: Array<{
					id: string;
					title: string;
					description: string;
					start: string;
					end: string;
					color: string;
					backgroundColor: string;
				}>;
			}>({
				url: "/partner/calendar-events",
			}),
		enabled: !!partnerId,
	});

	// Map SlotBooking[] → CalendarEvent[] for IlamyCalendar
	const calendarEvents = useMemo(() => {
		const bookingEvents = filteredBookings.map((b) => {
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
				backgroundColor:
					statusColor?.bg ?? CATEGORY_COLORS[cat]?.bg ?? "#6b7280",
				color: statusColor?.text ?? CATEGORY_COLORS[cat]?.text ?? "#ffffff",
				data: { booking: b },
			};
		});

		const customEvents = (savedEventsData?.events ?? []).map((e) => ({
			id: e.id,
			title: e.title,
			description: e.description,
			start: new Date(e.start),
			end: new Date(e.end),
			backgroundColor: e.backgroundColor ?? e.color ?? "#6b7280",
			color: e.color ?? "#ffffff",
			data: {},
		}));

		return [...bookingEvents, ...customEvents];
	}, [filteredBookings, savedEventsData]);

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
		mutationFn: ({
			id,
			newSlot,
		}: {
			id: string;
			newSlot: { date: string; startTime: string; endTime: string };
		}) => slotBookingService.rescheduleBooking(id, newSlot, "partner"),
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
			toast.success(
				`Service ${variables.status === "in_progress" ? "started" : "completed"}`,
			);
			setShowDetails(false);
			setSelectedBooking(null);
		},
		onError: () => toast.error("Failed to update status"),
	});

	const handleEventAdd = useCallback(
		async (event: {
			title: string;
			start: Date;
			end: Date;
			backgroundColor?: string;
			color?: string;
			description?: string;
		}) => {
			try {
				const payload: CalendarEventPayload = {
					title: event.title,
					description: event.description ?? "",
					start: event.start.toISOString(),
					end: event.end.toISOString(),
					color: event.color ?? event.backgroundColor ?? "#6b7280",
					backgroundColor: event.backgroundColor ?? "#6b7280",
				};
				await apiClient.post({
					url: "/partner/calendar-events",
					data: payload,
				});
				queryClient.invalidateQueries({
					queryKey: ["partner-calendar-events"],
				});
			} catch {
				// silently ignore — calendar already shows the event optimistically
			}
		},
		[queryClient],
	);

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
		(booking: SlotBooking) =>
			updateStatusMutation.mutate({ id: booking.id, status: "in_progress" }),
		[updateStatusMutation],
	);

	const handleCompleteService = useCallback(
		(booking: SlotBooking) =>
			updateStatusMutation.mutate({ id: booking.id, status: "completed" }),
		[updateStatusMutation],
	);

	const handleCancelConfirm = useCallback(
		(reason: string) => {
			if (selectedBooking)
				cancelMutation.mutate({ id: selectedBooking.id, reason });
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

	// Calendar view change handler
	const handleViewChange = useCallback((view: string) => {
		setCurrentView(view as CalendarView);
	}, []);

	// Calendar date navigation handler
	const handleDateChange = useCallback((date: Dayjs) => {
		setCurrentDate(date.toDate());
	}, []);

	return {
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
		handleEventAdd,
		handleStartService,
		handleCompleteService,
		handleCancelConfirm,
		handleRescheduleConfirm,
		handleViewChange,
		handleDateChange,
	};
}
