import { useQuery } from "@tanstack/react-query";

import financeService from "@/api/services/financeService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Progress } from "@/ui/progress";
import { Skeleton } from "@/ui/skeleton";
import {
	AlertTriangle,
	ArrowUpRight,
	Calendar,
	Check,
	Crown,
	TrendingDown,
	Users,
} from "lucide-react";

export default function SubscriptionsPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["subscription-revenue"],
		queryFn: () => financeService.getSubscriptionRevenue(),
	});

	const trendChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "line",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		colors: ["#3b82f6", "#f59e0b", "#ef4444", "#10b981"],
		stroke: { curve: "smooth", width: 2 },
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.trend.map((t) => `${t.month}`) || [],
		},
		yaxis: {
			labels: {
				formatter: (val) => val.toFixed(0),
			},
		},
		legend: { position: "top" },
	};

	const trendSeries = [
		{
			name: "Basic",
			data: data?.trend.map((t) => t.basic) || [],
		},
		{
			name: "Premium",
			data: data?.trend.map((t) => t.premium) || [],
		},
		{
			name: "Churned",
			data: data?.trend.map((t) => t.churned) || [],
		},
		{
			name: "New",
			data: data?.trend.map((t) => t.new) || [],
		},
	];

	const revenueChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "donut",
		},
		labels: ["Basic Plan", "Premium Plan"],
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
							label: "Total Revenue",
							formatter: () => `€${data?.overview.totalMonthlyRevenue.toLocaleString() || 0}`,
						},
					},
				},
			},
		},
	};

	const revenueSeries = [
		data?.overview.basicRevenue || 0,
		data?.overview.premiumRevenue || 0,
	];

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

	const totalSubscribers = data?.overview.totalActive || 0;
	const basicPercentage = totalSubscribers > 0 ? ((data?.overview.basicSubscribers || 0) / totalSubscribers) * 100 : 0;
	const premiumPercentage = totalSubscribers > 0 ? ((data?.overview.premiumSubscribers || 0) / totalSubscribers) * 100 : 0;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Subscription Revenue</h1>

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
							<div className="p-2 rounded-lg bg-purple-500/10">
								<Crown className="h-5 w-5 text-purple-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Monthly Revenue</p>
						<p className="text-2xl font-bold">€{data?.overview.totalMonthlyRevenue.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-red-500/10">
								<TrendingDown className="h-5 w-5 text-red-600" />
							</div>
							<Badge className="bg-red-500/10 text-red-600">{data?.overview.churnRate}%</Badge>
						</div>
						<p className="text-sm text-muted-foreground">Churn Rate</p>
						<p className="text-2xl font-bold">{data?.overview.churnRate}%</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-orange-500/10">
								<Calendar className="h-5 w-5 text-orange-600" />
							</div>
							<ArrowUpRight className="h-4 w-4 text-green-600" />
						</div>
						<p className="text-sm text-muted-foreground">Upcoming Renewals</p>
						<p className="text-2xl font-bold">{data?.overview.upcomingRenewals}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Subscription Plans</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{data?.plans.map((plan) => (
							<div key={plan.name} className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{plan.name === "Premium" ? (
											<Crown className="h-5 w-5 text-amber-500" />
										) : (
											<Check className="h-5 w-5 text-blue-500" />
										)}
										<span className="font-medium">{plan.name} Plan</span>
										<Badge variant="outline">€{plan.price}/mo</Badge>
									</div>
									<span className="font-bold">€{plan.revenue.toLocaleString()}/mo</span>
								</div>
								<div className="flex items-center gap-4">
									<Progress 
										value={plan.name === "Basic" ? basicPercentage : premiumPercentage} 
										className="flex-1 h-2" 
									/>
									<span className="text-sm text-muted-foreground w-24 text-right">
										{plan.subscribers} users
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{plan.features.map((feature) => (
										<Badge key={feature} variant="secondary" className="text-xs">
											{feature}
										</Badge>
									))}
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Revenue Distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart type="donut" series={revenueSeries} options={revenueChartOptions} height={280} />
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Subscription Trend (Last 6 Months)</CardTitle>
				</CardHeader>
				<CardContent>
					<Chart type="line" series={trendSeries} options={trendChartOptions} height={300} />
				</CardContent>
			</Card>

			<Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
				<CardContent className="pt-6">
					<div className="flex items-start gap-4">
						<div className="p-2 rounded-lg bg-orange-500/10">
							<AlertTriangle className="h-5 w-5 text-orange-600" />
						</div>
						<div>
							<h3 className="font-medium text-orange-800 dark:text-orange-200">Churn Rate Alert</h3>
							<p className="text-sm text-orange-700/80 dark:text-orange-300/80 mt-1">
								Your current churn rate is {data?.overview.churnRate}%. Industry average for subscription services is 5-7%. 
								{(data?.overview.churnRate || 0) > 7 
									? " Consider implementing retention strategies like personalized offers or loyalty rewards."
									: " Great job! Your retention is performing well."
								}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
