import { useQuery } from "@tanstack/react-query";

import analyticsService from "@/api/services/analyticsService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import {
	ArrowUp,
	Calendar,
	TrendingUp,
	User,
	UserPlus,
	Users,
} from "lucide-react";

export default function UserAnalyticsPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["analytics-users"],
		queryFn: () => analyticsService.getUserAnalytics(),
	});

	const growthChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "area",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		colors: ["#3b82f6"],
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		fill: {
			type: "gradient",
			gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
		},
		xaxis: {
			categories: data?.userGrowth.map((d) => d.month) || [],
		},
		yaxis: {
			labels: { formatter: (val) => val.toFixed(0) },
		},
		tooltip: { y: { formatter: (val) => `${val} users` } },
	};

	const dauChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "line",
			toolbar: { show: false },
			sparkline: { enabled: false },
		},
		colors: ["#10b981"],
		stroke: { curve: "smooth", width: 2 },
		xaxis: {
			categories: data?.dailyActiveUsersChart.map((d) => d.date.slice(5)) || [],
			labels: { show: false },
		},
		yaxis: { labels: { formatter: (val) => val.toFixed(0) } },
		tooltip: { y: { formatter: (val) => `${val} users` } },
	};

	const registrationsChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "bar",
			toolbar: { show: false },
		},
		colors: ["#8b5cf6"],
		plotOptions: {
			bar: { borderRadius: 4, columnWidth: "60%" },
		},
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.registrationsByMonth.map((d) => d.month) || [],
		},
		yaxis: { labels: { formatter: (val) => val.toFixed(0) } },
	};

	const userTypeChartOptions: ApexCharts.ApexOptions = {
		chart: { type: "donut" },
		labels: ["Customers", "Partners"],
		colors: ["#3b82f6", "#f59e0b"],
		legend: { position: "bottom" },
		plotOptions: {
			pie: {
				donut: {
					size: "70%",
					labels: {
						show: true,
						total: {
							show: true,
							label: "Total Users",
							formatter: () => data?.overview.totalUsers.toLocaleString() || "0",
						},
					},
				},
			},
		},
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-28" />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Skeleton className="h-[350px]" />
					<Skeleton className="h-[350px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">User Analytics</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-blue-500/10">
								<Users className="h-5 w-5 text-blue-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Total Users</p>
						<p className="text-2xl font-bold">{data?.overview.totalUsers.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-green-500/10">
								<User className="h-5 w-5 text-green-600" />
							</div>
							<Badge className="bg-green-500/10 text-green-600">Daily</Badge>
						</div>
						<p className="text-sm text-muted-foreground">Daily Active Users</p>
						<p className="text-2xl font-bold">{data?.overview.dailyActiveUsers.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-purple-500/10">
								<Calendar className="h-5 w-5 text-purple-600" />
							</div>
							<Badge className="bg-purple-500/10 text-purple-600">Monthly</Badge>
						</div>
						<p className="text-sm text-muted-foreground">Monthly Active Users</p>
						<p className="text-2xl font-bold">{data?.overview.monthlyActiveUsers.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-orange-500/10">
								<TrendingUp className="h-5 w-5 text-orange-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Retention Rate</p>
						<p className="text-2xl font-bold">{data?.overview.retentionRate}%</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<UserPlus className="h-4 w-4 text-green-600" />
							<span className="text-sm text-muted-foreground">New Today</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.newUsersToday}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<ArrowUp className="h-4 w-4 text-blue-600" />
							<span className="text-sm text-muted-foreground">New This Week</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.newUsersThisWeek}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<TrendingUp className="h-4 w-4 text-purple-600" />
							<span className="text-sm text-muted-foreground">New This Month</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.newUsersThisMonth}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>User Growth (12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="area"
							series={[{ name: "New Users", data: data?.userGrowth.map((d) => d.value) || [] }]}
							options={growthChartOptions}
							height={280}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>User Distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="donut"
							series={[data?.usersByType.customers || 0, data?.usersByType.partners || 0]}
							options={userTypeChartOptions}
							height={280}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Daily Active Users (30 Days)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="line"
							series={[{ name: "DAU", data: data?.dailyActiveUsersChart.map((d) => d.value) || [] }]}
							options={dauChartOptions}
							height={250}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>New Registrations (6 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="bar"
							series={[{ name: "Registrations", data: data?.registrationsByMonth.map((d) => d.value) || [] }]}
							options={registrationsChartOptions}
							height={250}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
