import { useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	Calendar,
	Car,
	Clock,
	CreditCard,
	DollarSign,
	Plus,
	Star,
} from "lucide-react";
import { Link } from "react-router";

import apiClient from "@/api/apiClient";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

interface DashboardData {
	stats: {
		todayBookings: number;
		bookingGrowth: number;
		revenueToday: number;
		revenueGrowth: number;
		averageRating: number;
		totalReviews: number;
		upcomingBookings: number;
	};
	revenueChartData: { date: string; value: number }[];
	bookingsChartData: { date: string; value: number }[];
	todaySchedule: {
		id: string;
		time: string;
		customer: string;
		service: string;
		status: string;
		vehicle: string;
	}[];
	recentActivity: {
		id: string;
		type: string;
		message: string;
		time: string;
		status: string;
	}[];
}

const statusColors: Record<string, string> = {
	booked: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	in_progress:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	picked:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
	out_for_delivery:
		"bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
	delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
	rescheduled:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const activityIcons: Record<string, React.ReactNode> = {
	booking: <Calendar className="h-4 w-4 text-blue-500" />,
	review: <Star className="h-4 w-4 text-yellow-500" />,
	payment: <CreditCard className="h-4 w-4 text-green-500" />,
};

export default function PartnerDashboard() {
	const { data, isLoading } = useQuery<DashboardData>({
		queryKey: ["partner-dashboard"],
		queryFn: () => apiClient.get<DashboardData>({ url: "/partner/dashboard" }),
		refetchInterval: 60_000,
	});

	const stats = data?.stats;
	const revenueLabels = (data?.revenueChartData ?? []).map((d) =>
		new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
	);
	const revenueValues = (data?.revenueChartData ?? []).map((d) => d.value);
	const bookingLabels = (data?.bookingsChartData ?? []).map((d) =>
		new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
	);
	const bookingValues = (data?.bookingsChartData ?? []).map((d) => d.value);

	const revenueChartOptions: ApexCharts.ApexOptions = {
		chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		fill: {
			type: "gradient",
			gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
		},
		xaxis: { categories: revenueLabels },
		yaxis: { labels: { formatter: (v) => `€${v}` } },
		colors: ["#3b82f6"],
	};

	const bookingsChartOptions: ApexCharts.ApexOptions = {
		chart: { type: "bar", toolbar: { show: false } },
		dataLabels: { enabled: false },
		plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
		xaxis: { categories: bookingLabels },
		colors: ["#3b82f6"],
	};

	const todaySchedule = data?.todaySchedule ?? [];
	const recentActivity = data?.recentActivity ?? [];

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Today's Bookings
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<div className="text-2xl font-bold">
								{stats?.todayBookings ?? 0}
							</div>
						)}
						{!isLoading && (
							<p className="text-xs text-muted-foreground">
								<span
									className={
										stats?.bookingGrowth && stats.bookingGrowth >= 0
											? "text-green-500"
											: "text-red-500"
									}
								>
									{stats?.bookingGrowth !== undefined &&
									stats.bookingGrowth >= 0
										? "+"
										: ""}
									{stats?.bookingGrowth ?? 0}
								</span>{" "}
								from yesterday
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							<div className="text-2xl font-bold">
								€{(stats?.revenueToday ?? 0).toFixed(0)}
							</div>
						)}
						{!isLoading && (
							<p className="text-xs text-muted-foreground">
								<span
									className={
										stats?.revenueGrowth && stats.revenueGrowth >= 0
											? "text-green-500"
											: "text-red-500"
									}
								>
									{stats?.revenueGrowth !== undefined &&
									stats.revenueGrowth >= 0
										? "+"
										: ""}
									{stats?.revenueGrowth ?? 0}%
								</span>{" "}
								from yesterday
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Average Rating
						</CardTitle>
						<Star className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-12" />
						) : (
							<div className="text-2xl font-bold">
								{stats?.averageRating ?? 0}
							</div>
						)}
						{!isLoading && (
							<p className="text-xs text-muted-foreground">
								Based on {stats?.totalReviews ?? 0} reviews
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Upcoming Bookings
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-12" />
						) : (
							<div className="text-2xl font-bold">
								{stats?.upcomingBookings ?? 0}
							</div>
						)}
						{!isLoading && (
							<p className="text-xs text-muted-foreground">Currently booked</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Charts Row */}
			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Revenue Trend</CardTitle>
						<CardDescription>Last 7 days</CardDescription>
					</CardHeader>
					<CardContent>
						<Chart
							type="area"
							height={300}
							options={revenueChartOptions}
							series={[{ name: "Revenue", data: revenueValues }]}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Bookings Trend</CardTitle>
						<CardDescription>Last 7 days</CardDescription>
					</CardHeader>
					<CardContent>
						<Chart
							type="bar"
							height={300}
							options={bookingsChartOptions}
							series={[{ name: "Bookings", data: bookingValues }]}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3">
						<Link to="/partner/bookings">
							<Button variant="outline" className="gap-2">
								<Calendar className="h-4 w-4" />
								View Today's Schedule
							</Button>
						</Link>
						<Link to="/partner/services">
							<Button variant="outline" className="gap-2">
								<Plus className="h-4 w-4" />
								Create New Service
							</Button>
						</Link>
						<Link to="/partner/schedule">
							<Button variant="outline" className="gap-2">
								<Clock className="h-4 w-4" />
								Update Availability
							</Button>
						</Link>
						<Link to="/partner/earnings">
							<Button variant="outline" className="gap-2">
								<CreditCard className="h-4 w-4" />
								View Earnings
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>

			{/* Today's Schedule & Recent Activity */}
			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Today's Schedule</CardTitle>
							<CardDescription>Your upcoming appointments</CardDescription>
						</div>
						<Link to="/partner/bookings">
							<Button variant="ghost" size="sm" className="gap-1">
								View All <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-16 w-full" />
								))}
							</div>
						) : todaySchedule.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No appointments today
							</p>
						) : (
							<div className="space-y-4">
								{todaySchedule.map((booking) => (
									<div
										key={String(booking.id)}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
												<Car className="h-5 w-5 text-primary" />
											</div>
											<div>
												<p className="font-medium">{booking.customer}</p>
												<p className="text-sm text-muted-foreground">
													{booking.service}
													{booking.vehicle ? ` • ${booking.vehicle}` : ""}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Badge className={statusColors[booking.status] ?? ""}>
												{booking.status.replace(/_/g, " ")}
											</Badge>
											<span className="text-sm font-medium">
												{booking.time}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>Latest updates</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-10 w-full" />
								))}
							</div>
						) : recentActivity.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No recent activity
							</p>
						) : (
							<div className="space-y-4">
								{recentActivity.map((activity) => (
									<div
										key={String(activity.id)}
										className="flex items-start gap-3"
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
											{activityIcons[activity.type] ?? (
												<Calendar className="h-4 w-4 text-blue-500" />
											)}
										</div>
										<div className="flex-1">
											<p className="text-sm">{activity.message}</p>
											<p className="text-xs text-muted-foreground">
												{new Date(activity.time).toLocaleString()}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
