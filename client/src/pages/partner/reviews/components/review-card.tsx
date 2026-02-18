import { Edit, MessageSquare, Star, Trash2, User } from "lucide-react";

import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { cn } from "@/utils";

import type { Review } from "../types";

interface ReviewCardProps {
	review: Review;
	onRespond: (review: Review) => void;
	onEditResponse: (review: Review) => void;
	onDeleteResponse: (reviewId: string) => void;
}

function RatingStars({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={cn(
						"h-4 w-4",
						star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600",
					)}
				/>
			))}
		</div>
	);
}

export function ReviewCard({ review, onRespond, onEditResponse, onDeleteResponse }: ReviewCardProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="font-medium">
									{review.isAnonymous ? "Anonymous" : review.customerName}
								</p>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<RatingStars rating={review.rating} />
									<span>·</span>
									<span>{review.date}</span>
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">{review.service}</p>
							</div>
						</div>
					</div>

					<p className="text-sm">{review.reviewText}</p>

					{review.partnerResponse && (
						<div className="ml-6 pl-4 border-l-2 border-primary/20 bg-muted/30 rounded-r-lg p-3">
							<div className="flex items-center justify-between mb-1">
								<p className="text-sm font-medium text-primary">Your Response</p>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onEditResponse(review)}
										className="h-7 px-2"
									>
										<Edit className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDeleteResponse(review.id)}
										className="h-7 px-2 text-destructive hover:text-destructive"
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							</div>
							<p className="text-sm text-muted-foreground">{review.partnerResponse.text}</p>
						</div>
					)}

					{!review.partnerResponse && (
						<div className="pt-2 border-t border-border">
							<Button variant="outline" size="sm" onClick={() => onRespond(review)} className="gap-1">
								<MessageSquare className="h-4 w-4" />
								Respond
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export { RatingStars };
