import { AlertTriangle, Edit, Flag, MessageSquare, Search, Star, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

// Types
interface Review {
	id: string;
	customerId: string;
	customerName: string;
	isAnonymous: boolean;
	rating: number;
	reviewText: string;
	date: string;
	bookingId: string;
	service: string;
	partnerResponse?: {
		text: string;
		date: string;
	};
	flagged?: boolean;
}

// Mock data
const mockReviews: Review[] = [
	{
		id: "1",
		customerId: "c1",
		customerName: "John Smith",
		isAnonymous: false,
		rating: 5,
		reviewText:
			"Excellent service! My car looks brand new. The team was very professional and thorough. Will definitely use again!",
		date: "2024-01-20",
		bookingId: "BK-2001",
		service: "Premium Full Detail",
		partnerResponse: {
			text: "Thank you so much for your kind words, John! We're thrilled you're happy with the service. Looking forward to seeing you again!",
			date: "2024-01-21",
		},
	},
	{
		id: "2",
		customerId: "c2",
		customerName: "Anonymous",
		isAnonymous: true,
		rating: 4,
		reviewText:
			"Good service overall. The interior cleaning was great, but I noticed a small spot they missed on the dashboard. Otherwise happy.",
		date: "2024-01-19",
		bookingId: "BK-2002",
		service: "Interior Deep Clean",
	},
	{
		id: "3",
		customerId: "c3",
		customerName: "Sarah Johnson",
		isAnonymous: false,
		rating: 5,
		reviewText: "Amazing! They picked up my car from my office and delivered it back sparkling clean. So convenient!",
		date: "2024-01-18",
		bookingId: "BK-2003",
		service: "Pick & Clean Service",
	},
	{
		id: "4",
		customerId: "c4",
		customerName: "Mike Brown",
		isAnonymous: false,
		rating: 3,
		reviewText: "Service was okay. Took longer than expected and had to wait an extra 30 minutes.",
		date: "2024-01-17",
		bookingId: "BK-2004",
		service: "Basic Exterior Wash",
	},
	{
		id: "5",
		customerId: "c5",
		customerName: "Emily Davis",
		isAnonymous: false,
		rating: 5,
		reviewText: "Best car wash I've ever used! The attention to detail is incredible.",
		date: "2024-01-16",
		bookingId: "BK-2005",
		service: "Premium Full Detail",
	},
	{
		id: "6",
		customerId: "c6",
		customerName: "James Wilson",
		isAnonymous: false,
		rating: 2,
		reviewText: "Disappointed with the service. The wax job was uneven and I had to bring it back for a redo.",
		date: "2024-01-15",
		bookingId: "BK-2006",
		service: "Full Detail",
		partnerResponse: {
			text: "We apologize for the inconvenience, James. We've noted your feedback and have taken steps to improve our quality checks. Thank you for bringing this to our attention.",
			date: "2024-01-15",
		},
	},
	{
		id: "7",
		customerId: "c7",
		customerName: "Anonymous",
		isAnonymous: true,
		rating: 1,
		reviewText: "Terrible experience. Staff was rude and unprofessional.",
		date: "2024-01-14",
		bookingId: "BK-2007",
		service: "Basic Wash",
		flagged: true,
	},
];

// Rating stats
const calculateRatingStats = (reviews: Review[]) => {
	const total = reviews.length;
	const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
	const average = total > 0 ? sum / total : 0;

	const breakdown = [5, 4, 3, 2, 1].map((stars) => {
		const count = reviews.filter((r) => r.rating === stars).length;
		const percentage = total > 0 ? (count / total) * 100 : 0;
		return { stars, count, percentage };
	});

	return { average, total, breakdown };
};

export default function PartnerReviewsPage() {
	const [reviews, setReviews] = useState<Review[]>(mockReviews);
	const [searchQuery, setSearchQuery] = useState("");
	const [ratingFilter, setRatingFilter] = useState("all");
	const [sortBy, setSortBy] = useState("recent");
	const [responseDialogOpen, setResponseDialogOpen] = useState(false);
	const [flagDialogOpen, setFlagDialogOpen] = useState(false);
	const [selectedReview, setSelectedReview] = useState<Review | null>(null);
	const [responseText, setResponseText] = useState("");
	const [flagReason, setFlagReason] = useState("");
	const [isEditing, setIsEditing] = useState(false);

	const stats = calculateRatingStats(reviews);

	// Filter and sort reviews
	const filteredReviews = reviews
		.filter((review) => {
			if (ratingFilter !== "all" && review.rating !== parseInt(ratingFilter)) return false;
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					review.reviewText.toLowerCase().includes(query) ||
					review.customerName.toLowerCase().includes(query) ||
					review.service.toLowerCase().includes(query)
				);
			}
			return true;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case "recent":
					return new Date(b.date).getTime() - new Date(a.date).getTime();
				case "highest":
					return b.rating - a.rating;
				case "lowest":
					return a.rating - b.rating;
				default:
					return 0;
			}
		});

	// Handlers
	const handleOpenResponseDialog = (review: Review, editing = false) => {
		setSelectedReview(review);
		setIsEditing(editing);
		setResponseText(editing && review.partnerResponse ? review.partnerResponse.text : "");
		setResponseDialogOpen(true);
	};

	const handleSubmitResponse = () => {
		if (!selectedReview || !responseText.trim()) return;

		setReviews((prev) =>
			prev.map((r) =>
				r.id === selectedReview.id
					? {
							...r,
							partnerResponse: {
								text: responseText.trim(),
								date: new Date().toISOString().split("T")[0],
							},
						}
					: r,
			),
		);

		setResponseDialogOpen(false);
		setResponseText("");
		setSelectedReview(null);
		toast.success(isEditing ? "Response updated" : "Response submitted");
	};

	const handleDeleteResponse = (reviewId: string) => {
		setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, partnerResponse: undefined } : r)));
		toast.success("Response deleted");
	};

	const handleOpenFlagDialog = (review: Review) => {
		setSelectedReview(review);
		setFlagReason("");
		setFlagDialogOpen(true);
	};

	const handleSubmitFlag = () => {
		if (!selectedReview || !flagReason.trim()) return;

		setReviews((prev) => prev.map((r) => (r.id === selectedReview.id ? { ...r, flagged: true } : r)));

		setFlagDialogOpen(false);
		setFlagReason("");
		setSelectedReview(null);
		toast.success("Review reported to admin for review");
	};

	// Star renderer
	const renderStars = (rating: number, size: "sm" | "md" | "lg" = "sm") => {
		const sizeClasses = {
			sm: "h-4 w-4",
			md: "h-5 w-5",
			lg: "h-8 w-8",
		};

		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={cn(sizeClasses[size], star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
					/>
				))}
			</div>
		);
	};

	// Rating bar renderer
	const renderRatingBar = (percentage: number) => (
		<div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
			<div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }} />
		</div>
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold">Reviews & Ratings</h1>
				<p className="text-muted-foreground">Manage customer feedback and respond to reviews</p>
			</div>

			{/* Rating Summary */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Overall Rating */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Overall Rating</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center">
						<div className="flex items-center gap-3 mb-4">
							<span className="text-5xl font-bold">{stats.average.toFixed(1)}</span>
							<div>
								{renderStars(Math.round(stats.average), "lg")}
								<p className="text-sm text-muted-foreground mt-1">Based on {stats.total} reviews</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Rating Breakdown */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-base">Rating Breakdown</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{stats.breakdown.map((item) => (
							<div key={item.stars} className="flex items-center gap-3">
								<div className="flex items-center gap-1 w-16">
									<span className="text-sm font-medium">{item.stars}</span>
									<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
								</div>
								{renderRatingBar(item.percentage)}
								<div className="w-20 text-right text-sm text-muted-foreground">
									{item.count} ({item.percentage.toFixed(0)}%)
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-wrap gap-4">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search reviews..."
								className="pl-10"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<Select value={ratingFilter} onValueChange={setRatingFilter}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Filter by rating" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Ratings</SelectItem>
								<SelectItem value="5">5 Stars</SelectItem>
								<SelectItem value="4">4 Stars</SelectItem>
								<SelectItem value="3">3 Stars</SelectItem>
								<SelectItem value="2">2 Stars</SelectItem>
								<SelectItem value="1">1 Star</SelectItem>
							</SelectContent>
						</Select>
						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="recent">Most Recent</SelectItem>
								<SelectItem value="highest">Highest Rated</SelectItem>
								<SelectItem value="lowest">Lowest Rated</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Reviews List */}
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">{filteredReviews.length} Reviews</h2>

				{filteredReviews.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center text-muted-foreground">
							<MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No reviews found</p>
						</CardContent>
					</Card>
				) : (
					filteredReviews.map((review) => (
						<Card key={review.id} className={cn(review.flagged && "border-red-300")}>
							<CardContent className="pt-6">
								<div className="space-y-4">
									{/* Review Header */}
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
												<User className="h-5 w-5 text-primary" />
											</div>
											<div>
												<div className="flex items-center gap-2">
													<p className="font-medium">{review.isAnonymous ? "Anonymous" : review.customerName}</p>
													{review.flagged && (
														<Badge variant="destructive" className="text-xs">
															<AlertTriangle className="h-3 w-3 mr-1" />
															Flagged
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													{renderStars(review.rating)}
													<span>•</span>
													<span>{review.date}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="outline">{review.service}</Badge>
											<span className="text-xs text-muted-foreground">{review.bookingId}</span>
										</div>
									</div>

									{/* Review Text */}
									<p className="text-sm">{review.reviewText}</p>

									{/* Partner Response */}
									{review.partnerResponse && (
										<div className="ml-6 pl-4 border-l-2 border-primary/20 bg-muted/30 rounded-r-lg p-4">
											<div className="flex items-center justify-between mb-2">
												<p className="text-sm font-medium text-primary">Your Response</p>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleOpenResponseDialog(review, true)}
														className="h-7 px-2"
													>
														<Edit className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDeleteResponse(review.id)}
														className="h-7 px-2 text-destructive hover:text-destructive"
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
											<p className="text-sm text-muted-foreground">{review.partnerResponse.text}</p>
											<p className="text-xs text-muted-foreground mt-2">Responded on {review.partnerResponse.date}</p>
										</div>
									)}

									{/* Actions */}
									<div className="flex items-center gap-2 pt-2 border-t">
										{!review.partnerResponse && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleOpenResponseDialog(review)}
												className="gap-1"
											>
												<MessageSquare className="h-4 w-4" />
												Respond
											</Button>
										)}
										{!review.flagged && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleOpenFlagDialog(review)}
												className="gap-1 text-muted-foreground hover:text-destructive"
											>
												<Flag className="h-4 w-4" />
												Report
											</Button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Response Dialog */}
			<Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
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
									{renderStars(selectedReview.rating)}
								</div>
								<p className="text-sm text-muted-foreground">{selectedReview.reviewText}</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="response">Your Response</Label>
								<Textarea
									id="response"
									placeholder="Write your response..."
									value={responseText}
									onChange={(e) => setResponseText(e.target.value)}
									rows={4}
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSubmitResponse} disabled={!responseText.trim()}>
							{isEditing ? "Update Response" : "Submit Response"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Flag Dialog */}
			<Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Report Inappropriate Review</DialogTitle>
						<DialogDescription>This review will be sent to our admin team for review</DialogDescription>
					</DialogHeader>
					{selectedReview && (
						<div className="space-y-4 py-4">
							<div className="p-3 rounded-lg bg-muted">
								<p className="text-sm text-muted-foreground">{selectedReview.reviewText}</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="flag-reason">Reason for reporting</Label>
								<Textarea
									id="flag-reason"
									placeholder="Explain why this review is inappropriate..."
									value={flagReason}
									onChange={(e) => setFlagReason(e.target.value)}
									rows={3}
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleSubmitFlag} disabled={!flagReason.trim()}>
							Report Review
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
