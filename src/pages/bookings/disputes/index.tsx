import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import bookingService, { type Booking } from "@/api/services/bookingService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
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
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Separator } from "@/ui/separator";
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
import { formatDistanceToNow, format } from "date-fns";
import {
	AlertTriangle,
	CheckCircle,
	Eye,
	FileImage,
	FileVideo,
	RefreshCw,
	Scale,
	UserX,
} from "lucide-react";
import { toast } from "sonner";

export default function DisputesPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
	const [showResolveDialog, setShowResolveDialog] = useState(false);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
	const [resolution, setResolution] = useState({
		action: "",
		notes: "",
		refundAmount: "",
	});

	const { data, isLoading } = useQuery({
		queryKey: ["disputes", page],
		queryFn: () => bookingService.getDisputes({ page, limit: 10 }),
	});

	const resolveMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: { action: string; notes: string; refundAmount?: number } }) =>
			bookingService.resolveDispute(id, data),
		onSuccess: () => {
			toast.success("Dispute resolved");
			queryClient.invalidateQueries({ queryKey: ["disputes"] });
			setShowResolveDialog(false);
			setSelectedBooking(null);
			setResolution({ action: "", notes: "", refundAmount: "" });
		},
		onError: () => {
			toast.error("Failed to resolve dispute");
		},
	});

	const openResolveDialog = (booking: Booking) => {
		setSelectedBooking(booking);
		setResolution({ action: "", notes: "", refundAmount: booking.payment.amount.toString() });
		setShowResolveDialog(true);
	};

	const openDetailsDialog = (booking: Booking) => {
		setSelectedBooking(booking);
		setShowDetailsDialog(true);
	};

	const handleResolve = () => {
		if (selectedBooking && resolution.action && resolution.notes) {
			resolveMutation.mutate({
				id: selectedBooking.id,
				data: {
					action: resolution.action,
					notes: resolution.notes,
					refundAmount: resolution.action === "refund" ? Number.parseFloat(resolution.refundAmount) : undefined,
				},
			});
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
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-orange-500" />
							<span>Disputed Bookings</span>
						</div>
						<Badge variant="secondary" className="text-lg bg-orange-500/10 text-orange-600">
							{data?.total || 0} disputes
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{data?.items.length === 0 ? (
						<div className="text-center py-12">
							<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
							<p className="text-lg font-medium">No disputes to review</p>
							<p className="text-muted-foreground">All disputes have been resolved</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Booking</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Partner</TableHead>
									<TableHead>Dispute Reason</TableHead>
									<TableHead>Evidence</TableHead>
									<TableHead>Filed</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell>
											<div>
												<p className="font-mono text-sm">{booking.bookingNumber}</p>
												<p className="text-xs text-muted-foreground">
													€{booking.payment.amount.toFixed(2)}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarImage src={booking.customer.avatar} alt={booking.customer.name} />
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{booking.customer.name.split(" ").map((n) => n[0]).join("")}
													</AvatarFallback>
												</Avatar>
												<span className="text-sm">{booking.customer.name}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<p>{booking.partner.businessName}</p>
												<p className="text-xs text-muted-foreground">{booking.partner.location}</p>
											</div>
										</TableCell>
										<TableCell>
											<p className="text-sm max-w-[200px] truncate">{booking.dispute?.reason}</p>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{booking.dispute?.customerEvidence && (
													<div className="flex items-center gap-1">
														{booking.dispute.customerEvidence.filter(e => e.type === "photo").length > 0 && (
															<Badge variant="outline" className="gap-1">
																<FileImage className="h-3 w-3" />
																{booking.dispute.customerEvidence.filter(e => e.type === "photo").length}
															</Badge>
														)}
														{booking.dispute.customerEvidence.filter(e => e.type === "video").length > 0 && (
															<Badge variant="outline" className="gap-1">
																<FileVideo className="h-3 w-3" />
																{booking.dispute.customerEvidence.filter(e => e.type === "video").length}
															</Badge>
														)}
													</div>
												)}
												{booking.dispute?.partnerResponse && (
													<Badge variant="secondary" className="text-xs">Partner responded</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground">
												{booking.dispute?.createdAt && formatDistanceToNow(new Date(booking.dispute.createdAt), { addSuffix: true })}
											</span>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => openDetailsDialog(booking)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => openResolveDialog(booking)}
												>
													<Scale className="h-4 w-4 mr-1" />
													Resolve
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

			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-orange-500" />
							Dispute Details
						</DialogTitle>
						<DialogDescription>
							Booking: {selectedBooking?.bookingNumber}
						</DialogDescription>
					</DialogHeader>
					
					{selectedBooking?.dispute && (
						<div className="space-y-4 max-h-[60vh] overflow-y-auto">
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardHeader className="py-3">
										<CardTitle className="text-sm">Customer</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex items-center gap-2">
											<Avatar className="h-8 w-8">
												<AvatarImage src={selectedBooking.customer.avatar} />
												<AvatarFallback>{selectedBooking.customer.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
											</Avatar>
											<div>
												<p className="text-sm font-medium">{selectedBooking.customer.name}</p>
												<p className="text-xs text-muted-foreground">{selectedBooking.customer.email}</p>
											</div>
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="py-3">
										<CardTitle className="text-sm">Partner</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<p className="text-sm font-medium">{selectedBooking.partner.businessName}</p>
										<p className="text-xs text-muted-foreground">{selectedBooking.partner.location}</p>
									</CardContent>
								</Card>
							</div>

							<div>
								<h4 className="font-medium mb-2">Dispute Reason</h4>
								<p className="text-sm text-muted-foreground">{selectedBooking.dispute.reason}</p>
							</div>

							<div>
								<h4 className="font-medium mb-2">Description</h4>
								<p className="text-sm text-muted-foreground">{selectedBooking.dispute.description}</p>
							</div>

							<div>
								<h4 className="font-medium mb-2">Customer Evidence ({selectedBooking.dispute.customerEvidence.length})</h4>
								<div className="grid grid-cols-3 gap-2">
									{selectedBooking.dispute.customerEvidence.map((evidence, i) => (
										<div key={i} className="border rounded-lg p-3 text-center bg-muted/50">
											{evidence.type === "photo" ? (
												<FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
											) : (
												<FileVideo className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
											)}
											<p className="text-xs text-muted-foreground capitalize">{evidence.type}</p>
											<p className="text-xs text-muted-foreground">
												{format(new Date(evidence.uploadedAt), "MMM dd")}
											</p>
										</div>
									))}
								</div>
							</div>

							{selectedBooking.dispute.partnerResponse && (
								<>
									<Separator />
									<div>
										<h4 className="font-medium mb-2">Partner Response</h4>
										<p className="text-sm text-muted-foreground">{selectedBooking.dispute.partnerResponse.response}</p>
										<p className="text-xs text-muted-foreground mt-1">
											Responded {formatDistanceToNow(new Date(selectedBooking.dispute.partnerResponse.respondedAt), { addSuffix: true })}
										</p>
									</div>
									{selectedBooking.dispute.partnerResponse.evidence.length > 0 && (
										<div>
											<h4 className="font-medium mb-2">Partner Evidence ({selectedBooking.dispute.partnerResponse.evidence.length})</h4>
											<div className="grid grid-cols-3 gap-2">
												{selectedBooking.dispute.partnerResponse.evidence.map((evidence, i) => (
													<div key={i} className="border rounded-lg p-3 text-center bg-muted/50">
														{evidence.type === "photo" ? (
															<FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
														) : (
															<FileVideo className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
														)}
														<p className="text-xs text-muted-foreground capitalize">{evidence.type}</p>
													</div>
												))}
											</div>
										</div>
									)}
								</>
							)}
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
						<Button onClick={() => navigate(`/bookings/${selectedBooking?.id}`)}>
							View Full Booking
						</Button>
						<Button onClick={() => {
							setShowDetailsDialog(false);
							if (selectedBooking) openResolveDialog(selectedBooking);
						}}>
							<Scale className="h-4 w-4 mr-2" />
							Resolve Dispute
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Resolve Dispute</DialogTitle>
						<DialogDescription>
							Choose how to resolve the dispute for booking {selectedBooking?.bookingNumber}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Resolution Action</Label>
							<Select value={resolution.action} onValueChange={(v) => setResolution(prev => ({ ...prev, action: v }))}>
								<SelectTrigger>
									<SelectValue placeholder="Select action" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="refund">
										<div className="flex items-center gap-2">
											<RefreshCw className="h-4 w-4" />
											Issue Full/Partial Refund
										</div>
									</SelectItem>
									<SelectItem value="dismiss">
										<div className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4" />
											Dismiss Dispute (No Action)
										</div>
									</SelectItem>
									<SelectItem value="suspend_partner">
										<div className="flex items-center gap-2">
											<UserX className="h-4 w-4" />
											Refund & Suspend Partner
										</div>
									</SelectItem>
									<SelectItem value="suspend_customer">
										<div className="flex items-center gap-2">
											<UserX className="h-4 w-4" />
											Dismiss & Suspend Customer
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{(resolution.action === "refund" || resolution.action === "suspend_partner") && (
							<div>
								<Label>Refund Amount (€)</Label>
								<Input
									type="number"
									placeholder="Enter refund amount"
									value={resolution.refundAmount}
									onChange={(e) => setResolution(prev => ({ ...prev, refundAmount: e.target.value }))}
									max={selectedBooking?.payment.amount}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Maximum: €{selectedBooking?.payment.amount.toFixed(2)}
								</p>
							</div>
						)}

						<div>
							<Label>Resolution Notes</Label>
							<Textarea
								placeholder="Enter notes about the resolution..."
								value={resolution.notes}
								onChange={(e) => setResolution(prev => ({ ...prev, notes: e.target.value }))}
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
						<Button
							onClick={handleResolve}
							disabled={!resolution.action || !resolution.notes || resolveMutation.isPending}
						>
							Resolve Dispute
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
