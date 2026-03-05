import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import refundRequestsService, { type RefundRequest } from "@/api/services/refundRequestsService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

const STATUS_MAP = {
	pending_review: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
	approved: { label: "Approved", color: "bg-green-500/10 text-green-600", icon: CheckCircle },
	rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600", icon: XCircle },
};

export default function RefundRequestsPage() {
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState("all");
	const [selected, setSelected] = useState<RefundRequest | null>(null);
	const [action, setAction] = useState<"approve" | "reject" | null>(null);
	const [note, setNote] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["refund-requests", statusFilter],
		queryFn: () => refundRequestsService.getAll({ status: statusFilter === "all" ? undefined : statusFilter }),
	});

	const approveMutation = useMutation({
		mutationFn: ({ id, note }: { id: string; note: string }) => refundRequestsService.approve(id, note),
		onSuccess: () => {
			toast.success("Refund approved");
			queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
			setSelected(null);
		},
		onError: () => toast.error("Failed to approve refund"),
	});

	const rejectMutation = useMutation({
		mutationFn: ({ id, note }: { id: string; note: string }) => refundRequestsService.reject(id, note),
		onSuccess: () => {
			toast.success("Refund rejected");
			queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
			setSelected(null);
		},
		onError: () => toast.error("Failed to reject refund"),
	});

	const handleConfirm = () => {
		if (!selected || !action) return;
		if (action === "approve") approveMutation.mutate({ id: selected._id, note });
		else rejectMutation.mutate({ id: selected._id, note });
	};

	const pendingCount = data?.pendingCount ?? 0;

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold">Refund Requests</h2>
					{pendingCount > 0 && (
						<Badge className="bg-yellow-500/10 text-yellow-600">{pendingCount} pending</Badge>
					)}
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="pending_review">Pending</SelectItem>
						<SelectItem value="approved">Approved</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Card className="flex-1 min-h-0">
				<CardHeader>
					<CardTitle>Requests ({data?.total ?? 0})</CardTitle>
				</CardHeader>
				<CardContent className="overflow-auto">
					{isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Customer</TableHead>
									<TableHead>Booking #</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Cancellation #</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(data?.requests ?? []).map((r) => {
									const st = STATUS_MAP[r.status];
									return (
										<TableRow key={r._id}>
											<TableCell>
												<div className="font-medium">{r.customerName}</div>
												<div className="text-xs text-muted-foreground">{r.customerEmail}</div>
											</TableCell>
											<TableCell className="font-mono text-sm">{r.bookingNumber}</TableCell>
											<TableCell className="text-right font-medium">
												EUR{r.amount.toFixed(2)}
											</TableCell>
											<TableCell>
												<Badge variant="outline">#{r.cancellationCount}</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{format(new Date(r.createdAt), "MMM dd, yyyy")}
											</TableCell>
											<TableCell>
												<Badge className={st.color}>{st.label}</Badge>
											</TableCell>
											<TableCell>
												{r.status === "pending_review" && (
													<div className="flex gap-2">
														<Button
															size="sm"
															variant="outline"
															className="text-green-600 border-green-300"
															onClick={() => { setSelected(r); setAction("approve"); setNote(""); }}
														>
															Approve
														</Button>
														<Button
															size="sm"
															variant="outline"
															className="text-red-600 border-red-300"
															onClick={() => { setSelected(r); setAction("reject"); setNote(""); }}
														>
															Reject
														</Button>
													</div>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{action === "approve" ? "Approve" : "Reject"} Refund</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						{selected?.customerName} — EUR{selected?.amount.toFixed(2)} — Booking {selected?.bookingNumber}
					</p>
					<Textarea
						placeholder="Note (optional)"
						value={note}
						onChange={(e) => setNote(e.target.value)}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
						<Button
							onClick={handleConfirm}
							className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
							disabled={approveMutation.isPending || rejectMutation.isPending}
						>
							{action === "approve" ? "Confirm Approve" : "Confirm Reject"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
