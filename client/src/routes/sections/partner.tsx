import { lazy, Suspense } from "react";
import { Navigate, Outlet, type RouteObject } from "react-router";
import { LineLoading } from "@/components/loading";

const PartnerRegisterPage = lazy(() => import("@/pages/partner/register"));
const PartnerApplicationStatusPage = lazy(() => import("@/pages/partner/application-status"));

export const partnerPublicRoutes: RouteObject[] = [
	{
		path: "partner",
		element: (
			<Suspense fallback={<LineLoading />}>
				<Outlet />
			</Suspense>
		),
		children: [
			{ index: true, element: <Navigate to="register" replace /> },
			{ path: "register", element: <PartnerRegisterPage /> },
			{ path: "application-status", element: <PartnerApplicationStatusPage /> },
		],
	},
];
