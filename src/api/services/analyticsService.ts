import apiClient from "../apiClient";

export enum AnalyticsApi {
	Users = "/analytics/users",
	Bookings = "/analytics/bookings",
	Partners = "/analytics/partners",
	Subscriptions = "/analytics/subscriptions",
}

export interface TimeSeriesData {
	date: string;
	value: number;
}

export interface MonthlyData {
	month: string;
	year: number;
	value: number;
}

export interface UserAnalytics {
	overview: {
		totalUsers: number;
		dailyActiveUsers: number;
		monthlyActiveUsers: number;
		retentionRate: number;
		newUsersToday: number;
		newUsersThisWeek: number;
		newUsersThisMonth: number;
	};
	userGrowth: MonthlyData[];
	dailyActiveUsersChart: TimeSeriesData[];
	registrationsByDay: TimeSeriesData[];
	registrationsByWeek: Array<{ date: string; value: number }>;
	registrationsByMonth: MonthlyData[];
	usersByType: {
		customers: number;
		partners: number;
	};
}

export interface PeakHourData {
	day: string;
	hour: string;
	value: number;
}

export interface ServiceData {
	name: string;
	bookings: number;
	revenue: number;
}

export interface BookingAnalytics {
	overview: {
		totalBookings: number;
		completedBookings: number;
		cancelledBookings: number;
		conversionRate: number;
		averageBookingValue: number;
		bookingsToday: number;
		bookingsThisWeek: number;
		bookingsThisMonth: number;
	};
	bookingTrend: MonthlyData[];
	peakHours: PeakHourData[];
	popularServices: ServiceData[];
	bookingsByStatus: {
		completed: number;
		cancelled: number;
		pending: number;
		inProgress: number;
	};
}

export interface TopPartner {
	id: string;
	businessName: string;
	totalBookings: number;
	totalRevenue: number;
	rating: number;
	location: string;
}

export interface PartnerAnalytics {
	overview: {
		totalPartners: number;
		activePartners: number;
		pendingPartners: number;
		suspendedPartners: number;
		averageRating: number;
		retentionRate: number;
		newPartnersThisMonth: number;
	};
	partnerGrowth: MonthlyData[];
	topByBookings: TopPartner[];
	topByRevenue: TopPartner[];
	topByRating: TopPartner[];
	partnersByStatus: {
		active: number;
		pending: number;
		suspended: number;
	};
	ratingDistribution: Array<{ rating: string; count: number }>;
}

export interface SubscriptionAnalytics {
	overview: {
		totalActive: number;
		basicSubscribers: number;
		premiumSubscribers: number;
		conversionRate: number;
		churnRate: number;
		monthlyRevenue: number;
		averageSubscriptionLength: number;
	};
	subscriptionTrend: MonthlyData[];
	revenueTrend: MonthlyData[];
	planDistribution: Array<{ plan: string; count: number; revenue: number }>;
	churnTrend: MonthlyData[];
	conversionFunnel: {
		visitors: number;
		signups: number;
		trials: number;
		subscribed: number;
	};
}

const getUserAnalytics = () =>
	apiClient.get<UserAnalytics>({ url: AnalyticsApi.Users });

const getBookingAnalytics = () =>
	apiClient.get<BookingAnalytics>({ url: AnalyticsApi.Bookings });

const getPartnerAnalytics = () =>
	apiClient.get<PartnerAnalytics>({ url: AnalyticsApi.Partners });

const getSubscriptionAnalytics = () =>
	apiClient.get<SubscriptionAnalytics>({ url: AnalyticsApi.Subscriptions });

export default {
	getUserAnalytics,
	getBookingAnalytics,
	getPartnerAnalytics,
	getSubscriptionAnalytics,
};
