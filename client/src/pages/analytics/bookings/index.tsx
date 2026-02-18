import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Clock, DollarSign, TrendingUp, XCircle } from "lucide-react";
import analyticsService from "@/api/services/analyticsService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Progress } from "@/ui/progress";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function BookingAnalyticsPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["analytics-bookings"],
		queryFn: () => analyticsService.getBookingAnalytics(),
	});

	const bookingTrendOptions: ApexCharts.ApexOptions = {
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
			categories: data?.bookingTrend.map((d) => d.month) || [],
		},
		yaxis: { labels: { formatter: (val) => val.toFixed(0) } },
	};

	const heatmapOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "heatmap",
			toolbar: { show: false },
		},
		dataLabels: { enabled: false },
		colors: ["#3b82f6"],
		xaxis: {
			categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		},
		plotOptions: {
			heatmap: {
				shadeIntensity: 0.5,
				colorScale: {
					ranges: [
						{ from: 0, to: 10, color: "#e0e7ff", name: "Low" },
						{ from: 11, to: 25, color: "#93c5fd", name: "Medium" },
						{ from: 26, to: 40, color: "#3b82f6", name: "High" },
						{ from: 41, to: 100, color: "#1d4ed8", name: "Very High" },
					],
				},
			},
		},
	};

	const generateHeatmapSeries = () => {
		if (!data?.peakHours) return [];

		const hours = [...new Set(data.peakHours.map((p) => p.hour))];
		return hours.map((hour) => ({
			name: hour,
			data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
				const found = data.peakHours.find((p) => p.day === day && p.hour === hour);
				return found?.value || 0;
			}),
		}));
	};

	const statusChartOptions: ApexCharts.ApexOptions = {
		chart: { type: "donut" },
		labels: ["Completed", "Cancelled", "Booked", "In Progress", "Delivered"],
		colors: ["#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6"],
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
							formatter: () => data?.overview.totalBookings.toLocaleString() || "0",
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
			<h1 className="text-2xl font-bold">Booking Analytics</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-blue-500/10">
								<Calendar className="h-5 w-5 text-blue-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Total Bookings</p>
						<p className="text-2xl font-bold">{data?.overview.totalBookings.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-green-500/10">
								<TrendingUp className="h-5 w-5 text-green-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Conversion Rate</p>
						<p className="text-2xl font-bold">{data?.overview.conversionRate}%</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-purple-500/10">
								<DollarSign className="h-5 w-5 text-purple-600" />
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Avg. Booking Value</p>
						<p className="text-2xl font-bold">€{data?.overview.averageBookingValue.toFixed(2)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between mb-2">
							<div className="p-2 rounded-lg bg-orange-500/10">
								<Clock className="h-5 w-5 text-orange-600" />
							</div>
							<Badge className="bg-orange-500/10 text-orange-600">Today</Badge>
						</div>
						<p className="text-sm text-muted-foreground">Today's Bookings</p>
						<p className="text-2xl font-bold">{data?.overview.bookingsToday}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<span className="text-sm text-muted-foreground">Completed</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.completedBookings.toLocaleString()}</p>
						<Progress
							value={((data?.overview.completedBookings || 0) / (data?.overview.totalBookings || 1)) * 100}
							className="h-1 mt-2"
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<XCircle className="h-4 w-4 text-red-600" />
							<span className="text-sm text-muted-foreground">Cancelled</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.cancelledBookings.toLocaleString()}</p>
						<Progress
							value={((data?.overview.cancelledBookings || 0) / (data?.overview.totalBookings || 1)) * 100}
							className="h-1 mt-2"
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 mb-1">
							<Calendar className="h-4 w-4 text-blue-600" />
							<span className="text-sm text-muted-foreground">This Month</span>
						</div>
						<p className="text-xl font-bold">{data?.overview.bookingsThisMonth.toLocaleString()}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Booking Trend (12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="area"
							series={[{ name: "Bookings", data: data?.bookingTrend.map((d) => d.value) || [] }]}
							options={bookingTrendOptions}
							height={280}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Bookings by Status</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart
							type="donut"
							series={[
								data?.bookingsByStatus.completed || 0,
								data?.bookingsByStatus.cancelled || 0,
								data?.bookingsByStatus.booked || 0,
								data?.bookingsByStatus.inProgress || 0,
								data?.bookingsByStatus.delivered || 0,
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
						<CardTitle>Peak Booking Hours</CardTitle>
					</CardHeader>
					<CardContent>
						<Chart type="heatmap" series={generateHeatmapSeries()} options={heatmapOptions} height={350} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Most Popular Services</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>Service</TableHead>
									<TableHead className="text-right">Bookings</TableHead>
									<TableHead className="text-right">Revenue</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.popularServices.map((service, index) => (
									<TableRow key={service.name}>
										<TableCell className="font-medium">{index + 1}</TableCell>
										<TableCell>{service.name}</TableCell>
										<TableCell className="text-right">{service.bookings.toLocaleString()}</TableCell>
										<TableCell className="text-right font-medium">€{service.revenue.toLocaleString()}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
