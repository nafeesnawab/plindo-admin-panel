import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, Save, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import settingsService from "@/api/services/settingsService";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";

export default function BookingRulesPage() {
	const queryClient = useQueryClient();
	const [minAdvanceHours, setMinAdvanceHours] = useState(2);
	const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
	const [cancellationWindow, setCancellationWindow] = useState(2);

	const { data, isLoading } = useQuery({
		queryKey: ["settings-booking-rules"],
		queryFn: () => settingsService.getBookingRules(),
	});

	useEffect(() => {
		if (data) {
			setMinAdvanceHours(data.minAdvanceBookingHours);
			setMaxAdvanceDays(data.maxAdvanceBookingDays);
			setCancellationWindow(data.cancellationWindowHours);
		}
	}, [data]);

	const updateMutation = useMutation({
		mutationFn: () =>
			settingsService.updateBookingRules({
				minAdvanceBookingHours: minAdvanceHours,
				maxAdvanceBookingDays: maxAdvanceDays,
				cancellationWindowHours: cancellationWindow,
			}),
		onSuccess: () => {
			toast.success("Booking rules updated");
			queryClient.invalidateQueries({ queryKey: ["settings-booking-rules"] });
		},
		onError: () => {
			toast.error("Failed to update settings");
		},
	});

	const hasChanges =
		data &&
		(minAdvanceHours !== data.minAdvanceBookingHours ||
			maxAdvanceDays !== data.maxAdvanceBookingDays ||
			cancellationWindow !== data.cancellationWindowHours);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Skeleton className="h-[200px]" />
					<Skeleton className="h-[200px]" />
					<Skeleton className="h-[200px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Booking Rules</h1>
					<p className="text-muted-foreground">Configure booking time restrictions</p>
				</div>
				<Button onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending}>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-blue-600" />
							Minimum Advance Time
						</CardTitle>
						<CardDescription>How far in advance a booking must be made</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Hours Before</Label>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									min={0}
									max={48}
									value={minAdvanceHours}
									onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
									className="w-24"
								/>
								<span className="text-muted-foreground">hours</span>
							</div>
						</div>
						<p className="text-sm text-muted-foreground">
							Customers must book at least {minAdvanceHours} hours before the appointment time.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-green-600" />
							Maximum Advance Time
						</CardTitle>
						<CardDescription>How far into the future bookings can be made</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Days Ahead</Label>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									min={1}
									max={365}
									value={maxAdvanceDays}
									onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
									className="w-24"
								/>
								<span className="text-muted-foreground">days</span>
							</div>
						</div>
						<p className="text-sm text-muted-foreground">Customers can book up to {maxAdvanceDays} days in advance.</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<XCircle className="h-5 w-5 text-red-600" />
							Cancellation Window
						</CardTitle>
						<CardDescription>Free cancellation period before appointment</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Hours Before</Label>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									min={0}
									max={48}
									value={cancellationWindow}
									onChange={(e) => setCancellationWindow(Number(e.target.value))}
									className="w-24"
								/>
								<span className="text-muted-foreground">hours</span>
							</div>
						</div>
						<p className="text-sm text-muted-foreground">
							Free cancellation if cancelled {cancellationWindow}+ hours before appointment.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Booking Window Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-8">
						<div className="flex-1 p-4 border rounded-lg text-center">
							<p className="text-2xl font-bold text-blue-600">{minAdvanceHours}h</p>
							<p className="text-sm text-muted-foreground">Min advance</p>
						</div>
						<div className="text-muted-foreground">→</div>
						<div className="flex-1 p-4 border rounded-lg text-center">
							<p className="text-2xl font-bold text-green-600">{maxAdvanceDays} days</p>
							<p className="text-sm text-muted-foreground">Max advance</p>
						</div>
						<div className="text-muted-foreground">|</div>
						<div className="flex-1 p-4 border rounded-lg text-center">
							<p className="text-2xl font-bold text-red-600">{cancellationWindow}h</p>
							<p className="text-sm text-muted-foreground">Free cancel</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">Last updated: {format(new Date(data.updatedAt), "PPpp")}</p>
			)}
		</div>
	);
}
