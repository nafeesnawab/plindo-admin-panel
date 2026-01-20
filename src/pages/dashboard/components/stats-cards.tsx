import type { DashboardStats } from "@/api/services/dashboardService";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { Users, Calendar, Euro, UserPlus } from "lucide-react";

interface StatsCardsProps {
	stats: DashboardStats | undefined;
	isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-20 mb-1" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const cards = [
		{
			title: "Active Users",
			value: stats?.activeUsers?.toLocaleString() ?? "0",
			description: "Total registered users",
			icon: Users,
			color: "text-blue-500",
			bgColor: "bg-blue-500/10",
		},
		{
			title: "Bookings Today",
			value: stats?.bookingsToday?.total?.toString() ?? "0",
			description: `${stats?.bookingsToday?.completed ?? 0} completed, ${stats?.bookingsToday?.pending ?? 0} pending`,
			icon: Calendar,
			color: "text-green-500",
			bgColor: "bg-green-500/10",
		},
		{
			title: "Revenue Today",
			value: `€${stats?.revenueToday?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}`,
			description: "Total earnings today",
			icon: Euro,
			color: "text-yellow-500",
			bgColor: "bg-yellow-500/10",
		},
		{
			title: "Pending Applications",
			value: stats?.pendingPartnerApplications?.toString() ?? "0",
			description: "Partner applications to review",
			icon: UserPlus,
			color: "text-purple-500",
			bgColor: "bg-purple-500/10",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.title}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
						<div className={`p-2 rounded-lg ${card.bgColor}`}>
							<card.icon className={`h-4 w-4 ${card.color}`} />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{card.value}</div>
						<p className="text-xs text-muted-foreground">{card.description}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
