import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
	pending: "bg-yellow-500/10 text-yellow-500",
	confirmed: "bg-blue-500/10 text-blue-500",
	in_progress: "bg-purple-500/10 text-purple-500",
	completed: "bg-green-500/10 text-green-500",
	cancelled: "bg-red-500/10 text-red-500",
};

const statusLabels: Record<string, string> = {
	pending: "Pending",
	confirmed: "Confirmed",
	in_progress: "In Progress",
	completed: "Completed",
	cancelled: "Cancelled",
};

export default function RecentBookings() {
	const { data, isLoading } = useQuery({
		queryKey: ["recent-bookings"],
		queryFn: dashboardService.getRecentBookings,
	});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-full" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-32" />
							</div>
							<Skeleton className="h-5 w-16" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Bookings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{data?.slice(0, 5).map((booking) => (
					<div key={booking.id} className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							<AvatarFallback className="bg-primary/10 text-primary text-xs">
								{booking.customerName.split(" ").map((n) => n[0]).join("")}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">{booking.customerName}</p>
							<p className="text-xs text-muted-foreground truncate">
								{booking.service} • €{booking.amount.toFixed(2)}
							</p>
						</div>
						<div className="flex flex-col items-end gap-1">
							<Badge variant="secondary" className={statusColors[booking.status]}>
								{statusLabels[booking.status]}
							</Badge>
							<span className="text-xs text-muted-foreground">
								{formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
							</span>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
