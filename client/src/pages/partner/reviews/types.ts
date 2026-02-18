export interface Review {
	id: string;
	customerId: string;
	customerName: string;
	isAnonymous: boolean;
	rating: number;
	reviewText: string;
	date: string;
	service: string;
	partnerResponse?: {
		text: string;
		date: string;
	};
}

export interface ReviewStats {
	average: number;
	total: number;
	fiveStarPercent: number;
}

export const calculateReviewStats = (reviews: Review[]): ReviewStats => {
	const total = reviews.length;
	const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
	const average = total > 0 ? sum / total : 0;
	const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
	const fiveStarPercent = total > 0 ? Math.round((fiveStarCount / total) * 100) : 0;

	return { average, total, fiveStarPercent };
};

export const mockReviews: Review[] = [
	{
		id: "1",
		customerId: "c1",
		customerName: "John Smith",
		isAnonymous: false,
		rating: 5,
		reviewText:
			"Excellent service! My car looks brand new. The team was very professional and thorough. Will definitely use again!",
		date: "2024-01-20",
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
		service: "Basic Exterior Wash",
	},
];
