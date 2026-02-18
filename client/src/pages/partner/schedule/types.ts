import type { DayAvailability, ServiceCategory, TimeBlock } from "@/types/booking";

export type { DayAvailability, ServiceCategory, TimeBlock };

export interface TimeSlotWithId extends TimeBlock {
	id: string;
}

export interface DayAvailabilityExtended extends Omit<DayAvailability, "timeBlocks"> {
	timeBlocks: TimeSlotWithId[];
}
