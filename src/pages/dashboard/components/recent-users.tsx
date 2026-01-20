import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function RecentUsers() {
	const { data, isLoading } = useQuery({
		queryKey: ["recent-users"],
		queryFn: dashboardService.getRecentUsers,
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
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Users</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{data?.slice(0, 5).map((user) => (
					<div key={user.id} className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							<AvatarImage src={user.avatar} alt={user.name} />
							<AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs">
								{user.name.split(" ").map((n) => n[0]).join("")}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">{user.name}</p>
							<p className="text-xs text-muted-foreground truncate">{user.email}</p>
						</div>
						<span className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(user.registeredAt), { addSuffix: true })}
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
