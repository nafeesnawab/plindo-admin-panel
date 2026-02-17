import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";
import BookingsTrendChart from "./components/bookings-trend-chart";
import RevenueTrendChart from "./components/revenue-trend-chart";
import StatsCards from "./components/stats-cards";

export default function DashboardPage() {
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: dashboardService.getStats,
	});

	return (
		<div className="h-full flex flex-col overflow-auto space-y-6">
			<StatsCards stats={stats} isLoading={statsLoading} />

			<div className="grid gap-6 lg:grid-cols-2">
				<BookingsTrendChart />
				<RevenueTrendChart />
			</div>
		</div>
	);
}
