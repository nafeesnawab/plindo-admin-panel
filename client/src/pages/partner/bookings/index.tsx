import { IlamyCalendar } from "@ilamy/calendar";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Filter, PoundSterling } from "lucide-react";
import { useMemo } from "react";
import type { SlotBooking } from "@/types/booking";
import { Button } from "@/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";

import { BookingDetailsDialog } from "./components/booking-details-dialog";
import { CancelDialog } from "./components/cancel-dialog";
import { RescheduleDialog } from "./components/reschedule-dialog";
import { useBookings } from "./hooks/use-bookings";
import { STATUS_COLORS } from "./types";

const LEGEND_ITEMS: { key: string; label: string }[] = [
	{ key: "booked", label: "Upcoming" },
	{ key: "in_progress", label: "In Service" },
	{ key: "completed", label: "Completed" },
	{ key: "cancelled", label: "Cancelled" },
	{ key: "rescheduled", label: "Rescheduled" },
];

const VIEW_OPTIONS = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
	{ value: "year", label: "Year" },
] as const;

export default function PartnerBookingsPage() {
	const {
		// State
		selectedBooking,
		showDetails,
		setShowDetails,
		showCancelDialog,
		setShowCancelDialog,
		showRescheduleDialog,
		setShowRescheduleDialog,
		categoryFilter,
		setCategoryFilter,
		// Navigation
		currentView,
		currentDate,
		calendarKey,
		goNext,
		goPrev,
		goToday,
		setView,
		dateRange,
		// Data
		allBookings,
		calendarEvents,
		isLoading,
		// Mutations
		cancelMutation,
		rescheduleMutation,
		// Handlers
		handleEventClick,
		handleEventAdd,
		handleStartService,
		handleCompleteService,
		handleCancelConfirm,
		handleRescheduleConfirm,
	} = useBookings();

	// Format the current date range for display
	const dateRangeLabel = useMemo(() => {
		const start = new Date(dateRange.startDate);
		const end = new Date(dateRange.endDate);
		if (currentView === "day") {
			return format(start, "EEEE, MMMM d, yyyy");
		}
		if (currentView === "week") {
			return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
		}
		if (currentView === "month") {
			return format(start, "MMMM yyyy");
		}
		return format(start, "yyyy");
	}, [dateRange, currentView]);

	// Counts per status + revenue
	const stats = useMemo(() => {
		const counts: Record<string, number> = {};
		let revenue = 0;
		for (const b of allBookings) {
			counts[b.status] = (counts[b.status] || 0) + 1;
			if (b.status === "completed" || b.status === "in_progress") {
				revenue += b.pricing.finalPrice;
			}
		}
		const total = allBookings.filter(
			(b: SlotBooking) => b.status !== "cancelled",
		).length;
		return { counts, total, revenue };
	}, [allBookings]);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-12 w-full rounded-lg" />
				<Skeleton className="h-[calc(100vh-200px)] rounded-lg" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 h-full">
			{/* Legend + Stats bar */}
			<div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
				<div className="flex items-center gap-1">
					{/* Total count */}
					<div className="flex items-center gap-1.5 pr-3 mr-3 border-r border-border">
						<span className="text-xl font-bold text-foreground">
							{stats.total}
						</span>
						<span className="text-xs text-muted-foreground">bookings</span>
					</div>

					{/* Status legend with counts */}
					<div className="flex items-center gap-3">
						{LEGEND_ITEMS.map(({ key, label }) => {
							const count = stats.counts[key] || 0;
							const color = STATUS_COLORS[key]?.bg ?? "#6b7280";
							return (
								<div key={key} className="flex items-center gap-1.5">
									<span
										className="h-2.5 w-2.5 rounded-full shrink-0"
										style={{ backgroundColor: color }}
									/>
									<span className="text-xs text-muted-foreground">{label}</span>
									{count > 0 && (
										<span className="text-xs font-semibold text-foreground">
											{count}
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<div className="flex items-center gap-3">
					{/* Revenue */}
					{stats.revenue > 0 && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground pr-3 mr-1 border-r border-border">
							<PoundSterling className="h-3 w-3" />
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">
								{stats.revenue.toFixed(0)}
							</span>
							<span>earned</span>
						</div>
					)}

					{/* Category filter */}
					<div className="flex items-center gap-1.5">
						<Filter className="h-3.5 w-3.5 text-muted-foreground" />
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="w-32 h-7 text-xs border-dashed">
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
			</div>

			{/* Navigation Controls */}
			<div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={goPrev}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="outline" size="sm" onClick={goToday}>
						Today
					</Button>
					<Button variant="outline" size="sm" onClick={goNext}>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<span className="ml-2 text-sm font-medium">{dateRangeLabel}</span>
				</div>
				<div className="flex items-center gap-2">
					{VIEW_OPTIONS.map((option) => (
						<Button
							key={option.value}
							variant={currentView === option.value ? "default" : "outline"}
							size="sm"
							onClick={() => setView(option.value)}
						>
							{option.label}
						</Button>
					))}
				</div>
			</div>

			{/* IlamyCalendar - hide built-in header since we have custom navigation */}
			<div className="flex-1 min-h-0 [&_.ilamy-calendar]:h-full">
				<IlamyCalendar
					key={calendarKey}
					events={calendarEvents}
					initialView={currentView}
					initialDate={currentDate}
					firstDayOfWeek="monday"
					timeFormat="24-hour"
					headerClassName="hidden"
					onEventClick={handleEventClick}
					onEventAdd={handleEventAdd}
					disableDragAndDrop
					disableCellClick
					businessHours={{
						daysOfWeek: [
							"monday",
							"tuesday",
							"wednesday",
							"thursday",
							"friday",
							"saturday",
							"sunday",
						],
						startTime: 7,
						endTime: 22,
					}}
				/>
			</div>

			{/* Dialogs */}
			<BookingDetailsDialog
				booking={selectedBooking}
				open={showDetails}
				onOpenChange={setShowDetails}
				onCancel={() => setShowCancelDialog(true)}
				onReschedule={() => setShowRescheduleDialog(true)}
				onStartService={() =>
					selectedBooking && handleStartService(selectedBooking)
				}
				onComplete={() =>
					selectedBooking && handleCompleteService(selectedBooking)
				}
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
