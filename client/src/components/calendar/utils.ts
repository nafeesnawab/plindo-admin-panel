import { isToday } from "date-fns";

// ============ CONSTANTS ============

export const HOUR_HEIGHT = 60;
export const HOURS_IN_DAY = 24;
export const TOTAL_HEIGHT = HOUR_HEIGHT * HOURS_IN_DAY;
export const SLOT_DURATION_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_DURATION_MINUTES;
export const SLOT_HEIGHT = HOUR_HEIGHT / SLOTS_PER_HOUR;

export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type CalendarView = "day" | "week" | "month";

// ============ TIME UTILITIES ============

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
	return (timeToMinutes(time) / 60) * HOUR_HEIGHT;
}

export function minutesToPixels(minutes: number): number {
	return (minutes / 60) * HOUR_HEIGHT;
}

export function formatTimeDisplay(time: string): string {
	const [hours, minutes] = time.split(":").map(Number);
	return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function getCurrentTimePosition(): number {
	const now = new Date();
	return ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;
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
	return currentMinutes >= timeToMinutes(startTime) && currentMinutes < timeToMinutes(endTime);
}
