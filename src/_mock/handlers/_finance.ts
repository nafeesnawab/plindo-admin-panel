import { ResultStatus } from "@/types/enum";
import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

export enum FinanceApi {
	RevenueOverview = "/finance/revenue-overview",
	RevenueTrend = "/finance/revenue-trend",
	RevenueByPartner = "/finance/revenue-by-partner",
	Commissions = "/finance/commissions",
	Payouts = "/finance/payouts",
	MarkPaid = "/finance/payouts/:id/mark-paid",
	Subscriptions = "/finance/subscriptions",
}

const generatePartnerName = () => {
	const prefixes = ["Crystal", "Sparkle", "Diamond", "Premium", "Express", "Pro", "Elite", "Golden"];
	const suffixes = ["Car Wash", "Auto Spa", "Detailing", "Car Care"];
	return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(suffixes)}`;
};

// Revenue Overview
export const getRevenueOverview = http.get(`/api${FinanceApi.RevenueOverview}`, () => {
	const allTimeRevenue = faker.number.float({ min: 150000, max: 500000, fractionDigits: 2 });
	const thisMonthRevenue = faker.number.float({ min: 15000, max: 50000, fractionDigits: 2 });
	const thisWeekRevenue = faker.number.float({ min: 3000, max: 12000, fractionDigits: 2 });
	const todayRevenue = faker.number.float({ min: 500, max: 2000, fractionDigits: 2 });

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			allTime: {
				totalRevenue: allTimeRevenue,
				customerCommission: +(allTimeRevenue * 0.1).toFixed(2),
				partnerCommission: +(allTimeRevenue * 0.1).toFixed(2),
				netRevenue: +(allTimeRevenue * 0.2).toFixed(2),
				totalBookings: faker.number.int({ min: 5000, max: 20000 }),
			},
			thisMonth: {
				totalRevenue: thisMonthRevenue,
				customerCommission: +(thisMonthRevenue * 0.1).toFixed(2),
				partnerCommission: +(thisMonthRevenue * 0.1).toFixed(2),
				netRevenue: +(thisMonthRevenue * 0.2).toFixed(2),
				totalBookings: faker.number.int({ min: 500, max: 2000 }),
				growth: faker.number.float({ min: -10, max: 25, fractionDigits: 1 }),
			},
			thisWeek: {
				totalRevenue: thisWeekRevenue,
				customerCommission: +(thisWeekRevenue * 0.1).toFixed(2),
				partnerCommission: +(thisWeekRevenue * 0.1).toFixed(2),
				netRevenue: +(thisWeekRevenue * 0.2).toFixed(2),
				totalBookings: faker.number.int({ min: 100, max: 500 }),
				growth: faker.number.float({ min: -15, max: 30, fractionDigits: 1 }),
			},
			today: {
				totalRevenue: todayRevenue,
				customerCommission: +(todayRevenue * 0.1).toFixed(2),
				partnerCommission: +(todayRevenue * 0.1).toFixed(2),
				netRevenue: +(todayRevenue * 0.2).toFixed(2),
				totalBookings: faker.number.int({ min: 20, max: 100 }),
				growth: faker.number.float({ min: -20, max: 40, fractionDigits: 1 }),
			},
		},
	});
});

// Revenue Trend (last 12 months)
export const getRevenueTrend = http.get(`/api${FinanceApi.RevenueTrend}`, () => {
	const months = [];
	const now = new Date();
	
	for (let i = 11; i >= 0; i--) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const revenue = faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 });
		months.push({
			month: date.toLocaleString("default", { month: "short" }),
			year: date.getFullYear(),
			revenue,
			customerCommission: +(revenue * 0.1).toFixed(2),
			partnerCommission: +(revenue * 0.1).toFixed(2),
			bookings: faker.number.int({ min: 400, max: 2000 }),
		});
	}

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: months,
	});
});

// Revenue by Partner (top 10)
export const getRevenueByPartner = http.get(`/api${FinanceApi.RevenueByPartner}`, () => {
	const partners = Array.from({ length: 10 }).map(() => ({
		id: faker.string.uuid(),
		businessName: generatePartnerName(),
		totalRevenue: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
		totalBookings: faker.number.int({ min: 100, max: 2000 }),
		commissionEarned: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
	})).sort((a, b) => b.totalRevenue - a.totalRevenue);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: partners,
	});
});

// Commissions breakdown
export const getCommissions = http.get(`/api${FinanceApi.Commissions}`, ({ request }) => {
	const url = new URL(request.url);
	const period = url.searchParams.get("period") || "month";
	
	let days = 30;
	if (period === "week") days = 7;
	if (period === "year") days = 365;

	const dailyData = Array.from({ length: Math.min(days, 30) }).map((_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const bookings = faker.number.int({ min: 20, max: 100 });
		const avgAmount = faker.number.float({ min: 15, max: 35 });
		const grossRevenue = +(bookings * avgAmount).toFixed(2);
		
		return {
			date: date.toISOString().split("T")[0],
			bookings,
			grossRevenue,
			customerFees: +(grossRevenue * 0.1).toFixed(2),
			partnerFees: +(grossRevenue * 0.1).toFixed(2),
			totalCommission: +(grossRevenue * 0.2).toFixed(2),
		};
	}).reverse();

	const totals = dailyData.reduce(
		(acc, day) => ({
			bookings: acc.bookings + day.bookings,
			grossRevenue: +(acc.grossRevenue + day.grossRevenue).toFixed(2),
			customerFees: +(acc.customerFees + day.customerFees).toFixed(2),
			partnerFees: +(acc.partnerFees + day.partnerFees).toFixed(2),
			totalCommission: +(acc.totalCommission + day.totalCommission).toFixed(2),
		}),
		{ bookings: 0, grossRevenue: 0, customerFees: 0, partnerFees: 0, totalCommission: 0 }
	);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			period,
			daily: dailyData,
			totals,
		},
	});
});

// Partner Payouts
export const getPayouts = http.get(`/api${FinanceApi.Payouts}`, ({ request }) => {
	const url = new URL(request.url);
	const page = Number.parseInt(url.searchParams.get("page") || "1");
	const limit = Number.parseInt(url.searchParams.get("limit") || "10");
	const status = url.searchParams.get("status");

	const allPayouts = Array.from({ length: 35 }).map(() => {
		const grossEarnings = faker.number.float({ min: 500, max: 5000, fractionDigits: 2 });
		const commission = +(grossEarnings * 0.1).toFixed(2);
		const payoutStatus = faker.helpers.arrayElement(["pending", "paid"] as const);
		
		const periodStart = faker.date.recent({ days: 14 });
		const periodEnd = new Date(periodStart);
		periodEnd.setDate(periodEnd.getDate() + 7);

		return {
			id: faker.string.uuid(),
			partner: {
				id: faker.string.uuid(),
				businessName: generatePartnerName(),
				ownerName: faker.person.fullName(),
				bankAccount: `****${faker.finance.accountNumber(4)}`,
			},
			period: {
				start: periodStart.toISOString(),
				end: periodEnd.toISOString(),
			},
			totalBookings: faker.number.int({ min: 20, max: 200 }),
			grossEarnings,
			commissionDeducted: commission,
			netPayout: +(grossEarnings - commission).toFixed(2),
			status: payoutStatus,
			paidAt: payoutStatus === "paid" ? faker.date.recent({ days: 3 }).toISOString() : null,
			createdAt: faker.date.recent({ days: 7 }).toISOString(),
		};
	});

	let filtered = [...allPayouts];
	if (status && status !== "all") {
		filtered = filtered.filter((p) => p.status === status);
	}

	const start = (page - 1) * limit;
	const end = start + limit;

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			items: filtered.slice(start, end),
			total: filtered.length,
			page,
			limit,
			totalPages: Math.ceil(filtered.length / limit),
			summary: {
				totalPending: allPayouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.netPayout, 0),
				totalPaid: allPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.netPayout, 0),
				pendingCount: allPayouts.filter((p) => p.status === "pending").length,
				paidCount: allPayouts.filter((p) => p.status === "paid").length,
			},
		},
	});
});

// Mark payout as paid
export const markPayoutPaid = http.post(`/api/finance/payouts/:id/mark-paid`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Payout marked as paid",
	});
});

// Subscription Revenue
export const getSubscriptionRevenue = http.get(`/api${FinanceApi.Subscriptions}`, () => {
	const basicSubscribers = faker.number.int({ min: 200, max: 800 });
	const premiumSubscribers = faker.number.int({ min: 50, max: 300 });
	const basicPrice = 15;
	const premiumPrice = 28;

	const monthlyData = Array.from({ length: 6 }).map((_, i) => {
		const date = new Date();
		date.setMonth(date.getMonth() - i);
		return {
			month: date.toLocaleString("default", { month: "short" }),
			year: date.getFullYear(),
			basic: faker.number.int({ min: 150, max: 800 }),
			premium: faker.number.int({ min: 30, max: 300 }),
			churned: faker.number.int({ min: 5, max: 50 }),
			new: faker.number.int({ min: 20, max: 100 }),
		};
	}).reverse();

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: {
			overview: {
				totalActive: basicSubscribers + premiumSubscribers,
				basicSubscribers,
				premiumSubscribers,
				basicRevenue: basicSubscribers * basicPrice,
				premiumRevenue: premiumSubscribers * premiumPrice,
				totalMonthlyRevenue: basicSubscribers * basicPrice + premiumSubscribers * premiumPrice,
				churnRate: faker.number.float({ min: 2, max: 8, fractionDigits: 1 }),
				upcomingRenewals: faker.number.int({ min: 50, max: 200 }),
			},
			plans: [
				{
					name: "Basic",
					price: basicPrice,
					subscribers: basicSubscribers,
					revenue: basicSubscribers * basicPrice,
					features: ["4 washes/month", "Basic services only", "Standard support"],
				},
				{
					name: "Premium",
					price: premiumPrice,
					subscribers: premiumSubscribers,
					revenue: premiumSubscribers * premiumPrice,
					features: ["8 washes/month", "All services", "Priority support", "Free upgrades"],
				},
			],
			trend: monthlyData,
		},
	});
});

export const financeHandlers = [
	getRevenueOverview,
	getRevenueTrend,
	getRevenueByPartner,
	getCommissions,
	getPayouts,
	markPayoutPaid,
	getSubscriptionRevenue,
];
