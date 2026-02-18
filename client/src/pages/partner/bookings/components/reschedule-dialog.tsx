import { format } from "date-fns";
import { useState } from "react";

import { formatTimeDisplay, timeToMinutes } from "@/components/calendar/utils";
import type { SlotBooking } from "@/types/booking";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

interface RescheduleDialogProps {
	booking: SlotBooking | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (date: string, startTime: string, endTime: string) => void;
	isLoading: boolean;
}

export function RescheduleDialog({ booking, open, onOpenChange, onConfirm, isLoading }: RescheduleDialogProps) {
	const [newDate, setNewDate] = useState("");
	const [newStartTime, setNewStartTime] = useState("");

	if (!booking) return null;

	const duration = booking.service.duration;

	const calculateEndTime = (start: string) => {
		const startMin = timeToMinutes(start);
		const endMin = startMin + duration;
		const h = Math.floor(endMin / 60) % 24;
		const m = endMin % 60;
		return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Reschedule Booking</DialogTitle>
					<DialogDescription>Select a new date and time.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="p-3 bg-muted rounded-lg text-sm">
						<p className="font-medium">
							Current: {format(new Date(booking.slot.date), "EEE, MMM d")} at{" "}
							{formatTimeDisplay(booking.slot.startTime)}
						</p>
						<p className="text-muted-foreground">
							{booking.service.name} • {duration}min
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>New Date</Label>
							<Input
								type="date"
								value={newDate}
								onChange={(e) => setNewDate(e.target.value)}
								min={format(new Date(), "yyyy-MM-dd")}
							/>
						</div>
						<div className="space-y-2">
							<Label>Start Time</Label>
							<Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
						</div>
					</div>
					{newStartTime && (
						<p className="text-sm text-muted-foreground">
							End time: {formatTimeDisplay(calculateEndTime(newStartTime))} ({duration}min)
						</p>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={() => onConfirm(newDate, newStartTime, calculateEndTime(newStartTime))}
						disabled={isLoading || !newDate || !newStartTime}
					>
						{isLoading ? "Rescheduling..." : "Confirm"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
