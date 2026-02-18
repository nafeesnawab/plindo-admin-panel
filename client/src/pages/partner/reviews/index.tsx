import { MessageSquare } from "lucide-react";

import { ResponseDialog } from "./components/response-dialog";
import { ReviewCard } from "./components/review-card";
import { ReviewsToolbar } from "./components/reviews-toolbar";
import { useReviews } from "./hooks/use-reviews";

export default function PartnerReviewsPage() {
	const {
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
	} = useReviews();

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				<span className="font-semibold text-foreground text-lg">{stats.average.toFixed(1)} avg</span>
				<span>·</span>
				<span>{stats.total} reviews</span>
				<span>·</span>
				<span>{stats.fiveStarPercent}% 5-star</span>
			</div>

			<ReviewsToolbar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				ratingFilter={ratingFilter}
				onRatingChange={setRatingFilter}
				showFilters={showFilters}
				onToggleFilters={() => setShowFilters(!showFilters)}
				activeFiltersCount={activeFiltersCount}
				onClearFilters={clearFilters}
			/>

			<div className="space-y-4">
				{filteredReviews.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
						<MessageSquare className="h-10 w-10 mb-3 opacity-40" />
						<p className="text-sm font-medium">No reviews found</p>
						<p className="text-xs mt-1">Try adjusting your search or filters</p>
					</div>
				) : (
					filteredReviews.map((review) => (
						<ReviewCard
							key={review.id}
							review={review}
							onRespond={(r) => openResponseDialog(r)}
							onEditResponse={(r) => openResponseDialog(r, true)}
							onDeleteResponse={deleteResponse}
						/>
					))
				)}
			</div>

			<ResponseDialog
				open={responseDialogOpen}
				onOpenChange={setResponseDialogOpen}
				selectedReview={selectedReview}
				responseText={responseText}
				onResponseTextChange={setResponseText}
				isEditing={isEditing}
				onSubmit={submitResponse}
			/>
		</div>
	);
}
