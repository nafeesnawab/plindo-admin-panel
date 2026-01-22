import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

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

interface RatingStats {
	average: number;
	total: number;
	breakdown: { stars: number; count: number; percentage: number }[];
}

// In-memory storage
const reviewsStore = new Map<string, Review[]>();

// Generate mock reviews
const generateMockReviews = (partnerId: string): Review[] => {
	return [
		{
			id: `${partnerId}-r1`,
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
			id: `${partnerId}-r2`,
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
			id: `${partnerId}-r3`,
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
			id: `${partnerId}-r4`,
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
			id: `${partnerId}-r5`,
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
			id: `${partnerId}-r6`,
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
			id: `${partnerId}-r7`,
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
};

// Initialize partner data
const initializePartnerData = (partnerId: string) => {
	if (!reviewsStore.has(partnerId)) {
		reviewsStore.set(partnerId, generateMockReviews(partnerId));
	}
};

// Calculate rating stats
const calculateRatingStats = (reviews: Review[]): RatingStats => {
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

// Initialize demo partner
initializePartnerData("demo-partner-1");

// API Handlers
const getReviews = http.get("/api/partner/reviews", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const ratingFilter = url.searchParams.get("rating");
	const sortBy = url.searchParams.get("sortBy") || "recent";
	const search = url.searchParams.get("search");

	initializePartnerData(partnerId);
	let reviews = reviewsStore.get(partnerId) || [];

	// Apply filters
	if (ratingFilter && ratingFilter !== "all") {
		reviews = reviews.filter((r) => r.rating === parseInt(ratingFilter));
	}

	if (search) {
		const query = search.toLowerCase();
		reviews = reviews.filter(
			(r) =>
				r.reviewText.toLowerCase().includes(query) ||
				r.customerName.toLowerCase().includes(query) ||
				r.service.toLowerCase().includes(query),
		);
	}

	// Apply sorting
	reviews = [...reviews].sort((a, b) => {
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

	const stats = calculateRatingStats(reviewsStore.get(partnerId) || []);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { reviews, stats },
	});
});

const getReviewStats = http.get("/api/partner/reviews/stats", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const reviews = reviewsStore.get(partnerId) || [];
	const stats = calculateRatingStats(reviews);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { stats },
	});
});

const respondToReview = http.post("/api/partner/reviews/:id/respond", async ({ params, request }) => {
	await delay(300);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { text } = (await request.json()) as { text: string };

	initializePartnerData(partnerId);
	const reviews = reviewsStore.get(partnerId) || [];

	const reviewIndex = reviews.findIndex((r) => r.id === id);
	if (reviewIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Review not found" }, { status: 404 });
	}

	reviews[reviewIndex].partnerResponse = {
		text,
		date: new Date().toISOString().split("T")[0],
	};

	reviewsStore.set(partnerId, reviews);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Response submitted successfully",
		data: { review: reviews[reviewIndex] },
	});
});

const updateResponse = http.put("/api/partner/reviews/:id/respond", async ({ params, request }) => {
	await delay(300);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { text } = (await request.json()) as { text: string };

	initializePartnerData(partnerId);
	const reviews = reviewsStore.get(partnerId) || [];

	const reviewIndex = reviews.findIndex((r) => r.id === id);
	if (reviewIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Review not found" }, { status: 404 });
	}

	reviews[reviewIndex].partnerResponse = {
		text,
		date: new Date().toISOString().split("T")[0],
	};

	reviewsStore.set(partnerId, reviews);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Response updated successfully",
		data: { review: reviews[reviewIndex] },
	});
});

const deleteResponse = http.delete("/api/partner/reviews/:id/respond", async ({ params, request }) => {
	await delay(200);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const reviews = reviewsStore.get(partnerId) || [];

	const reviewIndex = reviews.findIndex((r) => r.id === id);
	if (reviewIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Review not found" }, { status: 404 });
	}

	delete reviews[reviewIndex].partnerResponse;
	reviewsStore.set(partnerId, reviews);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Response deleted successfully",
	});
});

const flagReview = http.post("/api/partner/reviews/:id/flag", async ({ params, request }) => {
	await delay(300);

	const { id } = params;
	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const { reason } = (await request.json()) as { reason: string };

	initializePartnerData(partnerId);
	const reviews = reviewsStore.get(partnerId) || [];

	const reviewIndex = reviews.findIndex((r) => r.id === id);
	if (reviewIndex === -1) {
		return HttpResponse.json({ status: 10001, message: "Review not found" }, { status: 404 });
	}

	reviews[reviewIndex].flagged = true;
	reviewsStore.set(partnerId, reviews);

	// In a real app, this would create a support ticket for admin review
	console.log(`Review ${id} flagged with reason: ${reason}`);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Review reported to admin for review",
		data: { review: reviews[reviewIndex] },
	});
});

export const partnerReviewsHandlers = [
	getReviews,
	getReviewStats,
	respondToReview,
	updateResponse,
	deleteResponse,
	flagReview,
];
