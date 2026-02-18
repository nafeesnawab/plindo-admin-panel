import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, Building2, CheckCircle, Eye, Mail, Smartphone, User, Users, XCircle } from "lucide-react";
import { useState } from "react";
import notificationService, { type Notification } from "@/api/services/notificationService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Progress } from "@/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function NotificationHistoryPage() {
	const [page, setPage] = useState(1);
	const [recipientFilter, setRecipientFilter] = useState<string>("");
	const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["notifications", page, recipientFilter],
		queryFn: () =>
			notificationService.getHistory({
				page,
				limit: 10,
				recipientType: recipientFilter || undefined,
			}),
	});

	const getRecipientIcon = (type: string) => {
		switch (type) {
			case "all_users":
				return <Users className="h-4 w-4" />;
			case "all_customers":
				return <User className="h-4 w-4" />;
			case "all_partners":
				return <Building2 className="h-4 w-4" />;
			case "specific_user":
				return <User className="h-4 w-4" />;
			default:
				return <Users className="h-4 w-4" />;
		}
	};

	const getRecipientLabel = (type: string) => {
		switch (type) {
			case "all_users":
				return "All Users";
			case "all_customers":
				return "All Customers";
			case "all_partners":
				return "All Partners";
			case "specific_user":
				return "Specific User";
			default:
				return type;
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "sent":
				return <Badge className="bg-blue-500/10 text-blue-600">Sent</Badge>;
			case "delivered":
				return <Badge className="bg-green-500/10 text-green-600">Delivered</Badge>;
			case "failed":
				return <Badge className="bg-red-500/10 text-red-600">Failed</Badge>;
			case "partial":
				return <Badge className="bg-yellow-500/10 text-yellow-600">Partial</Badge>;
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "push":
				return <Smartphone className="h-4 w-4" />;
			case "email":
				return <Mail className="h-4 w-4" />;
			case "both":
				return <Bell className="h-4 w-4" />;
			default:
				return <Bell className="h-4 w-4" />;
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							Notification History
						</CardTitle>
						<Select
							value={recipientFilter}
							onValueChange={(v) => {
								setRecipientFilter(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All Recipients" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Recipients</SelectItem>
								<SelectItem value="all_users">All Users</SelectItem>
								<SelectItem value="all_customers">All Customers</SelectItem>
								<SelectItem value="all_partners">All Partners</SelectItem>
								<SelectItem value="specific_user">Specific User</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					{data?.items.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">No notifications found</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Title</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Recipients</TableHead>
									<TableHead>Sent</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Delivery Rate</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((notification) => (
									<TableRow key={notification.id}>
										<TableCell>
											<p className="font-medium truncate max-w-[200px]">{notification.title}</p>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												{getTypeIcon(notification.notificationType)}
												<span className="text-sm capitalize">{notification.notificationType}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												{getRecipientIcon(notification.recipientType)}
												<span className="text-sm">{getRecipientLabel(notification.recipientType)}</span>
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground">
												{format(new Date(notification.sentAt), "MMM dd, HH:mm")}
											</span>
										</TableCell>
										<TableCell>{getStatusBadge(notification.status)}</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Progress value={notification.stats.deliveryRate} className="w-16 h-2" />
												<span className="text-sm">{notification.stats.deliveryRate}%</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<Button variant="ghost" size="icon" onClick={() => setSelectedNotification(notification)}>
												<Eye className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} of {data.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Notification Details</DialogTitle>
					</DialogHeader>
					{selectedNotification && (
						<div className="space-y-4">
							<div>
								<p className="text-sm text-muted-foreground">Title</p>
								<p className="font-medium">{selectedNotification.title}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Message</p>
								<p className="text-sm whitespace-pre-wrap">{selectedNotification.body}</p>
							</div>
							<div className="flex gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Type</p>
									<div className="flex items-center gap-1">
										{getTypeIcon(selectedNotification.notificationType)}
										<span className="capitalize">{selectedNotification.notificationType}</span>
									</div>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Recipients</p>
									<div className="flex items-center gap-1">
										{getRecipientIcon(selectedNotification.recipientType)}
										<span>{getRecipientLabel(selectedNotification.recipientType)}</span>
									</div>
								</div>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Sent At</p>
								<p>{format(new Date(selectedNotification.sentAt), "PPpp")}</p>
							</div>

							<div className="border-t pt-4">
								<p className="font-medium mb-3">Delivery Statistics</p>
								<div className="grid grid-cols-2 gap-4">
									<div className="p-3 border rounded-lg">
										<div className="flex items-center gap-2 text-blue-600">
											<Bell className="h-4 w-4" />
											<span className="text-sm">Sent</span>
										</div>
										<p className="text-xl font-bold">{selectedNotification.stats.sentCount.toLocaleString()}</p>
									</div>
									<div className="p-3 border rounded-lg">
										<div className="flex items-center gap-2 text-green-600">
											<CheckCircle className="h-4 w-4" />
											<span className="text-sm">Delivered</span>
										</div>
										<p className="text-xl font-bold">{selectedNotification.stats.deliveredCount.toLocaleString()}</p>
									</div>
									<div className="p-3 border rounded-lg">
										<div className="flex items-center gap-2 text-purple-600">
											<Eye className="h-4 w-4" />
											<span className="text-sm">Opened</span>
										</div>
										<p className="text-xl font-bold">{selectedNotification.stats.openedCount.toLocaleString()}</p>
									</div>
									<div className="p-3 border rounded-lg">
										<div className="flex items-center gap-2 text-red-600">
											<XCircle className="h-4 w-4" />
											<span className="text-sm">Failed</span>
										</div>
										<p className="text-xl font-bold">{selectedNotification.stats.failedCount.toLocaleString()}</p>
									</div>
								</div>
								<div className="mt-4 grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Delivery Rate</p>
										<div className="flex items-center gap-2">
											<Progress value={selectedNotification.stats.deliveryRate} className="flex-1 h-2" />
											<span className="font-medium">{selectedNotification.stats.deliveryRate}%</span>
										</div>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Open Rate</p>
										<div className="flex items-center gap-2">
											<Progress value={selectedNotification.stats.openRate} className="flex-1 h-2" />
											<span className="font-medium">{selectedNotification.stats.openRate}%</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
