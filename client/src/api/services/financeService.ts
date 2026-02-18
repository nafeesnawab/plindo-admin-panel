import apiClient from "../apiClient";

export enum FinanceApi {
	RevenueOverview = "/finance/revenue-overview",
	RevenueTrend = "/finance/revenue-trend",
	RevenueByPartner = "/finance/revenue-by-partner",
	Commissions = "/finance/commissions",
	Payouts = "/finance/payouts",
	Subscriptions = "/finance/subscriptions",
}

export interface RevenueStats {
	totalRevenue: number;
	customerCommission: number;
	partnerCommission: number;
	netRevenue: number;
	totalBookings: number;
	growth?: number;
}

export interface RevenueOverview {
	allTime: RevenueStats;
	thisMonth: RevenueStats;
	thisWeek: RevenueStats;
	today: RevenueStats;
}

export interface RevenueTrendItem {
	month: string;
	year: number;
	revenue: number;
	customerCommission: number;
	partnerCommission: number;
	bookings: number;
}

export interface PartnerRevenue {
	id: string;
	businessName: string;
	totalRevenue: number;
	totalBookings: number;
	commissionEarned: number;
}

export interface CommissionDay {
	date: string;
	bookings: number;
	grossRevenue: number;
	customerFees: number;
	partnerFees: number;
	totalCommission: number;
}

export interface CommissionsData {
	period: string;
	daily: CommissionDay[];
	totals: {
		bookings: number;
		grossRevenue: number;
		customerFees: number;
		partnerFees: number;
		totalCommission: number;
	};
}

export interface Payout {
	id: string;
	partner: {
		id: string;
		businessName: string;
		ownerName: string;
		bankAccount: string;
	};
	period: {
		start: string;
		end: string;
	};
	totalBookings: number;
	grossEarnings: number;
	commissionDeducted: number;
	netPayout: number;
	status: "pending" | "paid";
	paidAt: string | null;
	createdAt: string;
}

export interface PayoutsResponse {
	items: Payout[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	summary: {
		totalPending: number;
		totalPaid: number;
		pendingCount: number;
		paidCount: number;
	};
}

export interface SubscriptionPlan {
	name: string;
	price: number;
	subscribers: number;
	revenue: number;
	features: string[];
}

export interface SubscriptionTrendItem {
	month: string;
	year: number;
	basic: number;
	premium: number;
	churned: number;
	new: number;
}

export interface SubscriptionData {
	overview: {
		totalActive: number;
		basicSubscribers: number;
		premiumSubscribers: number;
		basicRevenue: number;
		premiumRevenue: number;
		totalMonthlyRevenue: number;
		churnRate: number;
		upcomingRenewals: number;
	};
	plans: SubscriptionPlan[];
	trend: SubscriptionTrendItem[];
}

const getRevenueOverview = () =>
	apiClient.get<RevenueOverview>({ url: FinanceApi.RevenueOverview });

const getRevenueTrend = () =>
	apiClient.get<RevenueTrendItem[]>({ url: FinanceApi.RevenueTrend });

const getRevenueByPartner = () =>
	apiClient.get<PartnerRevenue[]>({ url: FinanceApi.RevenueByPartner });

const getCommissions = (period: "week" | "month" | "year" = "month") =>
	apiClient.get<CommissionsData>({ url: FinanceApi.Commissions, params: { period } });

const getPayouts = (params?: { page?: number; limit?: number; status?: string }) =>
	apiClient.get<PayoutsResponse>({ url: FinanceApi.Payouts, params });

const markPayoutPaid = (id: string) =>
	apiClient.post({ url: `${FinanceApi.Payouts}/${id}/mark-paid` });

const getSubscriptionRevenue = () =>
	apiClient.get<SubscriptionData>({ url: FinanceApi.Subscriptions });

export default {
	getRevenueOverview,
	getRevenueTrend,
	getRevenueByPartner,
	getCommissions,
	getPayouts,
	markPayoutPaid,
	getSubscriptionRevenue,
};
