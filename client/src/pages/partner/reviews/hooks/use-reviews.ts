import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import reviewsService from "@/api/services/reviewsService";

import type { Review, ReviewStats } from "../types";
import { calculateReviewStats } from "../types";

interface UseReviewsReturn {
	filteredReviews: Review[];
	stats: ReviewStats;
	isLoading: boolean;
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
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const [ratingFilter, setRatingFilter] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [responseDialogOpen, setResponseDialogOpen] = useState(false);
	const [selectedReview, setSelectedReview] = useState<Review | null>(null);
	const [responseText, setResponseText] = useState("");
	const [isEditing, setIsEditing] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["partner-reviews"],
		queryFn: () => reviewsService.getReviews(),
	});

	const reviews: Review[] = (data?.reviews ?? []) as Review[];

	const stats = useMemo(() => calculateReviewStats(reviews), [reviews]);
	const activeFiltersCount = [ratingFilter !== "all"].filter(Boolean).length;

	const filteredReviews = useMemo(() => {
		return reviews
			.filter((review) => {
				if (
					ratingFilter !== "all" &&
					review.rating !== Number.parseInt(ratingFilter)
				)
					return false;
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
		setResponseText(
			editing && review.partnerResponse ? review.partnerResponse.text : "",
		);
		setResponseDialogOpen(true);
	};

	const respondMutation = useMutation({
		mutationFn: ({ id, text }: { id: string; text: string }) =>
			reviewsService.respondToReview(id, text),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-reviews"] });
			setResponseDialogOpen(false);
			setResponseText("");
			setSelectedReview(null);
			toast.success(isEditing ? "Response updated" : "Response submitted");
		},
		onError: () => toast.error("Failed to submit response"),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => reviewsService.deleteResponse(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["partner-reviews"] });
			toast.success("Response deleted");
		},
		onError: () => toast.error("Failed to delete response"),
	});

	const submitResponse = () => {
		if (!selectedReview || !responseText.trim()) return;
		respondMutation.mutate({
			id: selectedReview.id,
			text: responseText.trim(),
		});
	};

	const deleteResponse = (reviewId: string) => {
		deleteMutation.mutate(reviewId);
	};

	return {
		filteredReviews,
		stats,
		isLoading,
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
