import { format } from "date-fns";
import { Car, CreditCard, Mail, MapPin, Phone } from "lucide-react";

import type { Customer } from "@/api/services/customerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/dialog";
import { cn } from "@/utils";

import { STATUS_CONFIG } from "../types";

interface CustomerDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customer: Customer | null;
}

export function CustomerDetailsDialog({ open, onOpenChange, customer }: CustomerDetailsDialogProps) {
	if (!customer) return null;

	const statusConfig = STATUS_CONFIG[customer.status];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-3 pr-6">
						<DialogTitle>Customer Details</DialogTitle>
						<span
							className={cn(
								"inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
								statusConfig.color,
								statusConfig.darkColor,
							)}
						>
							{statusConfig.label}
						</span>
					</div>
					<DialogDescription>
						Customer since {format(new Date(customer.registeredAt), "MMMM yyyy")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<Avatar className="h-14 w-14">
							<AvatarImage src={customer.avatar} alt={customer.name} />
							<AvatarFallback className="text-lg">
								{customer.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</AvatarFallback>
						</Avatar>
						<div>
							<p className="text-lg font-semibold">{customer.name}</p>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1">
									<Mail className="h-3 w-3" />
									{customer.email}
								</span>
							</div>
							<div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
								<span className="flex items-center gap-1">
									<Phone className="h-3 w-3" />
									{customer.phone}
								</span>
								<span className="flex items-center gap-1">
									<MapPin className="h-3 w-3" />
									{customer.location}
								</span>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div className="rounded-lg border border-border p-3 text-center">
							<p className="text-xl font-bold">{customer.totalBookings}</p>
							<p className="text-xs text-muted-foreground">Bookings</p>
						</div>
						<div className="rounded-lg border border-border p-3 text-center">
							<p className="text-xl font-bold">&euro;{customer.totalSpent.toFixed(2)}</p>
							<p className="text-xs text-muted-foreground">Total Spent</p>
						</div>
						<div className="rounded-lg border border-border p-3 text-center">
							<p className="text-xl font-bold">{customer.vehicles.length}</p>
							<p className="text-xs text-muted-foreground">Vehicles</p>
						</div>
					</div>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								<Car className="h-4 w-4" />
								Vehicles
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{customer.vehicles.map((v) => (
								<div key={v.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
									<span className="font-medium">
										{v.year} {v.make} {v.model}
									</span>
									<span className="text-muted-foreground">
										{v.color} &bull; {v.plateNumber}
									</span>
								</div>
							))}
						</CardContent>
					</Card>

					{customer.subscription.active && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm flex items-center gap-2">
									<CreditCard className="h-4 w-4" />
									Subscription
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-1 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Plan</span>
									<Badge variant="outline">{customer.subscription.plan}</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Price</span>
									<span>&euro;{customer.subscription.price}/mo</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Washes Remaining</span>
									<span className="font-medium">{customer.subscription.washesRemaining}</span>
								</div>
								{customer.subscription.renewalDate && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">Renewal</span>
										<span>{format(new Date(customer.subscription.renewalDate), "MMM d, yyyy")}</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
						Last active: {format(new Date(customer.lastActiveAt), "MMM d, yyyy 'at' h:mm a")}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
