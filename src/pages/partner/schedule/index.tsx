import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfWeek } from "date-fns";
import { Check, Clock, Info, Loader2, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import slotBookingService from "@/api/services/slotBookingService";
import {
	CalendarGrid,
	type CalendarGridRef,
	DAYS_SHORT,
	formatTimeDisplay,
	minutesToTime,
	pixelsToTime,
	SLOT_DURATION_MINUTES,
	SLOT_HEIGHT,
	snapToSlot,
	TOTAL_HEIGHT,
	timeToMinutes,
	timeToPixels,
} from "@/components/calendar/CalendarGrid";
import type { DayAvailability, TimeSlot, WeeklyAvailability } from "@/types/booking";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

const PARTNER_ID = "demo-partner-1";

// Availability block that can be rendered and dragged
interface AvailabilityBlock {
	id: string;
	dayIndex: number;
	startTime: string;
	endTime: string;
}

// Convert slot sets back to continuous blocks
function slotsToBlocks(slots: Record<number, Set<string>>): AvailabilityBlock[] {
	const blocks: AvailabilityBlock[] = [];

	Object.entries(slots).forEach(([dayIndexStr, timeSet]) => {
		const dayIndex = parseInt(dayIndexStr);
		const sortedTimes = Array.from(timeSet).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

		let blockStart: string | null = null;
		let prevEndMinutes = -1;

		sortedTimes.forEach((time) => {
			const startMinutes = timeToMinutes(time);

			if (blockStart === null || startMinutes !== prevEndMinutes) {
				// Start new block
				if (blockStart !== null) {
					blocks.push({
						id: `${dayIndex}-${blockStart}`,
						dayIndex,
						startTime: blockStart,
						endTime: minutesToTime(prevEndMinutes),
					});
				}
				blockStart = time;
			}
			prevEndMinutes = startMinutes + SLOT_DURATION_MINUTES;
		});

		// Close final block
		if (blockStart !== null) {
			blocks.push({
				id: `${dayIndex}-${blockStart}`,
				dayIndex,
				startTime: blockStart,
				endTime: minutesToTime(prevEndMinutes),
			});
		}
	});

	return blocks;
}

// Rendered availability block component
function AvailabilityBlockComponent({ block, onDelete }: { block: AvailabilityBlock; onDelete: () => void }) {
	const top = timeToPixels(block.startTime);
	const height = timeToPixels(block.endTime) - top;

	return (
		<div
			className="absolute left-1 right-1 bg-primary/20 border-2 border-primary rounded-md overflow-hidden group"
			style={{ top, height: Math.max(height, SLOT_HEIGHT) }}
		>
			<div className="h-full flex flex-col justify-between p-1">
				<div className="flex items-center justify-between">
					<span className="text-xs font-medium text-primary truncate">{formatTimeDisplay(block.startTime)}</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 transition-opacity"
					>
						<Trash2 className="h-3 w-3 text-destructive" />
					</button>
				</div>
				{height > 40 && (
					<span className="text-xs font-medium text-primary truncate">{formatTimeDisplay(block.endTime)}</span>
				)}
			</div>
			{/* Resize handles */}
			<div className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-primary/30" />
			<div className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-primary/30" />
		</div>
	);
}

// Drag preview component shown while selecting
function DragPreview({ startY, currentY }: { startY: number; currentY: number }) {
	const top = Math.min(startY, currentY);
	const height = Math.abs(currentY - startY);
	const snappedTop = snapToSlot(top);
	const snappedHeight = Math.max(snapToSlot(height), SLOT_HEIGHT);

	const startTime = pixelsToTime(snappedTop);
	const endTime = pixelsToTime(snappedTop + snappedHeight);

	return (
		<div
			className="absolute left-1 right-1 bg-primary/40 border-2 border-dashed border-primary rounded-md pointer-events-none"
			style={{ top: snappedTop, height: snappedHeight }}
		>
			<div className="p-1">
				<span className="text-xs font-medium text-primary">
					{formatTimeDisplay(startTime)} - {formatTimeDisplay(endTime)}
				</span>
			</div>
		</div>
	);
}

// Stats component
function AvailabilityStats({ blocks }: { blocks: AvailabilityBlock[] }) {
	const stats = useMemo(() => {
		let totalMinutes = 0;
		const daysWithAvailability = new Set<number>();

		blocks.forEach((block) => {
			const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
			totalMinutes += duration;
			daysWithAvailability.add(block.dayIndex);
		});

		return {
			totalHours: Math.round(totalMinutes / 60),
			daysActive: daysWithAvailability.size,
			blocksCount: blocks.length,
		};
	}, [blocks]);

	return (
		<div className="grid gap-4 grid-cols-3">
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-primary/10">
							<Clock className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.totalHours}h</p>
							<p className="text-xs text-muted-foreground">Weekly hours</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-green-100">
							<Check className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.daysActive}</p>
							<p className="text-xs text-muted-foreground">Days active</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-blue-100">
							<span className="text-blue-600 font-bold">#</span>
						</div>
						<div>
							<p className="text-2xl font-bold">{stats.blocksCount}</p>
							<p className="text-xs text-muted-foreground">Time blocks</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function PartnerSchedulePage() {
	const queryClient = useQueryClient();
	const calendarRef = useRef<CalendarGridRef>(null);
	const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
	const [hasChanges, setHasChanges] = useState(false);

	// Availability state - stored as slot sets for easy manipulation
	const [availableSlots, setAvailableSlots] = useState<Record<number, Set<string>>>(() => {
		const result: Record<number, Set<string>> = {};
		for (let i = 0; i < 7; i++) result[i] = new Set();
		return result;
	});

	// Drag state
	const [isDragging, setIsDragging] = useState(false);
	const [dragDay, setDragDay] = useState<number | null>(null);
	const [dragStartY, setDragStartY] = useState(0);
	const [dragCurrentY, setDragCurrentY] = useState(0);
	const [dragMode, setDragMode] = useState<"add" | "remove">("add");

	// Convert to blocks for rendering
	const availabilityBlocks = useMemo(() => slotsToBlocks(availableSlots), [availableSlots]);

	// Fetch existing availability
	const { data: existingAvailability, isLoading } = useQuery({
		queryKey: ["partner-availability", PARTNER_ID],
		queryFn: () => slotBookingService.getWeeklyAvailability(PARTNER_ID),
	});

	// Load existing availability
	useEffect(() => {
		if (existingAvailability?.schedule) {
			const newSlots: Record<number, Set<string>> = {};
			for (let i = 0; i < 7; i++) newSlots[i] = new Set();

			existingAvailability.schedule.forEach((day) => {
				day.slots?.forEach((slot) => {
					if (slot.isAvailable) {
						newSlots[day.dayOfWeek].add(slot.startTime);
					}
				});
			});

			setAvailableSlots(newSlots);
		}
	}, [existingAvailability]);

	// Save mutation
	const saveMutation = useMutation({
		mutationFn: (data: Partial<WeeklyAvailability>) => slotBookingService.updateWeeklyAvailability(data, PARTNER_ID),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-availability"] });
			toast.success("Availability saved successfully");
			setHasChanges(false);
		},
		onError: () => toast.error("Failed to save availability"),
	});

	// Get Y position relative to calendar column
	const getRelativeY = useCallback((e: React.MouseEvent, columnElement: HTMLElement) => {
		const rect = columnElement.getBoundingClientRect();
		return Math.max(0, Math.min(e.clientY - rect.top, TOTAL_HEIGHT));
	}, []);

	// Mouse handlers for drag selection
	const handleDayMouseDown = useCallback(
		(e: React.MouseEvent, dayIndex: number) => {
			const target = e.currentTarget as HTMLElement;
			const y = getRelativeY(e, target);
			// Use floor to get the slot the user is clicking ON (not rounded)
			const slotY = Math.floor(y / SLOT_HEIGHT) * SLOT_HEIGHT;
			const time = pixelsToTime(slotY);

			// Check if clicking on existing availability
			const isOnExisting = availableSlots[dayIndex].has(time);

			setIsDragging(true);
			setDragDay(dayIndex);
			setDragStartY(slotY); // Use the floored slot position
			setDragCurrentY(slotY);
			setDragMode(isOnExisting ? "remove" : "add");
		},
		[availableSlots, getRelativeY],
	);

	const handleDayMouseMove = useCallback(
		(e: React.MouseEvent, dayIndex: number) => {
			if (!isDragging || dragDay !== dayIndex) return;
			const target = e.currentTarget as HTMLElement;
			const y = getRelativeY(e, target);
			// Use floor for consistent slot-based positioning during drag
			const slotY = Math.floor(y / SLOT_HEIGHT) * SLOT_HEIGHT;
			setDragCurrentY(slotY);
		},
		[isDragging, dragDay, getRelativeY],
	);

	const handleDayMouseUp = useCallback(
		(_e: React.MouseEvent, dayIndex: number) => {
			if (!isDragging || dragDay !== dayIndex) return;

			const startY = snapToSlot(Math.min(dragStartY, dragCurrentY));
			const endY = snapToSlot(Math.max(dragStartY, dragCurrentY)) + SLOT_HEIGHT;

			const startTime = pixelsToTime(startY);
			const endTime = pixelsToTime(endY);
			const startMinutes = timeToMinutes(startTime);
			const endMinutes = timeToMinutes(endTime);

			setAvailableSlots((prev) => {
				const newSlots = { ...prev };
				newSlots[dayIndex] = new Set(prev[dayIndex]);

				for (let m = startMinutes; m < endMinutes; m += SLOT_DURATION_MINUTES) {
					const timeStr = minutesToTime(m);
					if (dragMode === "add") {
						newSlots[dayIndex].add(timeStr);
					} else {
						newSlots[dayIndex].delete(timeStr);
					}
				}

				return newSlots;
			});

			setHasChanges(true);
			setIsDragging(false);
			setDragDay(null);
		},
		[isDragging, dragDay, dragStartY, dragCurrentY, dragMode],
	);

	const handleDayMouseLeave = useCallback(
		(_e: React.MouseEvent, _dayIndex: number) => {
			if (isDragging) {
				setIsDragging(false);
				setDragDay(null);
			}
		},
		[isDragging],
	);

	// Delete a block
	const handleDeleteBlock = useCallback((block: AvailabilityBlock) => {
		const startMinutes = timeToMinutes(block.startTime);
		const endMinutes = timeToMinutes(block.endTime);

		setAvailableSlots((prev) => {
			const newSlots = { ...prev };
			newSlots[block.dayIndex] = new Set(prev[block.dayIndex]);

			for (let m = startMinutes; m < endMinutes; m += SLOT_DURATION_MINUTES) {
				newSlots[block.dayIndex].delete(minutesToTime(m));
			}

			return newSlots;
		});
		setHasChanges(true);
	}, []);

	// Clear all availability
	const handleClearAll = useCallback(() => {
		const newSlots: Record<number, Set<string>> = {};
		for (let i = 0; i < 7; i++) newSlots[i] = new Set();
		setAvailableSlots(newSlots);
		setHasChanges(true);
		toast.success("All availability cleared");
	}, []);

	// Copy day to all other days
	const handleCopyToAll = useCallback(
		(sourceDayIndex: number) => {
			const sourceSlots = availableSlots[sourceDayIndex];
			setAvailableSlots(() => {
				const newSlots: Record<number, Set<string>> = {};
				for (let i = 0; i < 7; i++) {
					newSlots[i] = new Set(sourceSlots);
				}
				return newSlots;
			});
			setHasChanges(true);
			toast.success(`Copied ${DAYS_SHORT[sourceDayIndex]}'s schedule to all days`);
		},
		[availableSlots],
	);

	// Save availability
	const handleSave = useCallback(() => {
		const schedule: DayAvailability[] = [];

		for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
			const slots: TimeSlot[] = [];
			const daySlots = availableSlots[dayIndex];

			// Generate all possible slots and mark availability
			for (let hour = 0; hour < 24; hour++) {
				for (let slot = 0; slot < 60 / SLOT_DURATION_MINUTES; slot++) {
					const minutes = hour * 60 + slot * SLOT_DURATION_MINUTES;
					const startTime = minutesToTime(minutes);
					const endTime = minutesToTime(minutes + SLOT_DURATION_MINUTES);
					slots.push({
						id: `${dayIndex}-${startTime}`,
						startTime,
						endTime,
						isAvailable: daySlots.has(startTime),
					});
				}
			}

			schedule.push({
				dayOfWeek: dayIndex,
				dayName: DAYS_SHORT[dayIndex],
				isEnabled: daySlots.size > 0,
				slots,
			});
		}

		saveMutation.mutate({
			partnerId: PARTNER_ID,
			schedule,
			slotDurationMinutes: SLOT_DURATION_MINUTES,
			bufferTimeMinutes: 15,
			maxAdvanceBookingDays: 14,
		});
	}, [availableSlots, saveMutation]);

	// Render day content with availability blocks
	const renderDayContent = useCallback(
		(dayIndex: number) => {
			const dayBlocks = availabilityBlocks.filter((b) => b.dayIndex === dayIndex);

			return (
				<>
					{dayBlocks.map((block) => (
						<AvailabilityBlockComponent key={block.id} block={block} onDelete={() => handleDeleteBlock(block)} />
					))}
					{isDragging && dragDay === dayIndex && <DragPreview startY={dragStartY} currentY={dragCurrentY} />}
				</>
			);
		},
		[availabilityBlocks, isDragging, dragDay, dragStartY, dragCurrentY, handleDeleteBlock],
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<div className="grid gap-4 grid-cols-3">
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
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Set Up Availability</h1>
					<p className="text-muted-foreground">Click and drag on the calendar to set your available times</p>
				</div>
				<div className="flex items-center gap-3">
					{hasChanges && (
						<Badge variant="outline" className="text-orange-600 border-orange-300">
							Unsaved changes
						</Badge>
					)}
					<Button variant="outline" onClick={handleClearAll}>
						<Trash2 className="mr-2 h-4 w-4" />
						Clear All
					</Button>
					<Button onClick={handleSave} disabled={saveMutation.isPending || !hasChanges}>
						{saveMutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="mr-2 h-4 w-4" />
								Save Availability
							</>
						)}
					</Button>
				</div>
			</div>

			{/* Info Card */}
			<Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
				<CardContent className="flex items-start gap-3 pt-4">
					<Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
					<div className="text-sm text-blue-800 dark:text-blue-200">
						<p className="font-medium mb-1">How to set your availability:</p>
						<ul className="list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-300">
							<li>Click and drag vertically on any day to create an availability block</li>
							<li>Drag on existing availability to remove it</li>
							<li>Click the trash icon on a block to delete it</li>
							<li>Blocks snap to {SLOT_DURATION_MINUTES}-minute intervals</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* Stats */}
			<AvailabilityStats blocks={availabilityBlocks} />

			{/* Quick Actions */}
			<div className="flex flex-wrap gap-2">
				<span className="text-sm text-muted-foreground mr-2 self-center">Copy schedule:</span>
				{DAYS_SHORT.map((day, i) => (
					<Button
						key={day}
						variant="outline"
						size="sm"
						onClick={() => handleCopyToAll(i)}
						disabled={availableSlots[i].size === 0}
					>
						{day} → All
					</Button>
				))}
			</div>

			{/* Calendar Grid */}
			<CalendarGrid
				ref={calendarRef}
				weekStart={weekStart}
				onWeekChange={setWeekStart}
				renderDayContent={renderDayContent}
				showCurrentTime={false}
				onDayMouseDown={handleDayMouseDown}
				onDayMouseMove={handleDayMouseMove}
				onDayMouseUp={handleDayMouseUp}
				onDayMouseLeave={handleDayMouseLeave}
				className="select-none"
			/>
		</div>
	);
}
