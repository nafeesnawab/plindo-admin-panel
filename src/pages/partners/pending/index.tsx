import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import partnerService, { type Partner } from "@/api/services/partnerService";
import { Avatar, AvatarFallback } from "@/ui/avatar";
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
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import { Textarea } from "@/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Check, Eye, X } from "lucide-react";
import { toast } from "sonner";

export default function PendingApplications() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [showRejectDialog, setShowRejectDialog] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["pending-partners", page],
		queryFn: () => partnerService.getPendingPartners({ page, limit: 10 }),
	});

	const approveMutation = useMutation({
		mutationFn: (id: string) => partnerService.approvePartner(id),
		onSuccess: () => {
			toast.success("Partner approved successfully");
			queryClient.invalidateQueries({ queryKey: ["pending-partners"] });
			setSelectedPartner(null);
		},
		onError: () => {
			toast.error("Failed to approve partner");
		},
	});

	const rejectMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			partnerService.rejectPartner(id, reason),
		onSuccess: () => {
			toast.success("Partner rejected");
			queryClient.invalidateQueries({ queryKey: ["pending-partners"] });
			setShowRejectDialog(false);
			setSelectedPartner(null);
			setRejectReason("");
		},
		onError: () => {
			toast.error("Failed to reject partner");
		},
	});

	const handleApprove = (partner: Partner) => {
		approveMutation.mutate(partner.id);
	};

	const handleReject = () => {
		if (selectedPartner && rejectReason) {
			rejectMutation.mutate({ id: selectedPartner.id, reason: rejectReason });
		}
	};

	const openRejectDialog = (partner: Partner) => {
		setSelectedPartner(partner);
		setShowRejectDialog(true);
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
					<CardTitle className="flex items-center justify-between">
						<span>Pending Applications</span>
						<Badge variant="secondary" className="text-lg">
							{data?.total || 0} pending
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No pending applications
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Business</TableHead>
									<TableHead>Owner</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Applied</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((partner) => (
									<TableRow key={partner.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{partner.businessName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium">{partner.businessName}</p>
													<p className="text-xs text-muted-foreground">
														License: {partner.businessLicense}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell>{partner.ownerName}</TableCell>
										<TableCell>{partner.location}</TableCell>
										<TableCell>
											<div className="text-sm">
												<p>{partner.email}</p>
												<p className="text-muted-foreground">{partner.phone}</p>
											</div>
										</TableCell>
										<TableCell>
											{formatDistanceToNow(new Date(partner.appliedAt), { addSuffix: true })}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => navigate(`/partners/${partner.id}`)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-green-600 hover:text-green-700 hover:bg-green-50"
													onClick={() => handleApprove(partner)}
													disabled={approveMutation.isPending}
												>
													<Check className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													onClick={() => openRejectDialog(partner)}
												>
													<X className="h-4 w-4" />
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

			<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Application</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting {selectedPartner?.businessName}'s application.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter rejection reason..."
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
						rows={4}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowRejectDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={!rejectReason || rejectMutation.isPending}
						>
							Reject
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
