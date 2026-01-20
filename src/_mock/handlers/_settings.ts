import { ResultStatus } from "@/types/enum";
import { http, HttpResponse } from "msw";

export enum SettingsApi {
	Commission = "/settings/commission",
	BookingRules = "/settings/booking-rules",
	SubscriptionPlans = "/settings/subscription-plans",
	Payment = "/settings/payment",
	NotificationSettings = "/settings/notifications",
	NotificationTemplates = "/settings/notification-templates",
}

let commissionSettings = {
	customerCommission: 10,
	partnerCommission: 10,
	updatedAt: new Date().toISOString(),
};

let bookingRules = {
	minAdvanceBookingHours: 2,
	maxAdvanceBookingDays: 30,
	cancellationWindowHours: 2,
	updatedAt: new Date().toISOString(),
};

let subscriptionPlans = {
	basic: {
		id: "basic",
		name: "Basic Plan",
		price: 15,
		washesIncluded: 4,
		features: ["4 washes per month", "Basic car wash only", "Email support"],
		enabled: true,
	},
	premium: {
		id: "premium",
		name: "Premium Plan",
		price: 28,
		washesIncluded: 8,
		features: ["8 washes per month", "All wash types", "Priority booking", "24/7 support", "Free interior cleaning"],
		enabled: true,
	},
	updatedAt: new Date().toISOString(),
};

let paymentSettings = {
	stripeConnected: true,
	stripeAccountId: "acct_1234567890",
	paymentMethods: {
		cards: true,
		applePay: true,
		googlePay: true,
	},
	payoutSchedule: "weekly" as "weekly" | "monthly",
	updatedAt: new Date().toISOString(),
};

let notificationSettings = {
	types: {
		bookingConfirmation: true,
		bookingReminder: true,
		bookingCancellation: true,
		paymentSuccess: true,
		paymentFailed: true,
		promotions: true,
		systemUpdates: true,
	},
	updatedAt: new Date().toISOString(),
};

let notificationTemplates = [
	{
		id: "booking_confirmation",
		name: "Booking Confirmation",
		subject: "Your booking is confirmed!",
		body: "Hi {{customer_name}}, your booking at {{partner_name}} on {{booking_date}} at {{booking_time}} has been confirmed.",
		variables: ["customer_name", "partner_name", "booking_date", "booking_time"],
	},
	{
		id: "booking_reminder",
		name: "Booking Reminder",
		subject: "Reminder: Upcoming booking",
		body: "Hi {{customer_name}}, this is a reminder for your booking at {{partner_name}} tomorrow at {{booking_time}}.",
		variables: ["customer_name", "partner_name", "booking_time"],
	},
	{
		id: "booking_cancellation",
		name: "Booking Cancellation",
		subject: "Booking cancelled",
		body: "Hi {{customer_name}}, your booking at {{partner_name}} on {{booking_date}} has been cancelled.",
		variables: ["customer_name", "partner_name", "booking_date"],
	},
	{
		id: "payment_success",
		name: "Payment Success",
		subject: "Payment received",
		body: "Hi {{customer_name}}, we've received your payment of €{{amount}} for {{service_name}}.",
		variables: ["customer_name", "amount", "service_name"],
	},
	{
		id: "payment_failed",
		name: "Payment Failed",
		subject: "Payment failed",
		body: "Hi {{customer_name}}, your payment of €{{amount}} has failed. Please update your payment method.",
		variables: ["customer_name", "amount"],
	},
];

export const getCommissionSettings = http.get(`/api${SettingsApi.Commission}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: commissionSettings,
	});
});

export const updateCommissionSettings = http.put(`/api${SettingsApi.Commission}`, async ({ request }) => {
	const body = (await request.json()) as Partial<typeof commissionSettings>;
	commissionSettings = { ...commissionSettings, ...body, updatedAt: new Date().toISOString() };
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Commission settings updated",
		data: commissionSettings,
	});
});

export const getBookingRules = http.get(`/api${SettingsApi.BookingRules}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: bookingRules,
	});
});

export const updateBookingRules = http.put(`/api${SettingsApi.BookingRules}`, async ({ request }) => {
	const body = (await request.json()) as Partial<typeof bookingRules>;
	bookingRules = { ...bookingRules, ...body, updatedAt: new Date().toISOString() };
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Booking rules updated",
		data: bookingRules,
	});
});

export const getSubscriptionPlans = http.get(`/api${SettingsApi.SubscriptionPlans}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: subscriptionPlans,
	});
});

export const updateSubscriptionPlans = http.put(`/api${SettingsApi.SubscriptionPlans}`, async ({ request }) => {
	const body = (await request.json()) as Partial<typeof subscriptionPlans>;
	subscriptionPlans = { ...subscriptionPlans, ...body, updatedAt: new Date().toISOString() };
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Subscription plans updated",
		data: subscriptionPlans,
	});
});

export const getPaymentSettings = http.get(`/api${SettingsApi.Payment}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: paymentSettings,
	});
});

export const updatePaymentSettings = http.put(`/api${SettingsApi.Payment}`, async ({ request }) => {
	const body = (await request.json()) as Partial<typeof paymentSettings>;
	paymentSettings = { ...paymentSettings, ...body, updatedAt: new Date().toISOString() };
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Payment settings updated",
		data: paymentSettings,
	});
});

export const getNotificationSettings = http.get(`/api${SettingsApi.NotificationSettings}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: notificationSettings,
	});
});

export const updateNotificationSettings = http.put(`/api${SettingsApi.NotificationSettings}`, async ({ request }) => {
	const body = (await request.json()) as Partial<typeof notificationSettings>;
	notificationSettings = { ...notificationSettings, ...body, updatedAt: new Date().toISOString() };
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Notification settings updated",
		data: notificationSettings,
	});
});

export const getNotificationTemplates = http.get(`/api${SettingsApi.NotificationTemplates}`, () => {
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		data: notificationTemplates,
	});
});

export const updateNotificationTemplate = http.put(`/api${SettingsApi.NotificationTemplates}/:id`, async ({ params, request }) => {
	const { id } = params;
	const body = (await request.json()) as { subject: string; body: string };
	const index = notificationTemplates.findIndex((t) => t.id === id);
	if (index !== -1) {
		notificationTemplates[index] = { ...notificationTemplates[index], ...body };
	}
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Template updated",
		data: notificationTemplates[index],
	});
});

export const settingsHandlers = [
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
];
