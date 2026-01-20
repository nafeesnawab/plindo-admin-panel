import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import financeService, { type Payout } from "@/api/services/financeService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import { format } from "date-fns";
import {
	Check,
	Clock,
	Download,
	DollarSign,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function PayoutsPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["payouts", page, statusFilter],
		queryFn: () =>
			financeService.getPayouts({
				page,
				limit: 10,
				status: statusFilter || undefined,
			}),
	});

	const markPaidMutation = useMutation({
		mutationFn: (id: string) => financeService.markPayoutPaid(id),
		onSuccess: () => {
			toast.success("Payout marked as paid");
			queryClient.invalidateQueries({ queryKey: ["payouts"] });
			setShowConfirmDialog(false);
			setSelectedPayout(null);
		},
		onError: () => {
			toast.error("Failed to mark payout as paid");
		},
	});

	const handleDownloadReport = (payout: Payout) => {
		const content = `
PAYOUT REPORT
=============
Partner: ${payout.partner.businessName}
Owner: ${payout.partner.ownerName}
Bank Account: ${payout.partner.bankAccount}

Period: ${format(new Date(payout.period.start), "MMM dd, yyyy")} - ${format(new Date(payout.period.end), "MMM dd, yyyy")}

Total Bookings: ${payout.totalBookings}
Gross Earnings: €${payout.grossEarnings.toFixed(2)}
Commission Deducted (10%): €${payout.commissionDeducted.toFixed(2)}
Net Payout: €${payout.netPayout.toFixed(2)}

Status: ${payout.status.toUpperCase()}
${payout.paidAt ? `Paid At: ${format(new Date(payout.paidAt), "MMM dd, yyyy HH:mm")}` : ""}
		`.trim();

		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `payout-${payout.partner.businessName.replace(/\s+/g, "-")}-${format(new Date(payout.period.start), "yyyy-MM-dd")}.txt`;
		link.click();
		URL.revokeObjectURL(url);
		toast.success("Report downloaded");
	};

	const openConfirmDialog = (payout: Payout) => {
		setSelectedPayout(payout);
		setShowConfirmDialog(true);
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
				<Skeleton className="h-[400px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Partner Payouts</h1>
				<Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="All Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-yellow-500/10">
								<Clock className="h-5 w-5 text-yellow-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Pending Payouts</p>
								<p className="text-xl font-bold">{data?.summary.pendingCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-orange-500/10">
								<Wallet className="h-5 w-5 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Pending Amount</p>
								<p className="text-xl font-bold">€{data?.summary.totalPending.toFixed(2)}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-green-500/10">
								<Check className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Paid Payouts</p>
								<p className="text-xl font-bold">{data?.summary.paidCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-blue-500/10">
								<DollarSign className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Total Paid</p>
								<p className="text-xl font-bold">€{data?.summary.totalPaid.toFixed(2)}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Payout Schedule (Weekly)</span>
						<Badge variant="secondary">{data?.total} payouts</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No payouts found
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Partner</TableHead>
									<TableHead>Period</TableHead>
									<TableHead className="text-right">Bookings</TableHead>
									<TableHead className="text-right">Gross</TableHead>
									<TableHead className="text-right">Commission</TableHead>
									<TableHead className="text-right">Net Payout</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((payout) => (
									<TableRow key={payout.id}>
										<TableCell>
											<div>
												<p className="font-medium">{payout.partner.businessName}</p>
												<p className="text-xs text-muted-foreground">{payout.partner.ownerName}</p>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<p>{format(new Date(payout.period.start), "MMM dd")} - {format(new Date(payout.period.end), "MMM dd")}</p>
											</div>
										</TableCell>
										<TableCell className="text-right">{payout.totalBookings}</TableCell>
										<TableCell className="text-right">€{payout.grossEarnings.toFixed(2)}</TableCell>
										<TableCell className="text-right text-red-600">-€{payout.commissionDeducted.toFixed(2)}</TableCell>
										<TableCell className="text-right font-bold">€{payout.netPayout.toFixed(2)}</TableCell>
										<TableCell>
											{payout.status === "paid" ? (
												<Badge className="bg-green-500/10 text-green-600">Paid</Badge>
											) : (
												<Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												{payout.status === "pending" && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => openConfirmDialog(payout)}
													>
														<Check className="h-4 w-4 mr-1" />
														Mark Paid
													</Button>
												)}
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDownloadReport(payout)}
												>
													<Download className="h-4 w-4" />
												</Button>
											</div>
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

			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Payout</DialogTitle>
						<DialogDescription>
							Are you sure you want to mark this payout as paid?
						</DialogDescription>
					</DialogHeader>
					{selectedPayout && (
						<div className="space-y-2 py-4">
							<p><strong>Partner:</strong> {selectedPayout.partner.businessName}</p>
							<p><strong>Bank Account:</strong> {selectedPayout.partner.bankAccount}</p>
							<p><strong>Amount:</strong> €{selectedPayout.netPayout.toFixed(2)}</p>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => selectedPayout && markPaidMutation.mutate(selectedPayout.id)}
							disabled={markPaidMutation.isPending}
						>
							<Check className="h-4 w-4 mr-2" />
							Confirm Payment
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
