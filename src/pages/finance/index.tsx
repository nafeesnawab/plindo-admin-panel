import { useQuery } from "@tanstack/react-query";

import financeService from "@/api/services/financeService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import {
	ArrowDown,
	ArrowUp,
	Building2,
	Calendar,
	DollarSign,
	TrendingUp,
	Wallet,
} from "lucide-react";

export default function RevenueOverviewPage() {
	const { data: overview, isLoading: loadingOverview } = useQuery({
		queryKey: ["revenue-overview"],
		queryFn: () => financeService.getRevenueOverview(),
	});

	const { data: trend, isLoading: loadingTrend } = useQuery({
		queryKey: ["revenue-trend"],
		queryFn: () => financeService.getRevenueTrend(),
	});

	const { data: partnerRevenue, isLoading: loadingPartners } = useQuery({
		queryKey: ["revenue-by-partner"],
		queryFn: () => financeService.getRevenueByPartner(),
	});

	const chartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "area",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		colors: ["#3b82f6", "#10b981", "#f59e0b"],
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.4,
				opacityTo: 0.1,
			},
		},
		xaxis: {
			categories: trend?.map((t) => `${t.month} ${t.year}`) || [],
			labels: { style: { fontSize: "12px" } },
		},
		yaxis: {
			labels: {
				formatter: (val) => `€${(val / 1000).toFixed(0)}k`,
			},
		},
		tooltip: {
			y: { formatter: (val) => `€${val.toFixed(2)}` },
		},
		legend: { position: "top" },
	};

	const chartSeries = [
		{
			name: "Total Revenue",
			data: trend?.map((t) => t.revenue) || [],
		},
		{
			name: "Customer Commission",
			data: trend?.map((t) => t.customerCommission) || [],
		},
		{
			name: "Partner Commission",
			data: trend?.map((t) => t.partnerCommission) || [],
		},
	];

	if (loadingOverview) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
				<Skeleton className="h-[400px]" />
			</div>
		);
	}

	const stats = [
		{
			title: "All Time Revenue",
			value: overview?.allTime.totalRevenue || 0,
			commission: overview?.allTime.netRevenue || 0,
			bookings: overview?.allTime.totalBookings || 0,
			icon: Wallet,
			color: "text-blue-600",
			bg: "bg-blue-500/10",
		},
		{
			title: "This Month",
			value: overview?.thisMonth.totalRevenue || 0,
			commission: overview?.thisMonth.netRevenue || 0,
			growth: overview?.thisMonth.growth || 0,
			bookings: overview?.thisMonth.totalBookings || 0,
			icon: Calendar,
			color: "text-green-600",
			bg: "bg-green-500/10",
		},
		{
			title: "This Week",
			value: overview?.thisWeek.totalRevenue || 0,
			commission: overview?.thisWeek.netRevenue || 0,
			growth: overview?.thisWeek.growth || 0,
			bookings: overview?.thisWeek.totalBookings || 0,
			icon: TrendingUp,
			color: "text-purple-600",
			bg: "bg-purple-500/10",
		},
		{
			title: "Today",
			value: overview?.today.totalRevenue || 0,
			commission: overview?.today.netRevenue || 0,
			growth: overview?.today.growth || 0,
			bookings: overview?.today.totalBookings || 0,
			icon: DollarSign,
			color: "text-orange-600",
			bg: "bg-orange-500/10",
		},
	];

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between mb-4">
								<div className={`p-2 rounded-lg ${stat.bg}`}>
									<stat.icon className={`h-5 w-5 ${stat.color}`} />
								</div>
								{stat.growth !== undefined && (
									<Badge
										className={
											stat.growth >= 0
												? "bg-green-500/10 text-green-600"
												: "bg-red-500/10 text-red-600"
										}
									>
										{stat.growth >= 0 ? (
											<ArrowUp className="h-3 w-3 mr-1" />
										) : (
											<ArrowDown className="h-3 w-3 mr-1" />
										)}
										{Math.abs(stat.growth)}%
									</Badge>
								)}
							</div>
							<p className="text-sm text-muted-foreground">{stat.title}</p>
							<p className="text-2xl font-bold">€{stat.value.toLocaleString()}</p>
							<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
								<span>Commission: €{stat.commission.toLocaleString()}</span>
								<span>{stat.bookings} bookings</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingTrend ? (
							<Skeleton className="h-[300px]" />
						) : (
							<Chart type="area" series={chartSeries} options={chartOptions} height={300} />
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Top Partners by Revenue
						</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingPartners ? (
							<div className="space-y-3">
								{Array.from({ length: 5 }).map((_, i) => (
									<Skeleton key={i} className="h-12" />
								))}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Partner</TableHead>
										<TableHead className="text-right">Revenue</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{partnerRevenue?.slice(0, 7).map((partner, index) => (
										<TableRow key={partner.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="text-xs text-muted-foreground w-4">
														{index + 1}.
													</span>
													<span className="text-sm font-medium truncate max-w-[150px]">
														{partner.businessName}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-medium">
												€{partner.totalRevenue.toLocaleString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Commission Breakdown</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="p-4 border rounded-lg">
							<p className="text-sm text-muted-foreground">Customer Commission (10%)</p>
							<p className="text-2xl font-bold text-blue-600">
								€{overview?.allTime.customerCommission.toLocaleString()}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Charged to customers on each booking
							</p>
						</div>
						<div className="p-4 border rounded-lg">
							<p className="text-sm text-muted-foreground">Partner Commission (10%)</p>
							<p className="text-2xl font-bold text-green-600">
								€{overview?.allTime.partnerCommission.toLocaleString()}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Deducted from partner earnings
							</p>
						</div>
						<div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
							<p className="text-sm text-muted-foreground">Total Platform Revenue</p>
							<p className="text-2xl font-bold text-purple-600">
								€{overview?.allTime.netRevenue.toLocaleString()}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Combined commission from both sources
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
