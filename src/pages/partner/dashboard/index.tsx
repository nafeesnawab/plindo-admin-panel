import { ArrowRight, Calendar, Car, CheckCircle, Clock, CreditCard, DollarSign, Plus, Star } from "lucide-react";
import { Link } from "react-router";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";

// Chart data
const revenueChartOptions: ApexCharts.ApexOptions = {
	chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
	dataLabels: { enabled: false },
	stroke: { curve: "smooth", width: 2 },
	fill: {
		type: "gradient",
		gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
	},
	xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
	yaxis: { labels: { formatter: (value) => `€${value}` } },
	colors: ["#3b82f6"],
};

const revenueSeries = [{ name: "Revenue", data: [320, 450, 280, 520, 680, 890, 420] }];

const bookingsChartOptions: ApexCharts.ApexOptions = {
	chart: { type: "bar", toolbar: { show: false } },
	dataLabels: { enabled: false },
	plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
	xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
	colors: ["#3b82f6"],
};

const bookingsSeries = [{ name: "Bookings", data: [8, 12, 6, 14, 18, 24, 10] }];

// Mock today's schedule
const todaySchedule = [
	{
		id: "1",
		time: "09:00",
		customer: "John Smith",
		service: "Full Detail Wash",
		status: "booked",
		vehicle: "BMW X5",
	},
	{
		id: "2",
		time: "10:30",
		customer: "Sarah Johnson",
		service: "Premium Wash",
		status: "booked",
		vehicle: "Tesla Model 3",
	},
	{
		id: "3",
		time: "12:00",
		customer: "Mike Brown",
		service: "Interior Clean",
		status: "in_progress",
		vehicle: "Audi A4",
	},
	{
		id: "4",
		time: "14:00",
		customer: "Emily Davis",
		service: "Basic Wash",
		status: "completed",
		vehicle: "Honda Civic",
	},
	{
		id: "5",
		time: "15:30",
		customer: "James Wilson",
		service: "Full Detail Wash",
		status: "booked",
		vehicle: "Mercedes C-Class",
	},
];

// Mock recent activity
const recentActivity = [
	{
		id: "1",
		type: "booking",
		message: "New booking from Sarah Johnson",
		time: "5 min ago",
	},
	{
		id: "2",
		type: "review",
		message: "John Smith left a 5-star review",
		time: "1 hour ago",
	},
	{
		id: "3",
		type: "payment",
		message: "Payment of €85 received",
		time: "2 hours ago",
	},
	{
		id: "4",
		type: "booking",
		message: "Booking completed for Mike Brown",
		time: "3 hours ago",
	},
	{
		id: "5",
		type: "review",
		message: "New review: 4 stars from Emily Davis",
		time: "5 hours ago",
	},
];

const statusColors: Record<string, string> = {
	booked: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
	completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	picked: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
	out_for_delivery: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
	delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
	rescheduled: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const activityIcons: Record<string, React.ReactNode> = {
	booking: <Calendar className="h-4 w-4 text-blue-500" />,
	review: <Star className="h-4 w-4 text-yellow-500" />,
	payment: <CreditCard className="h-4 w-4 text-green-500" />,
};

export default function PartnerDashboard() {
	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-500">+2</span> from yesterday
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">€485</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-500">+12%</span> from yesterday
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Average Rating</CardTitle>
						<Star className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">4.8</div>
						<p className="text-xs text-muted-foreground">Based on 156 reviews</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">5</div>
						<p className="text-xs text-muted-foreground">Scheduled for today</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Revenue Trend */}
				<Card>
					<CardHeader>
						<CardTitle>Revenue Trend</CardTitle>
						<CardDescription>Last 7 days</CardDescription>
					</CardHeader>
					<CardContent>
						<Chart type="area" height={300} options={revenueChartOptions} series={revenueSeries} />
					</CardContent>
				</Card>

				{/* Bookings Trend */}
				<Card>
					<CardHeader>
						<CardTitle>Bookings Trend</CardTitle>
						<CardDescription>Last 7 days</CardDescription>
					</CardHeader>
					<CardContent>
						<Chart type="bar" height={300} options={bookingsChartOptions} series={bookingsSeries} />
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
						<Link to="/partner/schedule">
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
						<Link to="/partner/settings">
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
				{/* Today's Schedule */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Today's Schedule</CardTitle>
							<CardDescription>Your upcoming appointments</CardDescription>
						</div>
						<Link to="/partner/schedule">
							<Button variant="ghost" size="sm" className="gap-1">
								View All <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{todaySchedule.map((booking) => (
								<div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
											<Car className="h-5 w-5 text-primary" />
										</div>
										<div>
											<p className="font-medium">{booking.customer}</p>
											<p className="text-sm text-muted-foreground">
												{booking.service} • {booking.vehicle}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Badge className={statusColors[booking.status]}>{booking.status.replace("_", " ")}</Badge>
										<span className="text-sm font-medium">{booking.time}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>Latest updates</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentActivity.map((activity) => (
								<div key={activity.id} className="flex items-start gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
										{activityIcons[activity.type]}
									</div>
									<div className="flex-1">
										<p className="text-sm">{activity.message}</p>
										<p className="text-xs text-muted-foreground">{activity.time}</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* In Progress Bookings */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5 text-purple-500" />
						In Progress
					</CardTitle>
					<CardDescription>Bookings currently being serviced</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{todaySchedule
							.filter((b) => b.status === "in_progress")
							.map((booking) => (
								<div
									key={booking.id}
									className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950"
								>
									<div>
										<p className="font-medium">{booking.customer}</p>
										<p className="text-sm text-muted-foreground">
											{booking.time} • {booking.service}
										</p>
									</div>
									<div className="flex gap-2">
										<Button size="sm" className="gap-1">
											<CheckCircle className="h-4 w-4" />
											Mark Complete
										</Button>
									</div>
								</div>
							))}
						{todaySchedule.filter((b) => b.status === "in_progress").length === 0 && (
							<p className="text-center text-muted-foreground py-4">No bookings in progress</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
