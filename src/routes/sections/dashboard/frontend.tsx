import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export function getFrontendDashboardRoutes(): RouteObject[] {
	const frontendDashboardRoutes: RouteObject[] = [
		// Dashboard
		{ path: "dashboard", element: Component("/pages/dashboard") },

		// Partner Management
		{
			path: "partners",
			children: [
				{ index: true, element: <Navigate to="pending" replace /> },
				{ path: "pending", element: Component("/pages/partners/pending") },
				{ path: "active", element: Component("/pages/partners/active") },
				{ path: "suspended", element: Component("/pages/partners/suspended") },
				{ path: ":id", element: Component("/pages/partners/details") },
			],
		},

		// User Management (Customers)
		{
			path: "customers",
			children: [
				{ index: true, element: Component("/pages/customers") },
				{ path: ":id", element: Component("/pages/customers/details") },
			],
		},

		// Booking Management
		{
			path: "bookings",
			children: [
				{ index: true, element: Component("/pages/bookings") },
				{ path: "disputes", element: Component("/pages/bookings/disputes") },
				{ path: ":id", element: Component("/pages/bookings/details") },
			],
		},

		// Financial Reports
		{
			path: "finance",
			children: [
				{ index: true, element: Component("/pages/finance") },
				{ path: "commissions", element: Component("/pages/finance/commissions") },
				{ path: "payouts", element: Component("/pages/finance/payouts") },
				{ path: "subscriptions", element: Component("/pages/finance/subscriptions") },
			],
		},

		// Notifications
		{
			path: "notifications",
			children: [
				{ index: true, element: <Navigate to="send" replace /> },
				{ path: "send", element: Component("/pages/notifications/send") },
				{ path: "history", element: Component("/pages/notifications/history") },
			],
		},

		// Analytics
		{
			path: "analytics",
			children: [
				{ index: true, element: <Navigate to="users" replace /> },
				{ path: "users", element: Component("/pages/analytics/users") },
				{ path: "bookings", element: Component("/pages/analytics/bookings") },
				{ path: "partners", element: Component("/pages/analytics/partners") },
				{ path: "subscriptions", element: Component("/pages/analytics/subscriptions") },
			],
		},

		// Platform Settings
		{
			path: "settings",
			children: [
				{ index: true, element: <Navigate to="commission" replace /> },
				{ path: "commission", element: Component("/pages/settings/commission") },
				{ path: "booking-rules", element: Component("/pages/settings/booking-rules") },
				{ path: "subscription-plans", element: Component("/pages/settings/subscription-plans") },
				{ path: "payment", element: Component("/pages/settings/payment") },
				{ path: "notifications", element: Component("/pages/settings/notifications") },
			],
		},

		// Legal Pages
		{
			path: "legal",
			children: [
				{ index: true, element: <Navigate to="terms" replace /> },
				{ path: "terms", element: Component("/pages/legal/terms") },
				{ path: "privacy", element: Component("/pages/legal/privacy") },
				{ path: "refund", element: Component("/pages/legal/refund") },
				{ path: "about", element: Component("/pages/legal/about") },
				{ path: "faqs", element: Component("/pages/legal/faqs") },
			],
		},

		// Support
		{
			path: "support",
			children: [
				{ index: true, element: <Navigate to="tickets" replace /> },
				{ path: "tickets", element: Component("/pages/support/tickets") },
			],
		},

		// Cars Management
		{
			path: "cars",
			element: Component("/pages/management/cars"),
		},

		// System Logs
		{ path: "system-logs", element: Component("/pages/system-logs") },

		// Error pages
		{
			path: "error",
			children: [
				{ index: true, element: <Navigate to="403" replace /> },
				{ path: "403", element: Component("/pages/sys/error/Page403") },
				{ path: "404", element: Component("/pages/sys/error/Page404") },
				{ path: "500", element: Component("/pages/sys/error/Page500") },
			],
		},
	];
	return frontendDashboardRoutes;
}
