import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
	pending: "bg-yellow-500/10 text-yellow-500",
	approved: "bg-green-500/10 text-green-500",
	rejected: "bg-red-500/10 text-red-500",
};

const statusLabels: Record<string, string> = {
	pending: "Pending",
	approved: "Approved",
	rejected: "Rejected",
};

export default function RecentPartnerApplications() {
	const { data, isLoading } = useQuery({
		queryKey: ["recent-partner-applications"],
		queryFn: dashboardService.getRecentPartnerApplications,
	});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
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
				<CardTitle>Partner Applications</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{data?.slice(0, 5).map((application) => (
					<div key={application.id} className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							<AvatarFallback className="bg-purple-500/10 text-purple-500 text-xs">
								{application.businessName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">{application.businessName}</p>
							<p className="text-xs text-muted-foreground truncate">{application.location}</p>
						</div>
						<div className="flex flex-col items-end gap-1">
							<Badge variant="secondary" className={statusColors[application.status]}>
								{statusLabels[application.status]}
							</Badge>
							<span className="text-xs text-muted-foreground">
								{formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
							</span>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
