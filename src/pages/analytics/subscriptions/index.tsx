import { useQuery } from "@tanstack/react-query";

import analyticsService from "@/api/services/analyticsService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Progress } from "@/ui/progress";
import { Skeleton } from "@/ui/skeleton";
import {
	ArrowRight,
	Crown,
	DollarSign,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";

export default function SubscriptionAnalyticsPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["analytics-subscriptions"],
		queryFn: () => analyticsService.getSubscriptionAnalytics(),
	});

	const subscriptionTrendOptions: ApexCharts.ApexOptions = {
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
			categories: data?.subscriptionTrend.map((d) => d.month) || [],
		},
		yaxis: { labels: { formatter: (val) => val.toFixed(0) } },
	};

	const revenueTrendOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "line",
			toolbar: { show: false },
		},
		colors: ["#10b981"],
		stroke: { curve: "smooth", width: 3 },
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.revenueTrend.map((d) => d.month) || [],
		},
		yaxis: {
			labels: { formatter: (val) => `€${(val / 1000).toFixed(0)}k` },
		},
		tooltip: { y: { formatter: (val) => `€${val.toLocaleString()}` } },
	};

	const planDistributionOptions: ApexCharts.ApexOptions = {
		chart: { type: "donut" },
		labels: data?.planDistribution.map((p) => p.plan) || [],
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
							label: "Total Active",
							formatter: () => data?.overview.totalActive.toString() || "0",
						},
					},
				},
			},
		},
	};

	const churnTrendOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "bar",
			toolbar: { show: false },
		},
		colors: ["#ef4444"],
		plotOptions: {
			bar: { borderRadius: 4, columnWidth: "60%" },
		},
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.churnTrend.map((d) => d.month) || [],
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

	const funnel = data?.conversionFunnel;
	const funnelSteps = funnel ? [
		{ label: "Visitors", value: funnel.visitors, color: "bg-blue-500" },
		{ label: "Signups", value: funnel.signups, color: "bg-purple-500" },
		{ label: "Trials", value: funnel.trials, color: "bg-orange-500" },
		{ label: "Subscribed", value: funnel.subscribed, color: "bg-green-500" },
	] : [];

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Subscription Analytics</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-blue-500/10">
								<Users className="h-5 w-5 text-blue-600" />
							</div>
							<Badge className="bg-green-500/10 text-green-600">Active</Badge>
						</div>
						<p className="text-sm text-muted-foreground">Total Active</p>
						<p className="text-2xl font-bold">{data?.overview.totalActive.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-green-500/10">
								<DollarSign className="h-5 w-5 text-green-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Monthly Revenue</p>
						<p className="text-2xl font-bold">€{data?.overview.monthlyRevenue.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-purple-500/10">
								<TrendingUp className="h-5 w-5 text-purple-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Conversion Rate</p>
						<p className="text-2xl font-bold">{data?.overview.conversionRate}%</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-red-500/10">
								<TrendingDown className="h-5 w-5 text-red-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Churn Rate</p>
						<p className="text-2xl font-bold">{data?.overview.churnRate}%</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Basic Plan</p>
								<p className="text-2xl font-bold">{data?.overview.basicSubscribers.toLocaleString()}</p>
								<p className="text-xs text-muted-foreground">€15/month</p>
							</div>
							<div className="text-right">
								<Badge variant="outline" className="text-blue-600">
									{((data?.overview.basicSubscribers || 0) / (data?.overview.totalActive || 1) * 100).toFixed(0)}%
								</Badge>
							</div>
						</div>
						<Progress 
							value={(data?.overview.basicSubscribers || 0) / (data?.overview.totalActive || 1) * 100} 
							className="h-2 mt-3" 
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<div className="flex items-center gap-2">
									<p className="text-sm text-muted-foreground">Premium Plan</p>
									<Crown className="h-4 w-4 text-amber-500" />
								</div>
								<p className="text-2xl font-bold">{data?.overview.premiumSubscribers.toLocaleString()}</p>
								<p className="text-xs text-muted-foreground">€28/month</p>
							</div>
							<div className="text-right">
								<Badge variant="outline" className="text-amber-600">
									{((data?.overview.premiumSubscribers || 0) / (data?.overview.totalActive || 1) * 100).toFixed(0)}%
								</Badge>
							</div>
						</div>
						<Progress 
							value={(data?.overview.premiumSubscribers || 0) / (data?.overview.totalActive || 1) * 100} 
							className="h-2 mt-3" 
						/>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Subscription Growth (12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="area"
							series={[{ name: "Subscriptions", data: data?.subscriptionTrend.map((d) => d.value) || [] }]}
							options={subscriptionTrendOptions}
							height={280}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Plan Distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="donut"
							series={data?.planDistribution.map((p) => p.count) || []}
							options={planDistributionOptions}
							height={280}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Revenue Trend (12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="line"
							series={[{ name: "Revenue", data: data?.revenueTrend.map((d) => d.value) || [] }]}
							options={revenueTrendOptions}
							height={280}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Churn Trend (6 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="bar"
							series={[{ name: "Churned", data: data?.churnTrend.map((d) => d.value) || [] }]}
							options={churnTrendOptions}
							height={280}
						/>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Conversion Funnel</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between gap-4">
						{funnelSteps.map((step, index) => (
							<div key={step.label} className="flex items-center flex-1">
								<div className="flex-1 text-center">
									<div className={`${step.color} text-white rounded-lg p-4 mb-2`}>
										<p className="text-2xl font-bold">{step.value.toLocaleString()}</p>
									</div>
									<p className="text-sm font-medium">{step.label}</p>
									{index > 0 && funnel && (
										<p className="text-xs text-muted-foreground">
											{((step.value / funnelSteps[index - 1].value) * 100).toFixed(1)}% from previous
										</p>
									)}
								</div>
								{index < funnelSteps.length - 1 && (
									<ArrowRight className="h-6 w-6 text-muted-foreground mx-2 flex-shrink-0" />
								)}
							</div>
						))}
					</div>
					{funnel && (
						<div className="mt-6 p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								<strong>Overall Conversion:</strong> {((funnel.subscribed / funnel.visitors) * 100).toFixed(2)}% of visitors become subscribers
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-4">
						<div className="p-3 rounded-lg bg-blue-500/10">
							<TrendingUp className="h-6 w-6 text-blue-600" />
						</div>
						<div>
							<p className="font-medium">Average Subscription Length</p>
							<p className="text-2xl font-bold">{data?.overview.averageSubscriptionLength} months</p>
							<p className="text-sm text-muted-foreground">
								Users stay subscribed for an average of {data?.overview.averageSubscriptionLength} months
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
