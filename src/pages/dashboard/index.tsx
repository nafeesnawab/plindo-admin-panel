import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";

import StatsCards from "./components/stats-cards";
import BookingsTrendChart from "./components/bookings-trend-chart";
import RevenueTrendChart from "./components/revenue-trend-chart";
import UserGrowthChart from "./components/user-growth-chart";
import RecentBookings from "./components/recent-bookings";
import RecentPartnerApplications from "./components/recent-partner-applications";
import RecentUsers from "./components/recent-users";

export default function DashboardPage() {
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: dashboardService.getStats,
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Welcome back! Here's an overview of your platform.</p>
			</div>

			<StatsCards stats={stats} isLoading={statsLoading} />

			<div className="grid gap-6 lg:grid-cols-2">
				<BookingsTrendChart />
				<RevenueTrendChart />
			</div>

			<div className="grid gap-6 lg:grid-cols-1">
				<UserGrowthChart />
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<RecentBookings />
				<RecentPartnerApplications />
				<RecentUsers />
			</div>
		</div>
	);
}
