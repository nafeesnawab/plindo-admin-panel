import apiClient from "../apiClient";

export enum SettingsApi {
	Commission = "/settings/commission",
	BookingRules = "/settings/booking-rules",
	SubscriptionPlans = "/settings/subscription-plans",
	Payment = "/settings/payment",
	NotificationSettings = "/settings/notifications",
	NotificationTemplates = "/settings/notification-templates",
}

export interface CommissionSettings {
	customerCommission: number;
	partnerCommission: number;
	updatedAt: string;
}

export interface BookingRules {
	minAdvanceBookingHours: number;
	maxAdvanceBookingDays: number;
	cancellationWindowHours: number;
	updatedAt: string;
}

export interface SubscriptionPlan {
	id: string;
	name: string;
	price: number;
	washesIncluded: number;
	features: string[];
	enabled: boolean;
}

export interface SubscriptionPlans {
	basic: SubscriptionPlan;
	premium: SubscriptionPlan;
	updatedAt: string;
}

export interface PaymentSettings {
	stripeConnected: boolean;
	stripeAccountId: string;
	paymentMethods: {
		cards: boolean;
		applePay: boolean;
		googlePay: boolean;
	};
	payoutSchedule: "weekly" | "monthly";
	updatedAt: string;
}

export interface NotificationTypes {
	bookingConfirmation: boolean;
	bookingReminder: boolean;
	bookingCancellation: boolean;
	paymentSuccess: boolean;
	paymentFailed: boolean;
	promotions: boolean;
	systemUpdates: boolean;
}

export interface NotificationSettings {
	types: NotificationTypes;
	updatedAt: string;
}

export interface NotificationTemplate {
	id: string;
	name: string;
	subject: string;
	body: string;
	variables: string[];
}

const getCommissionSettings = () =>
	apiClient.get<CommissionSettings>({ url: SettingsApi.Commission });

const updateCommissionSettings = (data: Partial<CommissionSettings>) =>
	apiClient.put<CommissionSettings>({ url: SettingsApi.Commission, data });

const getBookingRules = () =>
	apiClient.get<BookingRules>({ url: SettingsApi.BookingRules });

const updateBookingRules = (data: Partial<BookingRules>) =>
	apiClient.put<BookingRules>({ url: SettingsApi.BookingRules, data });

const getSubscriptionPlans = () =>
	apiClient.get<SubscriptionPlans>({ url: SettingsApi.SubscriptionPlans });

const updateSubscriptionPlans = (data: Partial<SubscriptionPlans>) =>
	apiClient.put<SubscriptionPlans>({ url: SettingsApi.SubscriptionPlans, data });

const getPaymentSettings = () =>
	apiClient.get<PaymentSettings>({ url: SettingsApi.Payment });

const updatePaymentSettings = (data: Partial<PaymentSettings>) =>
	apiClient.put<PaymentSettings>({ url: SettingsApi.Payment, data });

const getNotificationSettings = () =>
	apiClient.get<NotificationSettings>({ url: SettingsApi.NotificationSettings });

const updateNotificationSettings = (data: Partial<NotificationSettings>) =>
	apiClient.put<NotificationSettings>({ url: SettingsApi.NotificationSettings, data });

const getNotificationTemplates = () =>
	apiClient.get<NotificationTemplate[]>({ url: SettingsApi.NotificationTemplates });

const updateNotificationTemplate = (id: string, data: { subject: string; body: string }) =>
	apiClient.put<NotificationTemplate>({ url: `${SettingsApi.NotificationTemplates}/${id}`, data });

export default {
	getCommissionSettings,
	updateCommissionSettings,
	getBookingRules,
	updateBookingRules,
	getSubscriptionPlans,
	updateSubscriptionPlans,
	getPaymentSettings,
	updatePaymentSettings,
	getNotificationSettings,
	updateNotificationSettings,
	getNotificationTemplates,
	updateNotificationTemplate,
};
