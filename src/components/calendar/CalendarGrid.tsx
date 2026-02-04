import { addDays, format, isToday, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { cn } from "@/utils";

// ============ CONSTANTS ============

export const HOUR_HEIGHT = 60; // pixels per hour
export const HOURS_IN_DAY = 24;
export const TOTAL_HEIGHT = HOUR_HEIGHT * HOURS_IN_DAY; // 1440px for 24 hours
export const SLOT_DURATION_MINUTES = 30; // 30-minute slots
export const SLOTS_PER_HOUR = 60 / SLOT_DURATION_MINUTES;
export const SLOT_HEIGHT = HOUR_HEIGHT / SLOTS_PER_HOUR; // 30px per slot

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ============ UTILITY FUNCTIONS ============

export function timeToMinutes(time: string): number {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
	const hours = Math.floor(minutes / 60) % 24;
	const mins = minutes % 60;
	return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function timeToPixels(time: string): number {
	const minutes = timeToMinutes(time);
	return (minutes / 60) * HOUR_HEIGHT;
}

export function minutesToPixels(minutes: number): number {
	return (minutes / 60) * HOUR_HEIGHT;
}

export function pixelsToTime(pixels: number): string {
	const totalMinutes = (pixels / HOUR_HEIGHT) * 60;
	const snappedMinutes = Math.round(totalMinutes / SLOT_DURATION_MINUTES) * SLOT_DURATION_MINUTES;
	return minutesToTime(Math.max(0, Math.min(snappedMinutes, 24 * 60 - SLOT_DURATION_MINUTES)));
}

export function snapToSlot(pixels: number): number {
	return Math.round(pixels / SLOT_HEIGHT) * SLOT_HEIGHT;
}

export function formatTimeDisplay(time: string): string {
	const [hours, minutes] = time.split(":").map(Number);
	// Use 24-hour format: 0:00 - 24:00
	return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function getCurrentTimePosition(): number {
	const now = new Date();
	const minutes = now.getHours() * 60 + now.getMinutes();
	return (minutes / 60) * HOUR_HEIGHT;
}

export function isSlotInPast(date: Date, endTime: string): boolean {
	const now = new Date();
	const slotEnd = new Date(date);
	const [hours, minutes] = endTime.split(":").map(Number);
	slotEnd.setHours(hours, minutes, 0, 0);
	return slotEnd < now;
}

export function isSlotActive(date: Date, startTime: string, endTime: string): boolean {
	if (!isToday(date)) return false;
	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const startMinutes = timeToMinutes(startTime);
	const endMinutes = timeToMinutes(endTime);
	return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// ============ TYPES ============

export interface CalendarBlock {
	id: string;
	startTime: string;
	endTime: string;
	dayIndex: number;
}

export interface DayColumnProps {
	date: Date;
	dayIndex: number;
	children?: ReactNode;
	showCurrentTime?: boolean;
	className?: string;
	onMouseDown?: (e: React.MouseEvent, dayIndex: number) => void;
	onMouseMove?: (e: React.MouseEvent, dayIndex: number) => void;
	onMouseUp?: (e: React.MouseEvent, dayIndex: number) => void;
	onMouseLeave?: (e: React.MouseEvent, dayIndex: number) => void;
}

// ============ COMPONENTS ============

export function TimeGutter() {
	// Show 0:00 to 24:00 (25 labels for full day coverage)
	const hours = Array.from({ length: 25 }, (_, i) => i);

	return (
		<div className="relative" style={{ height: TOTAL_HEIGHT }}>
			{hours.map((hour) => {
				// For first hour (0:00), position it slightly below to avoid header overlap
				const topOffset = hour === 0 ? 4 : hour * HOUR_HEIGHT;
				const transform = hour === 0 ? "none" : "translateY(-50%)";

				return (
					<div
						key={hour}
						className="absolute left-0 right-0 flex items-start justify-end pr-2 text-xs text-muted-foreground"
						style={{ top: topOffset }}
					>
						<span style={{ transform }}>{formatTimeDisplay(`${hour.toString().padStart(2, "0")}:00`)}</span>
					</div>
				);
			})}
		</div>
	);
}

export function CurrentTimeIndicator() {
	const [position, setPosition] = useState(getCurrentTimePosition());

	useEffect(() => {
		const interval = setInterval(() => {
			setPosition(getCurrentTimePosition());
		}, 60000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: position }}>
			<div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shrink-0" />
			<div className="flex-1 h-0.5 bg-red-500" />
		</div>
	);
}

export function GridLines() {
	const lines = Array.from({ length: HOURS_IN_DAY * SLOTS_PER_HOUR + 1 }, (_, i) => i);

	return (
		<div className="absolute inset-0 pointer-events-none">
			{lines.map((i) => {
				const isHour = i % SLOTS_PER_HOUR === 0;
				return (
					<div
						key={i}
						className={cn("absolute left-0 right-0 border-t", isHour ? "border-border" : "border-border/30")}
						style={{ top: i * SLOT_HEIGHT }}
					/>
				);
			})}
		</div>
	);
}

export function DayColumn({
	date,
	dayIndex,
	children,
	showCurrentTime = true,
	className,
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onMouseLeave,
}: DayColumnProps) {
	const columnRef = useRef<HTMLDivElement>(null);
	const today = isToday(date);

	const handleMouseDown = useCallback((e: React.MouseEvent) => onMouseDown?.(e, dayIndex), [onMouseDown, dayIndex]);
	const handleMouseMove = useCallback((e: React.MouseEvent) => onMouseMove?.(e, dayIndex), [onMouseMove, dayIndex]);
	const handleMouseUp = useCallback((e: React.MouseEvent) => onMouseUp?.(e, dayIndex), [onMouseUp, dayIndex]);
	const handleMouseLeave = useCallback((e: React.MouseEvent) => onMouseLeave?.(e, dayIndex), [onMouseLeave, dayIndex]);

	const hasInteraction = onMouseDown || onMouseMove || onMouseUp || onMouseLeave;

	return (
		<div
			ref={columnRef}
			className={cn(
				"relative flex-1 min-w-[120px] border-r last:border-r-0",
				today && "bg-primary/5",
				hasInteraction && "cursor-crosshair select-none",
				className,
			)}
			style={{ height: TOTAL_HEIGHT }}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
		>
			<GridLines />
			{showCurrentTime && today && <CurrentTimeIndicator />}
			{children}
		</div>
	);
}

export function DayHeader({ date, dayIndex }: { date: Date; dayIndex: number }) {
	const today = isToday(date);

	return (
		<div className={cn("text-center py-2 border-b h-[72px] flex flex-col justify-center", today && "bg-primary/10")}>
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{DAYS_SHORT[dayIndex]}</p>
			<p className={cn("text-xl font-bold", today && "text-primary")}>{format(date, "d")}</p>
			{today && (
				<span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
					Today
				</span>
			)}
		</div>
	);
}

interface CalendarGridProps {
	weekStart: Date;
	onWeekChange: (newWeekStart: Date) => void;
	renderDayContent: (dayIndex: number, date: Date) => ReactNode;
	className?: string;
	headerExtra?: ReactNode;
	onDayMouseDown?: (e: React.MouseEvent, dayIndex: number) => void;
	onDayMouseMove?: (e: React.MouseEvent, dayIndex: number) => void;
	onDayMouseUp?: (e: React.MouseEvent, dayIndex: number) => void;
	onDayMouseLeave?: (e: React.MouseEvent, dayIndex: number) => void;
	showCurrentTime?: boolean;
}

export interface CalendarGridRef {
	scrollToTime: (time: string) => void;
	scrollToNow: () => void;
}

export const CalendarGrid = forwardRef<CalendarGridRef, CalendarGridProps>(function CalendarGrid(
	{
		weekStart,
		onWeekChange,
		renderDayContent,
		className,
		headerExtra,
		onDayMouseDown,
		onDayMouseMove,
		onDayMouseUp,
		onDayMouseLeave,
		showCurrentTime = true,
	},
	ref,
) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

	useImperativeHandle(ref, () => ({
		scrollToTime: (time: string) => {
			if (scrollRef.current) {
				const position = timeToPixels(time);
				scrollRef.current.scrollTop = Math.max(0, position - 100);
			}
		},
		scrollToNow: () => {
			if (scrollRef.current) {
				const position = getCurrentTimePosition();
				scrollRef.current.scrollTop = Math.max(0, position - 100);
			}
		},
	}));

	// Scroll to current time on mount
	useEffect(() => {
		if (scrollRef.current) {
			const position = getCurrentTimePosition();
			scrollRef.current.scrollTop = Math.max(0, position - 100);
		}
	}, []);

	const goToPrevWeek = () => onWeekChange(addDays(weekStart, -7));
	const goToNextWeek = () => onWeekChange(addDays(weekStart, 7));
	const goToToday = () => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }));

	return (
		<div className={cn("flex flex-col border rounded-lg bg-background", className)}>
			{/* Header with navigation */}
			<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" onClick={goToPrevWeek}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="outline" size="sm" onClick={goToToday}>
						Today
					</Button>
					<Button variant="outline" size="icon" onClick={goToNextWeek}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<h2 className="text-lg font-semibold">
					{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
				</h2>
				{headerExtra}
			</div>

			{/* Day headers */}
			<div className="flex border-b sticky top-0 z-10 bg-background">
				<div className="w-16 shrink-0 border-r bg-muted/30 h-[72px]" />
				{weekDays.map((date, i) => (
					<div key={date.toISOString()} className="flex-1 min-w-[120px] border-r last:border-r-0">
						<DayHeader date={date} dayIndex={i} />
					</div>
				))}
			</div>

			{/* Grid area - parent page handles scrolling */}
			<div ref={scrollRef} className="flex">
				{/* Time gutter */}
				<div className="w-16 shrink-0 border-r bg-muted/30">
					<TimeGutter />
				</div>

				{/* Day columns */}
				{weekDays.map((date, i) => (
					<DayColumn
						key={date.toISOString()}
						date={date}
						dayIndex={i}
						showCurrentTime={showCurrentTime}
						onMouseDown={onDayMouseDown}
						onMouseMove={onDayMouseMove}
						onMouseUp={onDayMouseUp}
						onMouseLeave={onDayMouseLeave}
					>
						{renderDayContent(i, date)}
					</DayColumn>
				))}
			</div>
		</div>
	);
});

export default CalendarGrid;
