import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

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
}

const reviewsStore = new Map<string, Review[]>();

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
	];
};

const initializePartnerData = (partnerId: string) => {
	if (!reviewsStore.has(partnerId)) {
		reviewsStore.set(partnerId, generateMockReviews(partnerId));
	}
};

initializePartnerData("demo-partner-1");

const getReviews = http.get("/api/partner/reviews", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const ratingFilter = url.searchParams.get("rating");
	const search = url.searchParams.get("search");

	initializePartnerData(partnerId);
	let reviews = reviewsStore.get(partnerId) || [];

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

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { reviews },
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

export const partnerReviewsHandlers = [getReviews, respondToReview, deleteResponse];
