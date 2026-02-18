import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";

import type { Review } from "../types";
import { RatingStars } from "./review-card";

interface ResponseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedReview: Review | null;
	responseText: string;
	onResponseTextChange: (value: string) => void;
	isEditing: boolean;
	onSubmit: () => void;
}

export function ResponseDialog({
	open,
	onOpenChange,
	selectedReview,
	responseText,
	onResponseTextChange,
	isEditing,
	onSubmit,
}: ResponseDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Response" : "Respond to Review"}</DialogTitle>
					<DialogDescription>Your response will be visible to the customer and other users</DialogDescription>
				</DialogHeader>
				{selectedReview && (
					<div className="space-y-4 py-4">
						<div className="p-3 rounded-lg bg-muted">
							<div className="flex items-center gap-2 mb-2">
								<span className="font-medium">
									{selectedReview.isAnonymous ? "Anonymous" : selectedReview.customerName}
								</span>
								<RatingStars rating={selectedReview.rating} />
							</div>
							<p className="text-sm text-muted-foreground">{selectedReview.reviewText}</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="response">Your Response</Label>
							<Textarea
								id="response"
								placeholder="Write your response..."
								value={responseText}
								onChange={(e) => onResponseTextChange(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={onSubmit} disabled={!responseText.trim()}>
						{isEditing ? "Update Response" : "Submit Response"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
