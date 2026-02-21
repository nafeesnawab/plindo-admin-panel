import { format } from "date-fns";
import {
	ArrowRight,
	Calendar,
	Car,
	CheckCircle2,
	Clock,
	MapPin,
	Package,
	Phone,
	Sparkles,
	Truck,
	User,
	XCircle,
} from "lucide-react";
import { Link } from "react-router";

import { formatTimeDisplay, isSlotInPast } from "@/components/calendar/utils";
import type { SlotBooking } from "@/types/booking";
import { SERVICE_CATEGORY_LABELS, SERVICE_TYPE_LABELS } from "@/types/booking";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent } from "@/ui/dialog";
import { Separator } from "@/ui/separator";

import { STATUS_COLORS, STATUS_CONFIG } from "../types";

interface BookingDetailsDialogProps {
	booking: SlotBooking | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCancel: () => void;
	onReschedule: () => void;
	onStartService: () => void;
	onComplete: () => void;
}

export function BookingDetailsDialog({
	booking,
	open,
	onOpenChange,
	onCancel,
	onReschedule,
	onStartService,
	onComplete,
}: BookingDetailsDialogProps) {
	if (!booking) return null;

	const config = STATUS_CONFIG[booking.status];
	const statusColor = STATUS_COLORS[booking.status];
	const slotDate = new Date(booking.slot.date);
	const isPast = isSlotInPast(slotDate, booking.slot.endTime);
	const canModify = booking.status === "booked";
	const canStart = booking.status === "booked" && !isPast;
	const canComplete = booking.status === "in_progress";
	const customerName = booking.customer?.name || 'N/A';
	const initials = customerName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
				{/* Status header strip */}
				<div
					className="px-5 py-3 flex items-center justify-between"
					style={{ backgroundColor: statusColor?.bg ?? "#6b7280" }}
				>
					<div className="flex items-center gap-2">
						<span className="text-sm font-semibold text-white">{config.label}</span>
						<span className="text-white/70 text-xs">#{booking.bookingNumber}</span>
					</div>
					<Badge className="bg-white/20 text-white border-white/30 text-xs hover:bg-white/30">
						{SERVICE_CATEGORY_LABELS[booking.service.serviceCategory]}
					</Badge>
				</div>

				{/* Content */}
				<div className="px-5 py-4 space-y-4">
					{/* Service name + time */}
					<div>
						<h3 className="text-base font-semibold text-foreground">{booking.service.name}</h3>
						<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
							<Calendar className="h-3.5 w-3.5" />
							<span>{format(slotDate, "EEE, MMM d, yyyy")}</span>
							<span className="text-border">·</span>
							<Clock className="h-3.5 w-3.5" />
							<span>
								{formatTimeDisplay(booking.slot.startTime)} – {formatTimeDisplay(booking.slot.endTime)}
							</span>
						</div>
					</div>

					<Separator />

					{/* Customer row */}
					<div className="flex items-center gap-3">
						<div
							className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
							style={{ backgroundColor: statusColor?.bg ?? "#6b7280" }}
						>
							{initials}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1.5">
								<User className="h-3 w-3 text-muted-foreground" />
								<span className="text-sm font-medium text-foreground truncate">{customerName}</span>
							</div>
							<div className="flex items-center gap-1.5 mt-0.5">
								<Phone className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs text-muted-foreground">{booking.customer?.phone || 'N/A'}</span>
							</div>
						</div>
					</div>

					{/* Info grid */}
					<div className="grid grid-cols-2 gap-2">
						<InfoCard
							icon={<Car className="h-3.5 w-3.5" />}
							label="Vehicle"
							value={`${booking.vehicle.make} ${booking.vehicle.model}`}
							sub={booking.vehicle.plateNumber}
						/>
						<InfoCard
							icon={<MapPin className="h-3.5 w-3.5" />}
							label="Bay"
							value={booking.bayName}
							sub={SERVICE_TYPE_LABELS[booking.service.serviceType]}
						/>
						<InfoCard
							icon={<Sparkles className="h-3.5 w-3.5" />}
							label="Duration"
							value={`${booking.service.duration} min`}
						/>
						<InfoCard
							icon={<span className="text-xs font-bold">£</span>}
							label="Price"
							value={`£${booking.pricing.finalPrice.toFixed(2)}`}
						/>
					</div>

					{/* Delivery badge */}
					{booking.service.serviceType === "pick_by_me" && (
						<div className="flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs">
							<Truck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
							<span className="text-indigo-700 dark:text-indigo-300 font-medium">Pick & Delivery service</span>
						</div>
					)}

					{/* Product Order */}
					{booking.productOrder && (
						<div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
							<Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
							<span className="text-amber-700 dark:text-amber-300 font-medium">
								{booking.productOrder.productCount} product{booking.productOrder.productCount > 1 ? "s" : ""} · £
								{booking.productOrder.totalAmount.toFixed(2)}
							</span>
						</div>
					)}

					{/* Actions */}
					{(canStart || canComplete || canModify) && (
						<>
							<Separator />
							<div className="flex gap-2">
								{canStart && (
									<Button
										size="sm"
										onClick={onStartService}
										className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
									>
										<Clock className="mr-1.5 h-3.5 w-3.5" />
										Start Service
									</Button>
								)}
								{canComplete && (
									<Button
										size="sm"
										onClick={onComplete}
										className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
									>
										<CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
										Complete
									</Button>
								)}
								{canModify && (
									<Button size="sm" variant="outline" onClick={onReschedule} className="gap-1.5">
										<Calendar className="h-3.5 w-3.5" />
										Reschedule
									</Button>
								)}
								{canModify && (
									<Button
										size="sm"
										variant="ghost"
										onClick={onCancel}
										className="text-destructive hover:text-destructive gap-1.5"
									>
										<XCircle className="h-3.5 w-3.5" />
										Cancel
									</Button>
								)}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				<div className="px-5 py-3 border-t border-border bg-muted/30">
					<Link to={`/partner/bookings/${booking.id}`}>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
						>
							View Full Details
							<ArrowRight className="h-3 w-3" />
						</Button>
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
	return (
		<div className="rounded-md border border-border bg-muted/30 px-3 py-2">
			<div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
				{icon}
				<span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
			</div>
			<p className="text-sm font-medium text-foreground truncate">{value}</p>
			{sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
		</div>
	);
}
