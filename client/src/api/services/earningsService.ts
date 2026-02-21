import apiClient from "../apiClient";

export enum EarningsApi {
	Overview = "/partner/earnings/overview",
	Transactions = "/partner/earnings/transactions",
	Payouts = "/partner/earnings/payouts",
	Chart = "/partner/earnings/chart",
}

export interface EarningsOverview {
	total: number;
	thisMonth: number;
	thisWeek: number;
	today: number;
	grossRevenue: number;
	commission: number;
	netEarnings: number;
	pendingPayout: number;
	nextPayoutDate: string;
}

export interface Transaction {
	id: string;
	date: string;
	bookingId: string;
	customer: string;
	service: string;
	grossAmount: number;
	commission: number;
	netAmount: number;
}

export interface Payout {
	id: string;
	payoutDate: string;
	period: string;
	totalBookings: number;
	grossEarnings: number;
	commission: number;
	netAmount: number;
	status: "completed" | "pending" | "processing";
}

export interface TransactionsPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface TransactionsResponse {
	transactions: Transaction[];
	pagination: TransactionsPagination;
}

export interface PayoutsResponse {
	payouts: Payout[];
}

export interface ChartData {
	labels: string[];
	values: number[];
}

export type ChartPeriod = "day" | "week" | "month" | "year";

const getOverview = () =>
	apiClient.get<EarningsOverview>({ url: EarningsApi.Overview });

const getTransactions = (params?: { page?: number; limit?: number }) =>
	apiClient.get<TransactionsResponse>({ url: EarningsApi.Transactions, params });

const getPayouts = () =>
	apiClient.get<PayoutsResponse>({ url: EarningsApi.Payouts });

const getChart = (period: ChartPeriod = "month") =>
	apiClient.get<ChartData>({ url: EarningsApi.Chart, params: { period } });

export default {
	getOverview,
	getTransactions,
	getPayouts,
	getChart,
};
