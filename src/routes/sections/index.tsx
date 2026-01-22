import { Navigate, type RouteObject } from "react-router";
import { authRoutes } from "./auth";
import { dashboardRoutes } from "./dashboard";
import { mainRoutes } from "./main";
import { partnerPublicRoutes } from "./partner";
import { partnerDashboardRoutes } from "./partner-dashboard";

export const routesSection: RouteObject[] = [
	// Auth
	...authRoutes,
	// Partner Public Routes (registration, login, status)
	...partnerPublicRoutes,
	// Partner Dashboard (Protected)
	...partnerDashboardRoutes,
	// Dashboard (Admin)
	...dashboardRoutes,
	// Main
	...mainRoutes,
	// No Match
	{ path: "*", element: <Navigate to="/404" replace /> },
];
