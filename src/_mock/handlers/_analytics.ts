import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

export enum AnalyticsApi {
	UserAnalytics = "/analytics/users",
	BookingAnalytics = "/analytics/bookings",
	PartnerAnalytics = "/analytics/partners",
	SubscriptionAnalytics = "/analytics/subscriptions",
}

const generateTimeSeriesData = (days: number, minVal: number, maxVal: number) => {
	const data = [];
	const now = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		data.push({
			date: date.toISOString().split("T")[0],
			value: faker.number.int({ min: minVal, max: maxVal }),
		});
	}
	return data;
};

const generateMonthlyData = (months: number, minVal: number, maxVal: number) => {
	const data = [];
	const now = new Date();
	for (let i = months - 1; i >= 0; i--) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
		data.push({
			month: date.toLocaleString("default", { month: "short" }),
			year: date.getFullYear(),
			value: faker.number.int({ min: minVal, max: maxVal }),
		});
	}
	return data;
};

export const getUserAnalytics = http.get(`/api${AnalyticsApi.UserAnalytics}`, () => {
	const totalUsers = faker.number.int({ min: 5000, max: 15000 });
	const dailyActiveUsers = faker.number.int({ min: 500, max: 2000 });
	const monthlyActiveUsers = faker.number.int({ min: 3000, max: 8000 });

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			overview: {
				totalUsers,
				dailyActiveUsers,
				monthlyActiveUsers,
				retentionRate: faker.number.float({ min: 65, max: 85, fractionDigits: 1 }),
				newUsersToday: faker.number.int({ min: 20, max: 100 }),
				newUsersThisWeek: faker.number.int({ min: 150, max: 500 }),
				newUsersThisMonth: faker.number.int({ min: 500, max: 2000 }),
			},
			userGrowth: generateMonthlyData(12, 200, 800),
			dailyActiveUsersChart: generateTimeSeriesData(30, 400, 2000),
			registrationsByDay: generateTimeSeriesData(7, 20, 100),
			registrationsByWeek: generateTimeSeriesData(12, 100, 500).map((d, i) => ({
				...d,
				date: `Week ${i + 1}`,
			})),
			registrationsByMonth: generateMonthlyData(6, 400, 1500),
			usersByType: {
				customers: faker.number.int({ min: 4000, max: 12000 }),
				partners: faker.number.int({ min: 100, max: 500 }),
			},
		},
	});
});

export const getBookingAnalytics = http.get(`/api${AnalyticsApi.BookingAnalytics}`, () => {
	const totalBookings = faker.number.int({ min: 20000, max: 80000 });

	const peakHours = [];
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	for (let hour = 8; hour <= 20; hour++) {
		for (const day of days) {
			peakHours.push({
				day,
				hour: `${hour}:00`,
				value: faker.number.int({
					min: day === "Sat" || day === "Sun" ? 15 : 5,
					max: day === "Sat" || day === "Sun" ? 50 : 30,
				}),
			});
		}
	}

	const services = [
		{ name: "Basic Wash", bookings: faker.number.int({ min: 5000, max: 15000 }), revenue: 0 },
		{ name: "Premium Wash", bookings: faker.number.int({ min: 3000, max: 10000 }), revenue: 0 },
		{ name: "Interior Cleaning", bookings: faker.number.int({ min: 2000, max: 8000 }), revenue: 0 },
		{ name: "Full Detail", bookings: faker.number.int({ min: 1000, max: 5000 }), revenue: 0 },
		{ name: "Express Wash", bookings: faker.number.int({ min: 4000, max: 12000 }), revenue: 0 },
		{ name: "Wax & Polish", bookings: faker.number.int({ min: 1500, max: 6000 }), revenue: 0 },
	];

	const prices = {
		"Basic Wash": 12,
		"Premium Wash": 20,
		"Interior Cleaning": 25,
		"Full Detail": 45,
		"Express Wash": 8,
		"Wax & Polish": 35,
	};
	services.forEach((s) => {
		s.revenue = s.bookings * (prices[s.name as keyof typeof prices] || 20);
	});

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			overview: {
				totalBookings,
				completedBookings: Math.floor(totalBookings * 0.85),
				cancelledBookings: Math.floor(totalBookings * 0.08),
				conversionRate: faker.number.float({ min: 15, max: 35, fractionDigits: 1 }),
				averageBookingValue: faker.number.float({ min: 18, max: 28, fractionDigits: 2 }),
				bookingsToday: faker.number.int({ min: 50, max: 200 }),
				bookingsThisWeek: faker.number.int({ min: 400, max: 1500 }),
				bookingsThisMonth: faker.number.int({ min: 1500, max: 6000 }),
			},
			bookingTrend: generateMonthlyData(12, 1000, 5000),
			peakHours,
			popularServices: services.sort((a, b) => b.bookings - a.bookings),
			bookingsByStatus: {
				completed: Math.floor(totalBookings * 0.45),
				cancelled: Math.floor(totalBookings * 0.08),
				booked: Math.floor(totalBookings * 0.15),
				inProgress: Math.floor(totalBookings * 0.07),
				delivered: Math.floor(totalBookings * 0.25),
			},
		},
	});
});

export const getPartnerAnalytics = http.get(`/api${AnalyticsApi.PartnerAnalytics}`, () => {
	const generatePartnerName = () => {
		const prefixes = ["Crystal", "Sparkle", "Diamond", "Premium", "Express", "Pro", "Elite", "Golden"];
		const suffixes = ["Car Wash", "Auto Spa", "Detailing", "Car Care"];
		return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(suffixes)}`;
	};

	const topPartners = Array.from({ length: 10 }).map(() => ({
		id: faker.string.uuid(),
		businessName: generatePartnerName(),
		totalBookings: faker.number.int({ min: 200, max: 2000 }),
		totalRevenue: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
		rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
		location: `${faker.helpers.arrayElement(["Nicosia", "Limassol", "Larnaca", "Paphos"])}, Cyprus`,
	}));

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			overview: {
				totalPartners: faker.number.int({ min: 150, max: 400 }),
				activePartners: faker.number.int({ min: 120, max: 350 }),
				pendingPartners: faker.number.int({ min: 10, max: 50 }),
				suspendedPartners: faker.number.int({ min: 5, max: 20 }),
				averageRating: faker.number.float({ min: 4.2, max: 4.8, fractionDigits: 1 }),
				retentionRate: faker.number.float({ min: 85, max: 95, fractionDigits: 1 }),
				newPartnersThisMonth: faker.number.int({ min: 5, max: 25 }),
			},
			partnerGrowth: generateMonthlyData(12, 5, 25),
			topByBookings: [...topPartners].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5),
			topByRevenue: [...topPartners].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
			topByRating: [...topPartners].sort((a, b) => b.rating - a.rating).slice(0, 5),
			partnersByStatus: {
				active: faker.number.int({ min: 120, max: 350 }),
				pending: faker.number.int({ min: 10, max: 50 }),
				suspended: faker.number.int({ min: 5, max: 20 }),
			},
			ratingDistribution: [
				{ rating: "5 stars", count: faker.number.int({ min: 50, max: 150 }) },
				{ rating: "4 stars", count: faker.number.int({ min: 40, max: 100 }) },
				{ rating: "3 stars", count: faker.number.int({ min: 20, max: 50 }) },
				{ rating: "2 stars", count: faker.number.int({ min: 5, max: 20 }) },
				{ rating: "1 star", count: faker.number.int({ min: 1, max: 10 }) },
			],
		},
	});
});

export const getSubscriptionAnalytics = http.get(`/api${AnalyticsApi.SubscriptionAnalytics}`, () => {
	const totalActive = faker.number.int({ min: 800, max: 2000 });
	const basicSubscribers = Math.floor(totalActive * 0.7);
	const premiumSubscribers = totalActive - basicSubscribers;

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			overview: {
				totalActive,
				basicSubscribers,
				premiumSubscribers,
				conversionRate: faker.number.float({ min: 8, max: 18, fractionDigits: 1 }),
				churnRate: faker.number.float({ min: 3, max: 8, fractionDigits: 1 }),
				monthlyRevenue: basicSubscribers * 15 + premiumSubscribers * 28,
				averageSubscriptionLength: faker.number.float({ min: 4, max: 12, fractionDigits: 1 }),
			},
			subscriptionTrend: generateMonthlyData(12, 50, 200),
			revenueTrend: generateMonthlyData(12, 10000, 40000),
			planDistribution: [
				{ plan: "Basic", count: basicSubscribers, revenue: basicSubscribers * 15 },
				{ plan: "Premium", count: premiumSubscribers, revenue: premiumSubscribers * 28 },
			],
			churnTrend: generateMonthlyData(6, 20, 80),
			conversionFunnel: {
				visitors: faker.number.int({ min: 10000, max: 30000 }),
				signups: faker.number.int({ min: 3000, max: 10000 }),
				trials: faker.number.int({ min: 1000, max: 4000 }),
				subscribed: totalActive,
			},
		},
	});
});

export const analyticsHandlers = [getUserAnalytics, getBookingAnalytics, getPartnerAnalytics, getSubscriptionAnalytics];
