import { useCallback, useRef, useState } from "react";
import { nanoid } from "nanoid";

import { cn } from "@/utils";

import type { DayAvailabilityExtended, TimeSlotWithId } from "../types";

const SNAP_MINUTES = 30;
const TOTAL_MINUTES = 24 * 60;

function timeToPercent(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return ((h * 60 + m) / TOTAL_MINUTES) * 100;
}

function percentToTime(pct: number): string {
	let totalMin = Math.round((pct / 100) * TOTAL_MINUTES);
	totalMin = Math.round(totalMin / SNAP_MINUTES) * SNAP_MINUTES;
	totalMin = Math.max(0, Math.min(TOTAL_MINUTES, totalMin));
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTime(time: string): string {
	const [h, m] = time.split(":").map(Number);
	const period = h >= 12 ? " PM" : " AM";
	const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
	return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
}

function mergeSlots(slots: TimeSlotWithId[]): TimeSlotWithId[] {
	if (slots.length <= 1) return slots;
	const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
	const result: TimeSlotWithId[] = [{ ...sorted[0] }];
	for (let i = 1; i < sorted.length; i++) {
		const last = result[result.length - 1];
		if (sorted[i].start <= last.end) {
			if (sorted[i].end > last.end) last.end = sorted[i].end;
		} else {
			result.push({ ...sorted[i] });
		}
	}
	return result;
}

function subtractRange(blocks: TimeSlotWithId[], rangeStart: string, rangeEnd: string): TimeSlotWithId[] {
	return blocks.flatMap((block) => {
		if (rangeStart >= block.end || rangeEnd <= block.start) return [block];
		const parts: TimeSlotWithId[] = [];
		if (block.start < rangeStart) parts.push({ id: nanoid(8), start: block.start, end: rangeStart });
		if (block.end > rangeEnd) parts.push({ id: nanoid(8), start: rangeEnd, end: block.end });
		return parts;
	});
}

interface CalendarColumnProps {
	day: DayAvailabilityExtended;
	onChange: (updated: DayAvailabilityExtended) => void;
	rowHeight: number;
}

interface DragState {
	startPct: number;
	endPct: number;
	isRemove: boolean;
}

export function CalendarColumn({ day, onChange, rowHeight }: CalendarColumnProps) {
	const gridRef = useRef<HTMLDivElement>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const totalHeight = 24 * rowHeight;

	const getPercent = useCallback((e: React.MouseEvent) => {
		if (!gridRef.current) return 0;
		const rect = gridRef.current.getBoundingClientRect();
		return Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
	}, []);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!day.isEnabled || e.button !== 0) return;
			e.preventDefault();
			const isOnBlock = !!(e.target as HTMLElement).closest("[data-block]");
			setDragState({ startPct: getPercent(e), endPct: getPercent(e), isRemove: isOnBlock });
		},
		[day.isEnabled, getPercent],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!dragState) return;
			e.preventDefault();
			setDragState((prev) => (prev ? { ...prev, endPct: getPercent(e) } : null));
		},
		[dragState, getPercent],
	);

	const handleMouseUp = useCallback(() => {
		if (!dragState) return;
		const topPct = Math.min(dragState.startPct, dragState.endPct);
		const bottomPct = Math.max(dragState.startPct, dragState.endPct);

		if (bottomPct - topPct < 1.5) {
			if (dragState.isRemove) {
				const clickTime = percentToTime((topPct + bottomPct) / 2);
				onChange({
					...day,
					timeBlocks: day.timeBlocks.filter((b) => !(clickTime >= b.start && clickTime < b.end)),
				});
			}
			setDragState(null);
			return;
		}

		const startTime = percentToTime(topPct);
		const endTime = percentToTime(bottomPct);
		if (startTime === endTime) {
			setDragState(null);
			return;
		}

		if (dragState.isRemove) {
			onChange({ ...day, timeBlocks: subtractRange(day.timeBlocks, startTime, endTime) });
		} else {
			const newSlot: TimeSlotWithId = { id: nanoid(8), start: startTime, end: endTime };
			onChange({ ...day, timeBlocks: mergeSlots([...day.timeBlocks, newSlot]) });
		}
		setDragState(null);
	}, [dragState, day, onChange]);

	const ghostTop = dragState ? Math.min(dragState.startPct, dragState.endPct) : 0;
	const ghostHeight = dragState ? Math.abs(dragState.endPct - dragState.startPct) : 0;

	return (
		<div
			ref={gridRef}
			className={cn(
				"relative border-l border-border/60 select-none",
				day.isEnabled ? "cursor-crosshair" : "cursor-not-allowed",
				!day.isEnabled && "bg-muted/30",
			)}
			style={{ height: totalHeight }}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={() => dragState && handleMouseUp()}
		>
			{Array.from({ length: 24 }, (_, i) => (
				<div
					key={i}
					className={cn(
						"absolute left-0 right-0 border-t",
						i % 6 === 0 ? "border-border/60" : "border-border/30",
					)}
					style={{ top: i * rowHeight }}
				/>
			))}

			{!day.isEnabled && (
				<div className="absolute inset-0 flex items-center justify-center z-[5]">
					<span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest -rotate-90">
						Off
					</span>
				</div>
			)}

			{day.isEnabled &&
				day.timeBlocks.map((block) => {
					const top = timeToPercent(block.start);
					const height = timeToPercent(block.end) - top;
					return (
						<div
							key={block.id}
							data-block
							className="absolute left-1 right-1 rounded-md bg-primary/90 hover:bg-primary group/block flex flex-col justify-between py-1 px-1.5 transition-colors cursor-pointer z-10 shadow-sm overflow-hidden"
							style={{ top: `${top}%`, height: `${Math.max(height, 2)}%` }}
						>
							<span className="text-[10px] text-primary-foreground font-semibold leading-tight">
								{formatTime(block.start)}
							</span>
							{height > 5 && (
								<span className="text-[10px] text-primary-foreground/70 font-medium leading-tight">
									{formatTime(block.end)}
								</span>
							)}
						</div>
					);
				})}

			{dragState && ghostHeight > 1 && (
				<div
					className={cn(
						"absolute left-1 right-1 rounded-md border-2 z-20 pointer-events-none",
						dragState.isRemove
							? "bg-destructive/15 border-destructive/40"
							: "bg-primary/15 border-primary/40",
					)}
					style={{ top: `${ghostTop}%`, height: `${ghostHeight}%` }}
				/>
			)}
		</div>
	);
}
