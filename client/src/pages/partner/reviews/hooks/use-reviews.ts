import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Review, ReviewStats } from "../types";
import { calculateReviewStats, mockReviews } from "../types";

interface UseReviewsReturn {
	filteredReviews: Review[];
	stats: ReviewStats;
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	ratingFilter: string;
	setRatingFilter: (value: string) => void;
	showFilters: boolean;
	setShowFilters: (value: boolean) => void;
	activeFiltersCount: number;
	clearFilters: () => void;
	responseDialogOpen: boolean;
	setResponseDialogOpen: (value: boolean) => void;
	selectedReview: Review | null;
	responseText: string;
	setResponseText: (value: string) => void;
	isEditing: boolean;
	openResponseDialog: (review: Review, editing?: boolean) => void;
	submitResponse: () => void;
	deleteResponse: (reviewId: string) => void;
}

export function useReviews(): UseReviewsReturn {
	const [reviews, setReviews] = useState<Review[]>(mockReviews);
	const [searchQuery, setSearchQuery] = useState("");
	const [ratingFilter, setRatingFilter] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [responseDialogOpen, setResponseDialogOpen] = useState(false);
	const [selectedReview, setSelectedReview] = useState<Review | null>(null);
	const [responseText, setResponseText] = useState("");
	const [isEditing, setIsEditing] = useState(false);

	const stats = useMemo(() => calculateReviewStats(reviews), [reviews]);

	const activeFiltersCount = [ratingFilter !== "all"].filter(Boolean).length;

	const filteredReviews = useMemo(() => {
		return reviews
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
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [reviews, ratingFilter, searchQuery]);

	const clearFilters = () => {
		setRatingFilter("all");
		setSearchQuery("");
	};

	const openResponseDialog = (review: Review, editing = false) => {
		setSelectedReview(review);
		setIsEditing(editing);
		setResponseText(editing && review.partnerResponse ? review.partnerResponse.text : "");
		setResponseDialogOpen(true);
	};

	const submitResponse = () => {
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

	const deleteResponse = (reviewId: string) => {
		setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, partnerResponse: undefined } : r)));
		toast.success("Response deleted");
	};

	return {
		filteredReviews,
		stats,
		searchQuery,
		setSearchQuery,
		ratingFilter,
		setRatingFilter,
		showFilters,
		setShowFilters,
		activeFiltersCount,
		clearFilters,
		responseDialogOpen,
		setResponseDialogOpen,
		selectedReview,
		responseText,
		setResponseText,
		isEditing,
		openResponseDialog,
		submitResponse,
		deleteResponse,
	};
}
