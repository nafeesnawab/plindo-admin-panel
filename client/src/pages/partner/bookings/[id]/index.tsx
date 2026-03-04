import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowLeft,
	Camera,
	Car,
	Check,
	Clock,
	Download,
	Image,
	Loader2,
	MapPin,
	MessageCircle,
	Package,
	Phone,
	Truck,
	Upload,
	User,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import slotBookingService from "@/api/services/slotBookingService";
import type { BookingStatus, ServiceStep } from "@/types/booking";
import { SERVICE_TYPE_LABELS } from "@/types/booking";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Skeleton } from "@/ui/skeleton";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

// ============ STATUS CONFIG ============

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
	booked: { label: "Booked", className: "bg-blue-100 text-blue-800" },
	in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
	completed: { label: "Completed", className: "bg-green-100 text-green-800" },
	picked: { label: "Picked Up", className: "bg-purple-100 text-purple-800" },
	out_for_delivery: { label: "Out for Delivery", className: "bg-purple-100 text-purple-800" },
	delivered: { label: "Delivered", className: "bg-green-100 text-green-800" },
	cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
	rescheduled: { label: "Rescheduled", className: "bg-orange-100 text-orange-800" },
};

// ============ PAGE COMPONENT ============

export default function OrderDetailsPage() {
	const { id: bookingId } = useParams();
	const queryClient = useQueryClient();
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setPhotoPreview(URL.createObjectURL(file));
			setPendingFile(file);
			setPhotoDialogOpen(true);
			e.target.value = "";
		}
	};

	const handlePhotoUploadConfirm = async () => {
		if (!pendingFile) return;

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", pendingFile);
			const res = await apiClient.post<{ url: string }>({ url: "/upload", data: formData });
			const uploadedUrl = (res as unknown as { url: string }).url;
			setPendingImageUrl(uploadedUrl);
			toast.success("Photo ready — click 'Advance Step' to attach it");
		} catch {
			toast.error("Photo upload failed");
		} finally {
			setIsUploading(false);
			setPhotoPreview(null);
			setPendingFile(null);
			setPhotoDialogOpen(false);
		}
	};

	// Fetch booking details
	const {
		data: booking,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["booking-details", bookingId],
		queryFn: () => slotBookingService.getBookingDetails(bookingId ?? ""),
		enabled: !!bookingId,
	});

	// Advance service step mutation
	const advanceStepMutation = useMutation({
		mutationFn: () => slotBookingService.advanceServiceStep(bookingId ?? "", pendingImageUrl ?? undefined),
		onSuccess: (updatedBooking) => {
			queryClient.setQueryData(["booking-details", bookingId], updatedBooking);
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			setPendingImageUrl(null);
			const allDone = updatedBooking.serviceSteps.every(
				(s: ServiceStep) => s.status === "completed" || s.status === "skipped",
			);
			toast.success(allDone ? "Service completed!" : "Step advanced");
		},
		onError: () => toast.error("Failed to advance step"),
	});

	// Cancel booking mutation
	const cancelMutation = useMutation({
		mutationFn: (reason: string) => slotBookingService.cancelBooking(bookingId ?? "", reason, "partner"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["booking-details", bookingId] });
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			toast.success("Booking cancelled");
			setCancelDialogOpen(false);
		},
		onError: () => toast.error("Failed to cancel booking"),
	});

	// Update status mutation
	const updateStatusMutation = useMutation({
		mutationFn: (status: BookingStatus) => slotBookingService.updateBookingStatus(bookingId ?? "", status),
		onSuccess: (updatedBooking) => {
			queryClient.setQueryData(["booking-details", bookingId], updatedBooking);
			queryClient.invalidateQueries({ queryKey: ["partner-bookings"] });
			toast.success("Status updated");
		},
		onError: () => toast.error("Failed to update status"),
	});

	// ============ LOADING / ERROR STATES ============

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="space-y-6 lg:col-span-2">
						<Skeleton className="h-48 w-full" />
						<Skeleton className="h-64 w-full" />
					</div>
					<Skeleton className="h-72 w-full" />
				</div>
			</div>
		);
	}

	if (isError || !booking) {
		return (
			<div className="flex flex-col items-center justify-center py-20 space-y-4">
				<p className="text-lg text-muted-foreground">Booking not found</p>
				<Link to="/partner/bookings">
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Bookings
					</Button>
				</Link>
			</div>
		);
	}

	// ============ DERIVED STATE ============

	const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || {
		label: booking.status,
		className: "bg-gray-100",
	};

	const steps = booking.serviceSteps;
	const currentStepIdx = steps.findIndex((s) => s.status === "in_progress");
	const nextPendingIdx = steps.findIndex((s) => s.status === "pending");
	const allStepsDone = steps.length > 0 && steps.every((s) => s.status === "completed" || s.status === "skipped");
	const canAdvanceStep =
		!allStepsDone &&
		(currentStepIdx >= 0 || nextPendingIdx >= 0) &&
		booking.status !== "cancelled" &&
		booking.status !== "completed" &&
		booking.status !== "delivered";

	const nextStepLabel =
		currentStepIdx >= 0 && currentStepIdx + 1 < steps.length
			? steps[currentStepIdx + 1].name
			: nextPendingIdx >= 0
				? steps[nextPendingIdx].name
				: null;

	const completedCount = steps.filter((s) => s.status === "completed").length;
	const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

	const canCancel = booking.status === "booked";
	const isPickByMe = booking.service.serviceType === "pick_by_me";
	const isWashingVan = booking.service.serviceType === "washing_van";
	const isAdvancedServiceType = isPickByMe || isWashingVan;

	// ============ RENDER ============

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/partner/bookings">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold">{booking.bookingNumber}</h1>
							<Badge className={statusConfig.className}>{statusConfig.label}</Badge>
						</div>
						<p className="text-muted-foreground">
							{format(new Date(booking.slot.date), "EEEE, MMMM d, yyyy")} at {booking.slot.startTime} –{" "}
							{booking.slot.endTime}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={() => toast.info("Invoice generation coming soon")}>
						<Download className="mr-2 h-4 w-4" />
						Invoice
					</Button>
					<Button variant="outline" size="sm" onClick={() => navigate("/partner/messages")}>
						<MessageCircle className="mr-2 h-4 w-4" />
						Chat
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column */}
				<div className="space-y-6 lg:col-span-2">
					{/* Customer & Vehicle */}
					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Customer</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
										{booking.customer.avatar ? (
											<img
												src={booking.customer.avatar}
												alt={booking.customer.name}
												className="h-12 w-12 rounded-full object-cover"
											/>
										) : (
											<User className="h-6 w-6 text-primary" />
										)}
									</div>
									<div>
										<p className="font-medium">{booking.customer.name}</p>
										<p className="text-sm text-muted-foreground">{booking.customer.email}</p>
									</div>
								</div>
								{booking.customer.phone && (
									<div className="flex items-center gap-2 text-sm">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<a href={`tel:${booking.customer.phone}`} className="hover:underline">
											{booking.customer.phone}
										</a>
									</div>
								)}
								{booking.customer.subscription && (
									<Badge variant="outline" className="text-xs">
										{booking.customer.subscription.plan.name} Subscriber
									</Badge>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Vehicle</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
										<Car className="h-6 w-6 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											{booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
										</p>
										<p className="text-sm text-muted-foreground">
											{booking.vehicle.color} • {booking.vehicle.type}
										</p>
									</div>
								</div>
								<div className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-lg">
									{booking.vehicle.plateNumber}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Service Details */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Service Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">{booking.service.name}</p>
									<div className="flex items-center gap-2 mt-1">
										<Badge variant="outline" className="text-xs">
											{booking.service.serviceType === "pick_by_me" && <Truck className="h-3 w-3 mr-1" />}
											{SERVICE_TYPE_LABELS[booking.service.serviceType]}
										</Badge>
										<span className="text-sm text-muted-foreground">
											<Clock className="inline h-3 w-3 mr-1" />
											{booking.service.duration} min
										</span>
									</div>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold">€{booking.pricing.finalPrice.toFixed(2)}</p>
									{(booking.pricing.subscriptionDiscount ?? 0) > 0 && (
										<p className="text-xs text-muted-foreground line-through">
											€{booking.pricing.basePrice.toFixed(2)}
										</p>
									)}
								</div>
							</div>

							{/* Product Order */}
							{booking.productOrder && (
								<div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Package className="h-4 w-4 text-amber-600" />
										<div>
											<p className="text-sm font-medium">
												{booking.productOrder.productCount} add-on product
												{booking.productOrder.productCount > 1 ? "s" : ""}
											</p>
											<p className="text-xs text-muted-foreground font-mono">{booking.productOrder.orderNumber}</p>
										</div>
									</div>
									<span className="font-semibold text-sm">€{booking.productOrder.totalAmount.toFixed(2)}</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Service Progress */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base">Service Progress</CardTitle>
									<CardDescription>
										{completedCount} of {steps.length} steps completed ({progressPercent}%)
									</CardDescription>
								</div>
								{canAdvanceStep && (
									<Button
										size="sm"
										onClick={() => advanceStepMutation.mutate()}
										disabled={advanceStepMutation.isPending}
										className="gap-2"
									>
										{advanceStepMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Check className="h-4 w-4" />
										)}
										{nextStepLabel ? `Mark: ${nextStepLabel}` : "Advance Step"}
									</Button>
								)}
							</div>
							{/* Pending image indicator */}
							{pendingImageUrl && (
								<div className="flex items-center gap-2 mt-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
									<Image className="h-4 w-4" />
									Photo attached — will be saved with next step advance
									<button
										type="button"
										className="ml-auto text-blue-400 hover:text-blue-600"
										onClick={() => setPendingImageUrl(null)}
									>
										×
									</button>
								</div>
							)}
							{/* Progress bar */}
							<div className="w-full bg-muted rounded-full h-2 mt-2">
								<div
									className="bg-green-500 h-2 rounded-full transition-all duration-300"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{steps.map((step, index) => {
									const isCompleted = step.status === "completed";
									const isCurrent = step.status === "in_progress";
									const isPending = step.status === "pending";
									const isSkipped = step.status === "skipped";

									return (
										<div key={step.id} className="flex gap-4">
											{/* Timeline dot + line */}
											<div className="flex flex-col items-center">
												<div
													className={cn(
														"flex h-8 w-8 items-center justify-center rounded-full border-2",
														isCompleted && "border-green-500 bg-green-500 text-white",
														isCurrent && "border-primary bg-primary text-white",
														isPending && "border-muted-foreground/30 text-muted-foreground",
														isSkipped && "border-gray-300 bg-gray-100 text-gray-400",
													)}
												>
													{isCompleted ? (
														<Check className="h-4 w-4" />
													) : isCurrent ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<span className="text-xs font-medium">{index + 1}</span>
													)}
												</div>
												{index < steps.length - 1 && (
													<div className={cn("h-8 w-0.5", isCompleted ? "bg-green-500" : "bg-muted-foreground/30")} />
												)}
											</div>

											{/* Step content */}
											<div className="flex-1 pb-2">
												<div className="flex items-center justify-between">
													<p
														className={cn(
															"font-medium",
															isPending && "text-muted-foreground",
															isSkipped && "text-gray-400 line-through",
														)}
													>
														{step.name}
													</p>
													{step.completedAt && (
														<span className="text-xs text-muted-foreground">
															{format(new Date(step.completedAt), "HH:mm")}
														</span>
													)}
												</div>
												{isCurrent && <p className="text-sm text-primary">In progress...</p>}
												{step.startedAt && !step.completedAt && isCurrent && (
													<p className="text-xs text-muted-foreground">
														Started at {format(new Date(step.startedAt), "HH:mm")}
													</p>
												)}
												{/* Step images */}
												{step.images && step.images.length > 0 && (
													<div className="flex gap-2 mt-2 flex-wrap">
														{step.images.map((img) => (
															<a key={img.url} href={img.url} target="_blank" rel="noopener noreferrer">
																<img
																	src={img.url}
																	alt={step.name}
																	className="h-14 w-14 rounded object-cover border hover:opacity-80 transition-opacity"
																/>
															</a>
														))}
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>

							{allStepsDone && (
								<div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
									<Check className="h-5 w-5 text-green-600 mx-auto mb-1" />
									<p className="text-sm font-medium text-green-800">All steps completed!</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column */}
				<div className="space-y-6">
					{/* Location */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Location</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<a
								href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.partner.address || booking.partner.location)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="aspect-video rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer relative group"
							>
								<MapPin className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
								<span className="absolute bottom-2 text-xs text-muted-foreground group-hover:text-primary">
									Open in Google Maps
								</span>
							</a>
							{booking.partner.address && <p className="text-sm">{booking.partner.address}</p>}
							<p className="text-sm text-muted-foreground">{booking.partner.location}</p>
						</CardContent>
					</Card>

					{/* Pricing Breakdown */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Pricing</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Base Price</span>
								<span>€{booking.pricing.basePrice.toFixed(2)}</span>
							</div>
							{booking.pricing.isCustomPrice && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Custom price (body type default: €{booking.pricing.bodyTypeDefault.toFixed(2)})
									</span>
									<span>€{booking.pricing.basePrice.toFixed(2)}</span>
								</div>
							)}
							{booking.pricing.distanceCharge != null && booking.pricing.distanceCharge > 0 && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Distance Charge</span>
									<span>€{booking.pricing.distanceCharge.toFixed(2)}</span>
								</div>
							)}
							{(booking.pricing.subscriptionDiscount ?? 0) > 0 && (
								<div className="flex justify-between text-green-600">
									<span>Subscription Discount</span>
									<span>-€{(booking.pricing.subscriptionDiscount ?? 0).toFixed(2)}</span>
								</div>
							)}
							<div className="flex justify-between font-semibold border-t pt-2">
								<span>Total</span>
								<span>€{booking.pricing.finalPrice.toFixed(2)}</span>
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{/* book_me only: manual start button (step system handles the rest) */}
							{!isAdvancedServiceType && booking.status === "booked" && (
								<Button
									className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700"
									onClick={() => updateStatusMutation.mutate("in_progress")}
									disabled={updateStatusMutation.isPending}
								>
									<Clock className="h-4 w-4" />
									Start Service
								</Button>
							)}

							{/* pick_by_me / washing_van: steps drive everything — no separate start button needed */}
							{isAdvancedServiceType && booking.status === "booked" && canAdvanceStep && (
								<p className="text-xs text-muted-foreground px-1">
									Use "Mark: {steps.find((s) => s.status === "pending")?.name ?? "next step"}" in the progress tracker above to begin.
								</p>
							)}

							{/* Upload photo — attaches to next step advance */}
							<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
							<Button
								variant="outline"
								className={cn("w-full justify-start gap-2", pendingImageUrl && "border-blue-400 text-blue-600")}
								onClick={() => fileInputRef.current?.click()}
								disabled={booking.status === "cancelled" || allStepsDone}
							>
								<Camera className="h-4 w-4" />
								{pendingImageUrl ? "Change Photo" : "Attach Photo to Step"}
							</Button>

							{canCancel && (
								<Button
									variant="outline"
									className="w-full justify-start gap-2 text-destructive hover:text-destructive"
									onClick={() => setCancelDialogOpen(true)}
								>
									<XCircle className="h-4 w-4" />
									Cancel Booking
								</Button>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Cancel Dialog */}
			<Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Booking</DialogTitle>
						<DialogDescription>
							Please provide a reason for cancelling. This will be shared with the customer.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter cancellation reason..."
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
						className="min-h-[100px]"
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
							Keep Booking
						</Button>
						<Button
							variant="destructive"
							onClick={() => cancelMutation.mutate(cancelReason)}
							disabled={!cancelReason.trim() || cancelMutation.isPending}
						>
							Cancel Booking
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Photo Upload Dialog */}
			<Dialog
				open={photoDialogOpen}
				onOpenChange={(open) => {
					if (!open) setPhotoPreview(null);
					setPhotoDialogOpen(open);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Attach Photo to Step</DialogTitle>
						<DialogDescription>
							This photo will be attached to the current step when you advance it.
						</DialogDescription>
					</DialogHeader>
					{photoPreview ? (
						<div className="rounded-lg overflow-hidden border">
							<img src={photoPreview} alt="Preview" className="w-full max-h-64 object-contain" />
						</div>
					) : (
						<div className="border-2 border-dashed rounded-lg p-8 text-center">
							<Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-sm text-muted-foreground">No photo selected</p>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => { setPhotoPreview(null); setPhotoDialogOpen(false); }}>
							Cancel
						</Button>
						<Button onClick={handlePhotoUploadConfirm} disabled={!photoPreview || isUploading}>
							{isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
							{isUploading ? "Uploading..." : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
