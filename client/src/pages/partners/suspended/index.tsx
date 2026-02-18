import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Eye, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import partnerService, { type Partner } from "@/api/services/partnerService";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function SuspendedPartners() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
	const [showReactivateDialog, setShowReactivateDialog] = useState(false);
	const [showRemoveDialog, setShowRemoveDialog] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["suspended-partners", page],
		queryFn: () => partnerService.getSuspendedPartners({ page, limit: 10 }),
	});

	const reactivateMutation = useMutation({
		mutationFn: (id: string) => partnerService.reactivatePartner(id),
		onSuccess: () => {
			toast.success("Partner reactivated");
			queryClient.invalidateQueries({ queryKey: ["suspended-partners"] });
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
			setShowReactivateDialog(false);
			setSelectedPartner(null);
		},
		onError: () => {
			toast.error("Failed to reactivate partner");
		},
	});

	const removeMutation = useMutation({
		mutationFn: (id: string) => partnerService.removePartner(id),
		onSuccess: () => {
			toast.success("Partner removed permanently");
			queryClient.invalidateQueries({ queryKey: ["suspended-partners"] });
			setShowRemoveDialog(false);
			setSelectedPartner(null);
		},
		onError: () => {
			toast.error("Failed to remove partner");
		},
	});

	const handleReactivate = () => {
		if (selectedPartner) {
			reactivateMutation.mutate(selectedPartner.id);
		}
	};

	const handleRemove = () => {
		if (selectedPartner) {
			removeMutation.mutate(selectedPartner.id);
		}
	};

	const openReactivateDialog = (partner: Partner) => {
		setSelectedPartner(partner);
		setShowReactivateDialog(true);
	};

	const openRemoveDialog = (partner: Partner) => {
		setSelectedPartner(partner);
		setShowRemoveDialog(true);
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
						<span>Suspended Partners</span>
						<Badge variant="secondary" className="text-lg bg-red-500/10 text-red-600">
							{data?.total || 0} suspended
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">No suspended partners</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Business</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Suspension Reason</TableHead>
									<TableHead>Suspended</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((partner) => (
									<TableRow key={partner.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarFallback className="bg-red-500/10 text-red-600 text-xs">
														{partner.businessName
															.split(" ")
															.slice(0, 2)
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium">{partner.businessName}</p>
													<p className="text-xs text-muted-foreground">{partner.ownerName}</p>
												</div>
											</div>
										</TableCell>
										<TableCell>{partner.location}</TableCell>
										<TableCell>
											<p className="text-sm text-red-600 max-w-[200px] truncate">{partner.suspensionReason}</p>
										</TableCell>
										<TableCell>
											{partner.suspendedAt && formatDistanceToNow(new Date(partner.suspendedAt), { addSuffix: true })}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partner.id}`)}>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-green-600 hover:text-green-700 hover:bg-green-50"
													onClick={() => openReactivateDialog(partner)}
												>
													<Play className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													onClick={() => openRemoveDialog(partner)}
												>
													<Trash2 className="h-4 w-4" />
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

			<Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reactivate Partner</DialogTitle>
						<DialogDescription>
							Are you sure you want to reactivate {selectedPartner?.businessName}? They will be moved back to active
							partners.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowReactivateDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleReactivate} disabled={reactivateMutation.isPending}>
							Reactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove Partner Permanently</DialogTitle>
						<DialogDescription>
							Are you sure you want to permanently remove {selectedPartner?.businessName}? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleRemove} disabled={removeMutation.isPending}>
							Remove Permanently
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
