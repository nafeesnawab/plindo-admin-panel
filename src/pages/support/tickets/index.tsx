import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, MessageSquare, Send, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import supportService, { type SupportTicket } from "@/api/services/supportService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

const statusColors: Record<string, string> = {
	open: "bg-yellow-500/10 text-yellow-600",
	in_progress: "bg-blue-500/10 text-blue-600",
	resolved: "bg-green-500/10 text-green-600",
	closed: "bg-gray-500/10 text-gray-600",
};

const priorityColors: Record<string, string> = {
	low: "bg-gray-500/10 text-gray-600",
	medium: "bg-blue-500/10 text-blue-600",
	high: "bg-orange-500/10 text-orange-600",
	urgent: "bg-red-500/10 text-red-600",
};

export default function SupportTicketsPage() {
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState("all");
	const [userTypeFilter, setUserTypeFilter] = useState("all");
	const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
	const [replyMessage, setReplyMessage] = useState("");
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: ["support-tickets", statusFilter, userTypeFilter, page],
		queryFn: () =>
			supportService.getTickets({
				status: statusFilter,
				userType: userTypeFilter,
				page,
				limit: 10,
			}),
	});

	const replyMutation = useMutation({
		mutationFn: () => supportService.replyToTicket(selectedTicket!.id, replyMessage),
		onSuccess: (updatedTicket) => {
			toast.success("Reply sent");
			setSelectedTicket(updatedTicket);
			setReplyMessage("");
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
		},
		onError: () => toast.error("Failed to send reply"),
	});

	const closeMutation = useMutation({
		mutationFn: (id: string) => supportService.closeTicket(id),
		onSuccess: () => {
			toast.success("Ticket closed");
			setSelectedTicket(null);
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[500px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Support Tickets</h1>
				<p className="text-muted-foreground">{data?.pagination.total || 0} total tickets</p>
			</div>

			<div className="flex gap-4">
				<div className="space-y-1">
					<Label>Status</Label>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="open">Open</SelectItem>
							<SelectItem value="in_progress">In Progress</SelectItem>
							<SelectItem value="resolved">Resolved</SelectItem>
							<SelectItem value="closed">Closed</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label>User Type</Label>
					<Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Users</SelectItem>
							<SelectItem value="customer">Customers</SelectItem>
							<SelectItem value="partner">Partners</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Ticket</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Assigned To</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.tickets.map((ticket) => (
								<TableRow key={ticket.id}>
									<TableCell>
										<div>
											<p className="font-medium">{ticket.ticketNumber}</p>
											<p className="text-sm text-muted-foreground truncate max-w-[200px]">{ticket.subject}</p>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Avatar className="h-8 w-8">
												<AvatarImage src={ticket.user.avatar} />
												<AvatarFallback>{ticket.user.name[0]}</AvatarFallback>
											</Avatar>
											<div>
												<p className="text-sm font-medium">{ticket.user.name}</p>
												<Badge variant="outline" className="text-xs">
													{ticket.userType}
												</Badge>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
									</TableCell>
									<TableCell>
										<Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
									</TableCell>
									<TableCell>{ticket.assignedTo || "-"}</TableCell>
									<TableCell>{format(new Date(ticket.createdAt), "PP")}</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
											<MessageSquare className="h-4 w-4 mr-1" />
											View
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{data && data.pagination.totalPages > 1 && (
				<div className="flex justify-center gap-2">
					<Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
						Previous
					</Button>
					<span className="py-2 px-3 text-sm">
						Page {page} of {data.pagination.totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page === data.pagination.totalPages}
						onClick={() => setPage(page + 1)}
					>
						Next
					</Button>
				</div>
			)}

			<Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between">
							<span>
								{selectedTicket?.ticketNumber} - {selectedTicket?.subject}
							</span>
							<Badge className={statusColors[selectedTicket?.status || "open"]}>
								{selectedTicket?.status?.replace("_", " ")}
							</Badge>
						</DialogTitle>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto space-y-4">
						<Card>
							<CardHeader className="py-3">
								<CardTitle className="text-sm flex items-center gap-2">
									<User className="h-4 w-4" />
									{selectedTicket?.user.name} ({selectedTicket?.userType})
								</CardTitle>
							</CardHeader>
							<CardContent className="py-2">
								<p className="text-sm">{selectedTicket?.description}</p>
							</CardContent>
						</Card>

						<div className="space-y-3">
							{selectedTicket?.messages.map((msg) => (
								<div
									key={msg.id}
									className={`p-3 rounded-lg ${msg.senderType === "admin" ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}
								>
									<div className="flex items-center gap-2 mb-1">
										<span className="text-sm font-medium">{msg.senderName}</span>
										<span className="text-xs text-muted-foreground">{format(new Date(msg.timestamp), "PPp")}</span>
									</div>
									<p className="text-sm">{msg.message}</p>
								</div>
							))}
						</div>

						{selectedTicket?.status !== "closed" && (
							<div className="space-y-2">
								<Label>Reply</Label>
								<Textarea
									value={replyMessage}
									onChange={(e) => setReplyMessage(e.target.value)}
									placeholder="Type your response..."
									rows={3}
								/>
							</div>
						)}
					</div>

					<DialogFooter className="gap-2">
						{selectedTicket?.status !== "closed" && (
							<>
								<Button
									variant="outline"
									onClick={() => closeMutation.mutate(selectedTicket!.id)}
									disabled={closeMutation.isPending}
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									Close Ticket
								</Button>
								<Button
									onClick={() => replyMutation.mutate()}
									disabled={!replyMessage.trim() || replyMutation.isPending}
								>
									<Send className="h-4 w-4 mr-2" />
									Send Reply
								</Button>
							</>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
