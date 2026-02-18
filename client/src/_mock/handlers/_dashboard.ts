import { faker } from "@faker-js/faker";
import { HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

export enum DashboardApi {
	Stats = "/dashboard/stats",
	BookingsTrend = "/dashboard/bookings-trend",
	RevenueTrend = "/dashboard/revenue-trend",
	UserGrowth = "/dashboard/user-growth",
	RecentBookings = "/dashboard/recent-bookings",
	RecentPartnerApplications = "/dashboard/recent-partner-applications",
	RecentUsers = "/dashboard/recent-users",
}

// Generate consistent mock data
const generateDailyData = (days: number, baseValue: number, variance: number) => {
	const data = [];
	const today = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		data.push({
			date: date.toISOString().split("T")[0],
			value: Math.floor(baseValue + (Math.random() - 0.5) * variance),
		});
	}
	return data;
};

const bookingStatuses = [
	"booked",
	"in_progress",
	"completed",
	"picked",
	"out_for_delivery",
	"delivered",
	"cancelled",
	"rescheduled",
] as const;
const partnerStatuses = ["pending", "approved", "rejected"] as const;

// Car wash service types
const carWashServices = [
	"Basic Wash",
	"Premium Wash",
	"Interior Cleaning",
	"Full Detail",
	"Express Wash",
	"Wax & Polish",
] as const;

// Car wash business name prefixes/suffixes
const businessPrefixes = ["Crystal", "Sparkle", "Diamond", "Premium", "Express", "Pro", "Elite", "Golden"];
const businessSuffixes = ["Car Wash", "Auto Spa", "Detailing", "Car Care", "Auto Clean"];

const generateBusinessName = () => {
	const prefix = faker.helpers.arrayElement(businessPrefixes);
	const suffix = faker.helpers.arrayElement(businessSuffixes);
	return `${prefix} ${suffix}`;
};

// Stats endpoint
export const getDashboardStats = http.get(`/api${DashboardApi.Stats}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			activeUsers: faker.number.int({ min: 8000, max: 15000 }),
			bookingsToday: {
				total: faker.number.int({ min: 150, max: 300 }),
				booked: faker.number.int({ min: 40, max: 80 }),
				inProgress: faker.number.int({ min: 30, max: 60 }),
				completed: faker.number.int({ min: 50, max: 100 }),
				delivered: faker.number.int({ min: 20, max: 40 }),
				cancelled: faker.number.int({ min: 5, max: 15 }),
			},
			revenueToday: faker.number.float({ min: 5000, max: 15000, fractionDigits: 2 }),
			pendingPartnerApplications: faker.number.int({ min: 5, max: 25 }),
		},
	});
});

// Bookings trend endpoint
export const getBookingsTrend = http.get(`/api${DashboardApi.BookingsTrend}`, ({ request }) => {
	const url = new URL(request.url);
	const days = Number.parseInt(url.searchParams.get("days") || "7");

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: generateDailyData(days, 200, 100),
	});
});

// Revenue trend endpoint
export const getRevenueTrend = http.get(`/api${DashboardApi.RevenueTrend}`, ({ request }) => {
	const url = new URL(request.url);
	const days = Number.parseInt(url.searchParams.get("days") || "7");

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: generateDailyData(days, 10000, 5000),
	});
});

// User growth endpoint
export const getUserGrowth = http.get(`/api${DashboardApi.UserGrowth}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: generateDailyData(30, 150, 80),
	});
});

// Recent bookings endpoint
export const getRecentBookings = http.get(`/api${DashboardApi.RecentBookings}`, () => {
	const bookings = Array.from({ length: 10 }).map(() => ({
		id: faker.string.uuid(),
		customerName: faker.person.fullName(),
		partnerName: faker.person.fullName(),
		service: faker.helpers.arrayElement(carWashServices),
		amount: faker.number.float({ min: 12, max: 45, fractionDigits: 2 }),
		status: faker.helpers.arrayElement(bookingStatuses),
		createdAt: faker.date.recent({ days: 1 }).toISOString(),
	}));

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: bookings,
	});
});

// Recent partner applications endpoint
export const getRecentPartnerApplications = http.get(`/api${DashboardApi.RecentPartnerApplications}`, () => {
	const applications = Array.from({ length: 5 }).map(() => ({
		id: faker.string.uuid(),
		name: faker.person.fullName(),
		businessName: generateBusinessName(),
		email: faker.internet.email(),
		phone: faker.phone.number(),
		location: `${faker.location.city()}, Cyprus`,
		status: faker.helpers.arrayElement(partnerStatuses),
		appliedAt: faker.date.recent({ days: 7 }).toISOString(),
	}));

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: applications,
	});
});

// Recent user registrations endpoint
export const getRecentUsers = http.get(`/api${DashboardApi.RecentUsers}`, () => {
	const users = Array.from({ length: 5 }).map(() => ({
		id: faker.string.uuid(),
		name: faker.person.fullName(),
		email: faker.internet.email(),
		avatar: faker.image.avatarGitHub(),
		registeredAt: faker.date.recent({ days: 3 }).toISOString(),
	}));

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: users,
	});
});
