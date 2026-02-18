import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router";
import PartnerLayout from "@/layouts/partner";
import PartnerAuthGuard from "@/routes/components/partner-auth-guard";

const PartnerDashboard = lazy(() => import("@/pages/partner/dashboard"));
const PartnerBookings = lazy(() => import("@/pages/partner/bookings"));
const OrderDetails = lazy(() => import("@/pages/partner/bookings/[id]"));
const PartnerServices = lazy(() => import("@/pages/partner/services"));
const PartnerSchedule = lazy(() => import("@/pages/partner/schedule"));
const PartnerEarnings = lazy(() => import("@/pages/partner/earnings"));
const PartnerReviews = lazy(() => import("@/pages/partner/reviews"));
const PartnerMessages = lazy(() => import("@/pages/partner/messages"));
const PartnerDrivers = lazy(() => import("@/pages/partner/drivers"));
const PartnerSettings = lazy(() => import("@/pages/partner/settings"));
const PartnerProducts = lazy(() => import("@/pages/partner/products"));
const PartnerCustomers = lazy(() => import("@/pages/partner/customers"));

export const partnerDashboardRoutes: RouteObject[] = [
	{
		path: "partner",
		element: (
			<PartnerAuthGuard>
				<PartnerLayout />
			</PartnerAuthGuard>
		),
		children: [
			{ index: true, element: <Navigate to="dashboard" replace /> },
			{
				path: "dashboard",
				element: (
					<Suspense>
						<PartnerDashboard />
					</Suspense>
				),
			},
			{
				path: "bookings",
				element: (
					<Suspense>
						<PartnerBookings />
					</Suspense>
				),
			},
			{
				path: "bookings/:id",
				element: (
					<Suspense>
						<OrderDetails />
					</Suspense>
				),
			},
			{
				path: "schedule",
				element: (
					<Suspense>
						<PartnerSchedule />
					</Suspense>
				),
			},
			// Placeholder routes - will be implemented later
			{
				path: "services",
				element: (
					<Suspense>
						<PartnerServices />
					</Suspense>
				),
			},
			{
				path: "customers",
				element: (
					<Suspense>
						<PartnerCustomers />
					</Suspense>
				),
			},
			{
				path: "messages",
				element: (
					<Suspense>
						<PartnerMessages />
					</Suspense>
				),
			},
			{
				path: "drivers",
				element: (
					<Suspense>
						<PartnerDrivers />
					</Suspense>
				),
			},
			{
				path: "reviews",
				element: (
					<Suspense>
						<PartnerReviews />
					</Suspense>
				),
			},
			{
				path: "earnings",
				element: (
					<Suspense>
						<PartnerEarnings />
					</Suspense>
				),
			},
			{
				path: "settings",
				element: (
					<Suspense>
						<PartnerSettings />
					</Suspense>
				),
			},
			{
				path: "products",
				element: (
					<Suspense>
						<PartnerProducts />
					</Suspense>
				),
			},
		],
	},
];
