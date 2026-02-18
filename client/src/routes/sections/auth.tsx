import { Suspense, lazy } from "react";
import type { RouteObject } from "react-router";
import { Outlet } from "react-router";

const UnifiedLoginPage = lazy(() => import("@/pages/auth/unified-login"));
const authCustom: RouteObject[] = [
	{
		path: "login",
		element: <UnifiedLoginPage />,
	},
];

export const authRoutes: RouteObject[] = [
	{
		path: "auth",
		element: (
			<Suspense>
				<Outlet />
			</Suspense>
		),
		children: [...authCustom],
	},
];
