import {
	AlertTriangle,
	ArrowLeft,
	Camera,
	Car,
	Check,
	Download,
	ExternalLink,
	MapPin,
	MessageCircle,
	Phone,
	Upload,
	User,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

// Status steps for the tracker
const STATUS_STEPS = [
	{ id: "confirmed", label: "Booking Confirmed", requiresPhoto: false },
	{ id: "driver_assigned", label: "Driver Assigned", requiresPhoto: false },
	{ id: "en_route_pickup", label: "En Route to Pick Up", requiresPhoto: true },
	{ id: "car_picked_up", label: "Car Picked Up", requiresPhoto: true },
	{ id: "in_wash", label: "In Wash", requiresPhoto: true },
	{ id: "drying", label: "Drying", requiresPhoto: true },
	{ id: "interior_cleaning", label: "Interior Cleaning", requiresPhoto: true },
	{ id: "ready_for_delivery", label: "Ready for Delivery", requiresPhoto: true },
	{ id: "out_for_delivery", label: "Out for Delivery", requiresPhoto: true },
	{ id: "delivered", label: "Delivered", requiresPhoto: true },
];

// Mock order data
const mockOrder = {
	id: "BK-2024-001",
	status: "in_wash",
	currentStepIndex: 4,
	customer: {
		name: "John Smith",
		phone: "+353 86 123 4567",
		rating: 4.8,
		totalBookings: 12,
	},
	vehicle: {
		make: "BMW",
		model: "X5",
		year: 2022,
		color: "Black",
		plate: "D 123 ABC",
	},
	service: {
		name: "Full Detail Wash",
		price: 85,
		duration: "2-3 hours",
	},
	scheduledDate: "2024-01-22",
	scheduledTime: "09:00",
	paymentStatus: "paid",
	specialInstructions:
		"Please be extra careful with the leather seats. There's a small scratch on the front bumper - no need to worry about it.",
	location: {
		address: "123 Main Street, Dublin 2, D02 AB12",
		lat: 53.3498,
		lng: -6.2603,
		distance: "2.5 km",
	},
	driver: {
		id: "driver-1",
		name: "James Wilson",
		phone: "+353 87 555 1234",
	},
	statusHistory: [
		{ status: "confirmed", timestamp: "2024-01-22T08:00:00", photo: null },
		{ status: "driver_assigned", timestamp: "2024-01-22T08:15:00", photo: null, driverName: "James Wilson" },
		{ status: "en_route_pickup", timestamp: "2024-01-22T08:30:00", photo: "/placeholder-car.jpg" },
		{ status: "car_picked_up", timestamp: "2024-01-22T08:45:00", photo: "/placeholder-car.jpg" },
		{ status: "in_wash", timestamp: "2024-01-22T09:00:00", photo: "/placeholder-car.jpg" },
	],
	photos: [
		{ id: "1", url: "/placeholder-car.jpg", stage: "pickup", timestamp: "2024-01-22T08:45:00" },
		{ id: "2", url: "/placeholder-car.jpg", stage: "in_wash", timestamp: "2024-01-22T09:00:00" },
	],
};

// Mock drivers with document expiry info (only active drivers shown)
const mockDrivers = [
	{
		id: "driver-1",
		name: "James Wilson",
		phone: "+353 87 555 1234",
		licenseExpiry: "2025-03-15",
		insuranceExpiry: "2025-06-20",
	},
	{
		id: "driver-2",
		name: "Michael Chen",
		phone: "+353 87 555 5678",
		licenseExpiry: "2026-01-10",
		insuranceExpiry: "2025-01-25",
	},
	{
		id: "driver-3",
		name: "Robert Taylor",
		phone: "+353 87 555 9012",
		licenseExpiry: "2025-08-30",
		insuranceExpiry: "2025-09-15",
	},
];

// Helper to check if date is expiring soon (within 30 days) or expired
const hasDocumentIssue = (licenseExpiry: string, insuranceExpiry: string): boolean => {
	const threshold = new Date();
	threshold.setDate(threshold.getDate() + 30);
	const license = new Date(licenseExpiry);
	const insurance = new Date(insuranceExpiry);
	return license <= threshold || insurance <= threshold;
};

const isExpired = (dateStr: string): boolean => {
	return new Date(dateStr) < new Date();
};

export default function OrderDetailsPage() {
	const { id: _bookingId } = useParams();
	const [order, setOrder] = useState(mockOrder);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
	const [selectedDriver, setSelectedDriver] = useState(order.driver?.id || "");

	const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === order.status);

	const handleUpdateStatus = () => {
		const nextStep = STATUS_STEPS[currentStepIndex + 1];
		if (nextStep) {
			if (nextStep.requiresPhoto) {
				setPhotoDialogOpen(true);
			} else {
				setOrder((prev) => ({ ...prev, status: nextStep.id }));
				toast.success(`Status updated to: ${nextStep.label}`);
			}
		}
	};

	const handlePhotoUpload = () => {
		const nextStep = STATUS_STEPS[currentStepIndex + 1];
		if (nextStep) {
			setOrder((prev) => ({ ...prev, status: nextStep.id }));
			toast.success(`Status updated to: ${nextStep.label}`);
			setPhotoDialogOpen(false);
		}
	};

	const handleDriverChange = (driverId: string) => {
		setSelectedDriver(driverId);
		const driver = mockDrivers.find((d) => d.id === driverId);
		if (driver) {
			setOrder((prev) => ({ ...prev, driver }));
			toast.success(`Driver assigned: ${driver.name}`);
		}
	};

	const handleCancelBooking = () => {
		if (cancelReason.trim()) {
			toast.info("Booking cancelled");
			setCancelDialogOpen(false);
		}
	};

	const getStatusBadge = () => {
		const statusConfig: Record<string, { label: string; className: string }> = {
			confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
			driver_assigned: { label: "Driver Assigned", className: "bg-blue-100 text-blue-800" },
			en_route_pickup: { label: "En Route", className: "bg-purple-100 text-purple-800" },
			car_picked_up: { label: "Picked Up", className: "bg-purple-100 text-purple-800" },
			in_wash: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
			drying: { label: "Drying", className: "bg-yellow-100 text-yellow-800" },
			interior_cleaning: { label: "Interior", className: "bg-yellow-100 text-yellow-800" },
			ready_for_delivery: { label: "Ready", className: "bg-green-100 text-green-800" },
			out_for_delivery: { label: "Delivering", className: "bg-purple-100 text-purple-800" },
			delivered: { label: "Completed", className: "bg-green-100 text-green-800" },
		};
		const config = statusConfig[order.status] || { label: order.status, className: "bg-gray-100" };
		return <Badge className={config.className}>{config.label}</Badge>;
	};

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
							<h1 className="text-2xl font-bold">{order.id}</h1>
							{getStatusBadge()}
						</div>
						<p className="text-muted-foreground">
							{order.scheduledDate} at {order.scheduledTime}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm">
						<Download className="mr-2 h-4 w-4" />
						Invoice
					</Button>
					<Button variant="outline" size="sm" onClick={() => toast.info("Opening chat...")}>
						<MessageCircle className="mr-2 h-4 w-4" />
						Chat
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left Column - Order Info */}
				<div className="space-y-6 lg:col-span-2">
					{/* Customer & Vehicle Info */}
					<div className="grid gap-6 md:grid-cols-2">
						{/* Customer */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Customer</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
										<User className="h-6 w-6 text-primary" />
									</div>
									<div>
										<p className="font-medium">{order.customer.name}</p>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<span>★ {order.customer.rating}</span>
											<span>•</span>
											<span>{order.customer.totalBookings} bookings</span>
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<a href={`tel:${order.customer.phone}`} className="hover:underline">
										{order.customer.phone}
									</a>
								</div>
							</CardContent>
						</Card>

						{/* Vehicle */}
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
											{order.vehicle.make} {order.vehicle.model}
										</p>
										<p className="text-sm text-muted-foreground">
											{order.vehicle.year} • {order.vehicle.color}
										</p>
									</div>
								</div>
								<div className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-lg">{order.vehicle.plate}</div>
							</CardContent>
						</Card>
					</div>

					{/* Service & Payment */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Service Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">{order.service.name}</p>
									<p className="text-sm text-muted-foreground">Duration: {order.service.duration}</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold">€{order.service.price}</p>
									<Badge
										className={cn(
											order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
										)}
									>
										{order.paymentStatus === "paid" ? "Paid" : "Pending"}
									</Badge>
								</div>
							</div>
							{order.specialInstructions && (
								<div className="mt-4 rounded-lg bg-muted p-3">
									<p className="text-sm font-medium">Special Instructions:</p>
									<p className="text-sm text-muted-foreground">{order.specialInstructions}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Status Tracker */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Status Tracker</CardTitle>
							<CardDescription>Real-time order progress</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{STATUS_STEPS.map((step, index) => {
									const isCompleted = index < currentStepIndex;
									const isCurrent = index === currentStepIndex;
									const isPending = index > currentStepIndex;
									const historyItem = order.statusHistory.find((h) => h.status === step.id);

									return (
										<div key={step.id} className="flex gap-4">
											{/* Timeline */}
											<div className="flex flex-col items-center">
												<div
													className={cn(
														"flex h-8 w-8 items-center justify-center rounded-full border-2",
														isCompleted && "border-green-500 bg-green-500 text-white",
														isCurrent && "border-primary bg-primary text-white",
														isPending && "border-muted-foreground/30 text-muted-foreground",
													)}
												>
													{isCompleted ? (
														<Check className="h-4 w-4" />
													) : (
														<span className="text-xs font-medium">{index + 1}</span>
													)}
												</div>
												{index < STATUS_STEPS.length - 1 && (
													<div className={cn("h-8 w-0.5", isCompleted ? "bg-green-500" : "bg-muted-foreground/30")} />
												)}
											</div>

											{/* Content */}
											<div className="flex-1 pb-4">
												<div className="flex items-center justify-between">
													<p className={cn("font-medium", isPending && "text-muted-foreground")}>{step.label}</p>
													{historyItem && (
														<span className="text-xs text-muted-foreground">
															{new Date(historyItem.timestamp).toLocaleTimeString()}
														</span>
													)}
												</div>
												{isCurrent && <p className="text-sm text-primary">In progress...</p>}
												{step.requiresPhoto && historyItem?.photo && (
													<div className="mt-2">
														<div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center">
															<Camera className="h-6 w-6 text-muted-foreground" />
														</div>
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>

							{currentStepIndex < STATUS_STEPS.length - 1 && (
								<div className="mt-6 flex justify-center">
									<Button onClick={handleUpdateStatus} className="gap-2">
										<Upload className="h-4 w-4" />
										Update to: {STATUS_STEPS[currentStepIndex + 1]?.label}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Location & Actions */}
				<div className="space-y-6">
					{/* Location */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Customer Location</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
								<MapPin className="h-8 w-8 text-muted-foreground" />
							</div>
							<div>
								<p className="text-sm">{order.location.address}</p>
								<p className="text-sm text-muted-foreground mt-1">Distance: {order.location.distance}</p>
							</div>
							<Button variant="outline" className="w-full gap-2" asChild>
								<a
									href={`https://www.google.com/maps/dir/?api=1&destination=${order.location.lat},${order.location.lng}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink className="h-4 w-4" />
									Get Directions
								</a>
							</Button>
						</CardContent>
					</Card>

					{/* Driver Assignment */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Driver</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Select value={selectedDriver} onValueChange={handleDriverChange}>
								<SelectTrigger>
									<SelectValue placeholder="Assign a driver" />
								</SelectTrigger>
								<SelectContent>
									{mockDrivers.map((driver) => {
										const hasIssue = hasDocumentIssue(driver.licenseExpiry, driver.insuranceExpiry);
										const licenseExpired = isExpired(driver.licenseExpiry);
										const insuranceExpired = isExpired(driver.insuranceExpiry);
										const isDisabled = licenseExpired || insuranceExpired;
										return (
											<SelectItem key={driver.id} value={driver.id} disabled={isDisabled}>
												<div className="flex items-center gap-2">
													<span>{driver.name}</span>
													{hasIssue && (
														<AlertTriangle
															className={cn("h-3.5 w-3.5", isDisabled ? "text-destructive" : "text-orange-500")}
														/>
													)}
												</div>
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
							{order.driver && (
								<div className="flex items-center gap-2 text-sm">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<a href={`tel:${order.driver.phone}`} className="hover:underline">
										{order.driver.phone}
									</a>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Actions */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button variant="outline" className="w-full justify-start gap-2">
								<Camera className="h-4 w-4" />
								View All Photos ({order.photos.length})
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2 text-destructive hover:text-destructive"
								onClick={() => setCancelDialogOpen(true)}
							>
								<XCircle className="h-4 w-4" />
								Cancel Booking
							</Button>
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
						<Button variant="destructive" onClick={handleCancelBooking} disabled={!cancelReason.trim()}>
							Cancel Booking
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Photo Upload Dialog */}
			<Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upload Photo</DialogTitle>
						<DialogDescription>
							Please upload a photo for status: {STATUS_STEPS[currentStepIndex + 1]?.label}
						</DialogDescription>
					</DialogHeader>
					<div className="border-2 border-dashed rounded-lg p-8 text-center">
						<Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground mb-4">Click to upload or drag and drop</p>
						<Button variant="outline">Choose File</Button>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handlePhotoUpload}>Upload & Update Status</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
