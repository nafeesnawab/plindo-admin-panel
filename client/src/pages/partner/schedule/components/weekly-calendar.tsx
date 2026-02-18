import { Switch } from "@/ui/switch";
import { cn } from "@/utils";

import type { DayAvailabilityExtended } from "../types";
import { CalendarColumn } from "./calendar-day-row";

const ROW_HEIGHT = 44;

function formatHour(hour: number): string {
	if (hour === 0) return "12 AM";
	if (hour === 12) return "12 PM";
	if (hour > 12) return `${hour - 12} PM`;
	return `${hour} AM`;
}

interface WeeklyCalendarProps {
	schedule: DayAvailabilityExtended[];
	onDayChange: (updated: DayAvailabilityExtended) => void;
}

export function WeeklyCalendar({ schedule, onDayChange }: WeeklyCalendarProps) {
	return (
		<div className="flex flex-col gap-3">
			<div>
				<h3 className="text-base font-semibold">Working Hours</h3>
				<p className="text-xs text-muted-foreground mt-0.5">
					Drag to add slots · drag on filled areas to remove · adjacent slots merge automatically
				</p>
			</div>

			<div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<div className="min-w-[640px]">
						<div
							className="grid border-b border-border bg-muted/50"
							style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
						>
							<div />
							{schedule.map((day) => (
								<div
									key={day.dayOfWeek}
									className="flex flex-col items-center gap-1.5 py-2 border-l border-border/60"
								>
									<span
										className={cn(
											"text-[11px] font-semibold uppercase tracking-wide",
											day.isEnabled ? "text-foreground" : "text-muted-foreground/50",
										)}
									>
										{day.dayName?.slice(0, 3)}
									</span>
									<Switch
										className="scale-[0.55]"
										checked={day.isEnabled}
										onCheckedChange={(checked) => onDayChange({ ...day, isEnabled: checked })}
									/>
								</div>
							))}
						</div>

						<div
							className="grid"
							style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
						>
							<div className="border-r border-border/60">
								{Array.from({ length: 24 }, (_, i) => (
									<div
										key={i}
										className={cn(
											"flex items-center justify-end pr-1.5",
											i > 0 && "border-t",
											i % 6 === 0 ? "border-border/60" : "border-border/30",
										)}
										style={{ height: ROW_HEIGHT }}
									>
										<span className="text-[10px] text-muted-foreground font-medium tabular-nums">
											{formatHour(i)}
										</span>
									</div>
								))}
							</div>

							{schedule.map((day) => (
								<CalendarColumn
									key={day.dayOfWeek}
									day={day}
									onChange={onDayChange}
									rowHeight={ROW_HEIGHT}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
