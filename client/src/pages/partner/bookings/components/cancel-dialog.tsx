import { useState } from "react";

import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";

interface CancelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
	isLoading: boolean;
}

export function CancelDialog({ open, onOpenChange, onConfirm, isLoading }: CancelDialogProps) {
	const [reason, setReason] = useState("");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cancel Booking</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="cancel-reason">Reason</Label>
					<Textarea
						id="cancel-reason"
						placeholder="Reason for cancellation..."
						value={reason}
						onChange={(e) => setReason(e.target.value)}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
						Keep Booking
					</Button>
					<Button variant="destructive" onClick={() => onConfirm(reason)} disabled={isLoading || !reason.trim()}>
						{isLoading ? "Cancelling..." : "Cancel Booking"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
