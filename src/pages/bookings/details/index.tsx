import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	Ban,
	Calendar,
	Car,
	Check,
	CheckCircle,
	CreditCard,
	DollarSign,
	Mail,
	MapPin,
	MessageSquare,
	Phone,
	Play,
	RefreshCw,
	Star,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import bookingService from "@/api/services/bookingService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Separator } from "@/ui/separator";
import { Skeleton } from "@/ui/skeleton";
import { Textarea } from "@/ui/textarea";

const statusColors: Record<string, string> = {
	booked: "bg-blue-500/10 text-blue-600 border-blue-200",
	in_progress: "bg-purple-500/10 text-purple-600 border-purple-200",
	completed: "bg-green-500/10 text-green-600 border-green-200",
	picked: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
	out_for_delivery: "bg-amber-500/10 text-amber-600 border-amber-200",
	delivered: "bg-teal-500/10 text-teal-600 border-teal-200",
	cancelled: "bg-red-500/10 text-red-600 border-red-200",
	rescheduled: "bg-orange-500/10 text-orange-600 border-orange-200",
};

const statusIcons: Record<string, React.ReactNode> = {
	booked: <Check className="h-4 w-4" />,
	in_progress: <Play className="h-4 w-4" />,
	completed: <CheckCircle className="h-4 w-4" />,
	picked: <Car className="h-4 w-4" />,
	out_for_delivery: <RefreshCw className="h-4 w-4" />,
	delivered: <CheckCircle className="h-4 w-4" />,
	cancelled: <XCircle className="h-4 w-4" />,
	rescheduled: <Calendar className="h-4 w-4" />,
};

export default function BookingDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [cancelReason, setCancelReason] = useState("");
	const [refundAmount, setRefundAmount] = useState("");
	const [refundReason, setRefundReason] = useState("");
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showRefundDialog, setShowRefundDialog] = useState(false);

	const { data: booking, isLoading } = useQuery({
		queryKey: ["booking-details", id],
		queryFn: () => bookingService.getBookingDetails(id!),
		enabled: !!id,
	});

	const cancelMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingService.cancelBooking(id, reason),
		onSuccess: () => {
			toast.success("Booking cancelled");
			queryClient.invalidateQueries({ queryKey: ["booking-details", id] });
			setShowCancelDialog(false);
			setCancelReason("");
		},
	});

	const refundMutation = useMutation({
		mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
			bookingService.issueRefund(id, amount, reason),
		onSuccess: () => {
			toast.success("Refund issued");
			queryClient.invalidateQueries({ queryKey: ["booking-details", id] });
			setShowRefundDialog(false);
			setRefundAmount("");
			setRefundReason("");
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-32" />
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Skeleton className="h-[400px] lg:col-span-2" />
					<Skeleton className="h-[400px]" />
				</div>
			</div>
		);
	}

	if (!booking) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Booking not found</p>
				<Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
					Go Back
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold font-mono">{booking.bookingNumber}</h1>
						<p className="text-sm text-muted-foreground">
							Created {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
						</p>
					</div>
					<Badge className={statusColors[booking.status]}>{booking.status.replace("_", " ").toUpperCase()}</Badge>
					{booking.isDisputed && (
						<Badge variant="destructive" className="gap-1">
							<AlertTriangle className="h-3 w-3" />
							Disputed
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					{(booking.status === "pending" || booking.status === "confirmed") && (
						<Button variant="outline" className="text-red-600" onClick={() => setShowCancelDialog(true)}>
							<Ban className="h-4 w-4 mr-2" />
							Cancel Booking
						</Button>
					)}
					{booking.status === "completed" && booking.payment.status === "paid" && (
						<Button
							variant="outline"
							onClick={() => {
								setRefundAmount(booking.payment.amount.toString());
								setShowRefundDialog(true);
							}}
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Issue Refund
						</Button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Service Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Service</p>
									<p className="font-medium">{booking.service.name}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Duration</p>
									<p className="font-medium">{booking.service.duration} mins</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Scheduled Date</p>
									<p className="font-medium">{format(new Date(booking.scheduledDate), "MMM dd, yyyy")}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Scheduled Time</p>
									<p className="font-medium">{format(new Date(booking.scheduledDate), "hh:mm a")}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5" />
									Customer Details
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Avatar className="h-12 w-12">
										<AvatarImage src={booking.customer.avatar} alt={booking.customer.name} />
										<AvatarFallback className="bg-primary/10 text-primary">
											{booking.customer.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium">{booking.customer.name}</p>
										<p className="text-sm text-muted-foreground">Customer</p>
									</div>
								</div>
								<Separator />
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<span>{booking.customer.email}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<span>{booking.customer.phone}</span>
									</div>
								</div>
								<Button variant="outline" size="sm" className="w-full">
									<MessageSquare className="h-4 w-4 mr-2" />
									Contact Customer
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="h-5 w-5" />
									Partner Details
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="font-medium">{booking.partner.businessName}</p>
									<p className="text-sm text-muted-foreground">{booking.partner.ownerName}</p>
									<div className="flex items-center gap-1 mt-1">
										<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
										<span className="text-sm">{booking.partner.rating}</span>
									</div>
								</div>
								<Separator />
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										<span>{booking.partner.address}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<span>{booking.partner.phone}</span>
									</div>
								</div>
								<Button variant="outline" size="sm" className="w-full">
									<MessageSquare className="h-4 w-4 mr-2" />
									Contact Partner
								</Button>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Car className="h-5 w-5" />
								Vehicle Information
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Make</p>
									<p className="font-medium">{booking.vehicle.make}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Model</p>
									<p className="font-medium">{booking.vehicle.model}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Color</p>
									<p className="font-medium">{booking.vehicle.color}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Year</p>
									<p className="font-medium">{booking.vehicle.year}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Plate Number</p>
									<p className="font-medium font-mono">{booking.vehicle.plateNumber}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{booking.rating && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Star className="h-5 w-5" />
									Customer Review
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2 mb-2">
									{Array.from({ length: 5 }).map((_, i) => (
										<Star
											key={i}
											className={`h-5 w-5 ${i < booking.rating!.score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
										/>
									))}
									<span className="text-sm text-muted-foreground ml-2">
										{formatDistanceToNow(new Date(booking.rating.createdAt), { addSuffix: true })}
									</span>
								</div>
								{booking.rating.comment && (
									<p className="text-sm text-muted-foreground mt-2">"{booking.rating.comment}"</p>
								)}
							</CardContent>
						</Card>
					)}

					{booking.isDisputed && booking.dispute && (
						<Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-orange-600">
									<AlertTriangle className="h-5 w-5" />
									Dispute Details
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm font-medium">Reason</p>
									<p className="text-sm text-muted-foreground">{booking.dispute.reason}</p>
								</div>
								<div>
									<p className="text-sm font-medium">Description</p>
									<p className="text-sm text-muted-foreground">{booking.dispute.description}</p>
								</div>
								{booking.dispute.customerEvidence.length > 0 && (
									<div>
										<p className="text-sm font-medium mb-2">
											Customer Evidence ({booking.dispute.customerEvidence.length})
										</p>
										<div className="flex gap-2">
											{booking.dispute.customerEvidence.map((evidence, i) => (
												<div key={i} className="p-2 bg-white rounded border text-xs">
													{evidence.type === "photo" ? "📷" : "🎥"} {evidence.type}
												</div>
											))}
										</div>
									</div>
								)}
								{booking.dispute.partnerResponse && (
									<div className="pt-4 border-t">
										<p className="text-sm font-medium">Partner Response</p>
										<p className="text-sm text-muted-foreground">{booking.dispute.partnerResponse.response}</p>
									</div>
								)}
								<Button variant="outline" className="w-full">
									Resolve Dispute
								</Button>
							</CardContent>
						</Card>
					)}
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								Payment Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Service Amount</span>
								<span className="font-medium">€{booking.payment.amount.toFixed(2)}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Platform Fee (10%)</span>
								<span className="font-medium">€{booking.payment.platformFee.toFixed(2)}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Partner Payout</span>
								<span className="font-medium">€{booking.payment.partnerPayout.toFixed(2)}</span>
							</div>
							<Separator />
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Payment Method</span>
								<span className="capitalize">{booking.payment.method}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Payment Status</span>
								<Badge
									className={
										booking.payment.status === "paid"
											? "bg-green-500/10 text-green-600"
											: booking.payment.status === "refunded"
												? "bg-red-500/10 text-red-600"
												: "bg-yellow-500/10 text-yellow-600"
									}
								>
									{booking.payment.status.toUpperCase()}
								</Badge>
							</div>
							<div className="pt-2">
								<p className="text-xs text-muted-foreground">Transaction ID</p>
								<p className="text-xs font-mono">{booking.payment.transactionId}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Status Timeline
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="relative">
								{booking.statusTimeline.map((item, index) => (
									<div key={index} className="flex gap-3 pb-4 last:pb-0">
										<div className="relative">
											<div
												className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[item.status]}`}
											>
												{statusIcons[item.status]}
											</div>
											{index < booking.statusTimeline.length - 1 && (
												<div className="absolute top-8 left-1/2 w-0.5 h-full -translate-x-1/2 bg-gray-200" />
											)}
										</div>
										<div className="flex-1 pt-1">
											<p className="text-sm font-medium capitalize">{item.status.replace("_", " ")}</p>
											{item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
											<p className="text-xs text-muted-foreground mt-1">
												{format(new Date(item.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
											</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{booking.notes && (
						<Card>
							<CardHeader>
								<CardTitle>Notes</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">{booking.notes}</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Booking</DialogTitle>
						<DialogDescription>
							Are you sure you want to cancel this booking? This will trigger an automatic refund.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter cancellation reason..."
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
						rows={4}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowCancelDialog(false)}>
							Keep Booking
						</Button>
						<Button
							variant="destructive"
							onClick={() => cancelMutation.mutate({ id: booking.id, reason: cancelReason })}
							disabled={!cancelReason || cancelMutation.isPending}
						>
							Cancel Booking
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Issue Refund</DialogTitle>
						<DialogDescription>Issue a refund for booking {booking.bookingNumber}.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium">Refund Amount (€)</label>
							<Input
								type="number"
								placeholder="Enter refund amount"
								value={refundAmount}
								onChange={(e) => setRefundAmount(e.target.value)}
								max={booking.payment.amount}
							/>
							<p className="text-xs text-muted-foreground mt-1">Maximum refund: €{booking.payment.amount.toFixed(2)}</p>
						</div>
						<div>
							<label className="text-sm font-medium">Reason</label>
							<Textarea
								placeholder="Enter refund reason..."
								value={refundReason}
								onChange={(e) => setRefundReason(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowRefundDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() =>
								refundMutation.mutate({
									id: booking.id,
									amount: Number.parseFloat(refundAmount),
									reason: refundReason,
								})
							}
							disabled={!refundAmount || !refundReason || refundMutation.isPending}
						>
							<DollarSign className="h-4 w-4 mr-2" />
							Issue Refund
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
