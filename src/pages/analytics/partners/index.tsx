import { useQuery } from "@tanstack/react-query";

import analyticsService from "@/api/services/analyticsService";
import { Chart } from "@/components/chart";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Progress } from "@/ui/progress";
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
	Building2,
	CheckCircle,
	Clock,
	Star,
	TrendingUp,
	UserX,
} from "lucide-react";

export default function PartnerAnalyticsPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["analytics-partners"],
		queryFn: () => analyticsService.getPartnerAnalytics(),
	});

	const growthChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "bar",
			toolbar: { show: false },
		},
		colors: ["#3b82f6"],
		plotOptions: {
			bar: { borderRadius: 4, columnWidth: "60%" },
		},
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.partnerGrowth.map((d) => d.month) || [],
		},
		yaxis: { labels: { formatter: (val) => val.toFixed(0) } },
	};

	const statusChartOptions: ApexCharts.ApexOptions = {
		chart: { type: "donut" },
		labels: ["Active", "Pending", "Suspended"],
		colors: ["#10b981", "#f59e0b", "#ef4444"],
		legend: { position: "bottom" },
		plotOptions: {
			pie: {
				donut: {
					size: "70%",
					labels: {
						show: true,
						total: {
							show: true,
							label: "Total",
							formatter: () => data?.overview.totalPartners.toString() || "0",
						},
					},
				},
			},
		},
	};

	const ratingChartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "bar",
			toolbar: { show: false },
		},
		colors: ["#f59e0b"],
		plotOptions: {
			bar: { horizontal: true, borderRadius: 4 },
		},
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.ratingDistribution.map((d) => d.rating) || [],
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
			<h1 className="text-2xl font-bold">Partner Analytics</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-blue-500/10">
								<Building2 className="h-5 w-5 text-blue-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Total Partners</p>
						<p className="text-2xl font-bold">{data?.overview.totalPartners}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-green-500/10">
								<CheckCircle className="h-5 w-5 text-green-600" />
							</div>
							<Badge className="bg-green-500/10 text-green-600">Active</Badge>
						</div>
						<p className="text-sm text-muted-foreground">Active Partners</p>
						<p className="text-2xl font-bold">{data?.overview.activePartners}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-yellow-500/10">
								<Star className="h-5 w-5 text-yellow-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Average Rating</p>
						<p className="text-2xl font-bold">{data?.overview.averageRating} ⭐</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-purple-500/10">
								<TrendingUp className="h-5 w-5 text-purple-600" />
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
							<Clock className="h-4 w-4 text-yellow-600" />
							<span className="text-sm text-muted-foreground">Pending</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.pendingPartners}</p>
						<Progress 
							value={(data?.overview.pendingPartners || 0) / (data?.overview.totalPartners || 1) * 100} 
							className="h-1 mt-2" 
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<UserX className="h-4 w-4 text-red-600" />
							<span className="text-sm text-muted-foreground">Suspended</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.suspendedPartners}</p>
						<Progress 
							value={(data?.overview.suspendedPartners || 0) / (data?.overview.totalPartners || 1) * 100} 
							className="h-1 mt-2" 
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<Building2 className="h-4 w-4 text-green-600" />
							<span className="text-sm text-muted-foreground">New This Month</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.newPartnersThisMonth}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Partner Growth (12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="bar"
							series={[{ name: "New Partners", data: data?.partnerGrowth.map((d) => d.value) || [] }]}
							options={growthChartOptions}
							height={280}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Partners by Status</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="donut"
							series={[
								data?.partnersByStatus.active || 0,
								data?.partnersByStatus.pending || 0,
								data?.partnersByStatus.suspended || 0,
							]}
							options={statusChartOptions}
							height={280}
						/>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Rating Distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="bar"
							series={[{ name: "Partners", data: data?.ratingDistribution.map((d) => d.count) || [] }]}
							options={ratingChartOptions}
							height={250}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Top Performing Partners</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="bookings">
							<TabsList className="mb-4">
								<TabsTrigger value="bookings">By Bookings</TabsTrigger>
								<TabsTrigger value="revenue">By Revenue</TabsTrigger>
								<TabsTrigger value="rating">By Rating</TabsTrigger>
							</TabsList>
							<TabsContent value="bookings">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Partner</TableHead>
											<TableHead className="text-right">Bookings</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data?.topByBookings.map((partner) => (
											<TableRow key={partner.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														<Avatar className="h-8 w-8">
															<AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">
																{partner.businessName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
															</AvatarFallback>
														</Avatar>
														<span className="font-medium">{partner.businessName}</span>
													</div>
												</TableCell>
												<TableCell className="text-right font-bold">{partner.totalBookings.toLocaleString()}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TabsContent>
							<TabsContent value="revenue">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Partner</TableHead>
											<TableHead className="text-right">Revenue</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data?.topByRevenue.map((partner) => (
											<TableRow key={partner.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														<Avatar className="h-8 w-8">
															<AvatarFallback className="text-xs bg-green-500/10 text-green-600">
																{partner.businessName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
															</AvatarFallback>
														</Avatar>
														<span className="font-medium">{partner.businessName}</span>
													</div>
												</TableCell>
												<TableCell className="text-right font-bold">€{partner.totalRevenue.toLocaleString()}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TabsContent>
							<TabsContent value="rating">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Partner</TableHead>
											<TableHead className="text-right">Rating</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data?.topByRating.map((partner) => (
											<TableRow key={partner.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														<Avatar className="h-8 w-8">
															<AvatarFallback className="text-xs bg-yellow-500/10 text-yellow-600">
																{partner.businessName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
															</AvatarFallback>
														</Avatar>
														<span className="font-medium">{partner.businessName}</span>
													</div>
												</TableCell>
												<TableCell className="text-right font-bold">{partner.rating} ⭐</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
