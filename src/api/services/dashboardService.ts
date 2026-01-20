import apiClient from "../apiClient";

export enum DashboardApi {
	Stats = "/dashboard/stats",
	BookingsTrend = "/dashboard/bookings-trend",
	RevenueTrend = "/dashboard/revenue-trend",
	UserGrowth = "/dashboard/user-growth",
	RecentBookings = "/dashboard/recent-bookings",
	RecentPartnerApplications = "/dashboard/recent-partner-applications",
	RecentUsers = "/dashboard/recent-users",
}

export interface DashboardStats {
	activeUsers: number;
	bookingsToday: {
		total: number;
		pending: number;
		confirmed: number;
		inProgress: number;
		completed: number;
		cancelled: number;
	};
	revenueToday: number;
	pendingPartnerApplications: number;
}

export interface TrendDataPoint {
	date: string;
	value: number;
}

export interface RecentBooking {
	id: string;
	customerName: string;
	partnerName: string;
	service: string;
	amount: number;
	status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
	createdAt: string;
}

export interface PartnerApplication {
	id: string;
	name: string;
	businessName: string;
	email: string;
	phone: string;
	location: string;
	status: "pending" | "approved" | "rejected";
	appliedAt: string;
}

export interface RecentUser {
	id: string;
	name: string;
	email: string;
	avatar: string;
	registeredAt: string;
}

const getStats = () => apiClient.get<DashboardStats>({ url: DashboardApi.Stats });

const getBookingsTrend = (days = 7) =>
	apiClient.get<TrendDataPoint[]>({ url: DashboardApi.BookingsTrend, params: { days } });

const getRevenueTrend = (days = 7) =>
	apiClient.get<TrendDataPoint[]>({ url: DashboardApi.RevenueTrend, params: { days } });

const getUserGrowth = () => apiClient.get<TrendDataPoint[]>({ url: DashboardApi.UserGrowth });

const getRecentBookings = () => apiClient.get<RecentBooking[]>({ url: DashboardApi.RecentBookings });

const getRecentPartnerApplications = () =>
	apiClient.get<PartnerApplication[]>({ url: DashboardApi.RecentPartnerApplications });

const getRecentUsers = () => apiClient.get<RecentUser[]>({ url: DashboardApi.RecentUsers });

export default {
	getStats,
	getBookingsTrend,
	getRevenueTrend,
	getUserGrowth,
	getRecentBookings,
	getRecentPartnerApplications,
	getRecentUsers,
};
