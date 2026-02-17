import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export function getFrontendDashboardRoutes(): RouteObject[] {
	const frontendDashboardRoutes: RouteObject[] = [
		// Dashboard
		{ path: "dashboard", element: Component("/pages/dashboard") },

		// Partner Management (single merged page)
		{
			path: "partners",
			children: [
				{ index: true, element: Component("/pages/partners") },
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

		// Booking Management (single merged page)
		{
			path: "bookings",
			children: [
				{ index: true, element: Component("/pages/bookings") },
				{ path: ":id", element: Component("/pages/bookings/details") },
			],
		},

		// Financial Reports (single merged page)
		{ path: "finance", element: Component("/pages/finance") },

		// Platform Settings (single merged page)
		{ path: "settings", element: Component("/pages/settings") },

		// Legal Pages (consolidated into single page with tabs)
		{ path: "legal", element: Component("/pages/legal") },

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
