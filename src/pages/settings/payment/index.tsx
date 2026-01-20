import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import settingsService from "@/api/services/settingsService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Label } from "@/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { format } from "date-fns";
import {
	CheckCircle,
	CreditCard,
	Save,
	Smartphone,
	Wallet,
	Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function PaymentSettingsPage() {
	const queryClient = useQueryClient();
	const [paymentMethods, setPaymentMethods] = useState({
		cards: true,
		applePay: true,
		googlePay: true,
	});
	const [payoutSchedule, setPayoutSchedule] = useState<"weekly" | "monthly">("weekly");

	const { data, isLoading } = useQuery({
		queryKey: ["settings-payment"],
		queryFn: () => settingsService.getPaymentSettings(),
	});

	useEffect(() => {
		if (data) {
			setPaymentMethods(data.paymentMethods);
			setPayoutSchedule(data.payoutSchedule);
		}
	}, [data]);

	const updateMutation = useMutation({
		mutationFn: () => settingsService.updatePaymentSettings({
			paymentMethods,
			payoutSchedule,
		}),
		onSuccess: () => {
			toast.success("Payment settings updated");
			queryClient.invalidateQueries({ queryKey: ["settings-payment"] });
		},
		onError: () => {
			toast.error("Failed to update settings");
		},
	});

	const hasChanges = data && (
		JSON.stringify(paymentMethods) !== JSON.stringify(data.paymentMethods) ||
		payoutSchedule !== data.payoutSchedule
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Skeleton className="h-[300px]" />
					<Skeleton className="h-[300px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Payment Settings</h1>
					<p className="text-muted-foreground">Configure payment methods and payout schedule</p>
				</div>
				<Button
					onClick={() => updateMutation.mutate()}
					disabled={!hasChanges || updateMutation.isPending}
				>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Wallet className="h-5 w-5 text-purple-600" />
							Stripe Configuration
						</CardTitle>
						<CardDescription>
							Payment processor connection status
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-purple-500/10">
									<Wallet className="h-5 w-5 text-purple-600" />
								</div>
								<div>
									<p className="font-medium">Stripe</p>
									<p className="text-sm text-muted-foreground">
										{data?.stripeAccountId || "Not connected"}
									</p>
								</div>
							</div>
							{data?.stripeConnected ? (
								<Badge className="bg-green-500/10 text-green-600 gap-1">
									<CheckCircle className="h-3 w-3" />
									Connected
								</Badge>
							) : (
								<Badge variant="destructive">Disconnected</Badge>
							)}
						</div>
						<p className="text-sm text-muted-foreground">
							Stripe handles all payment processing, including cards, Apple Pay, and Google Pay.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-blue-600" />
							Payout Schedule
						</CardTitle>
						<CardDescription>
							When partners receive their earnings
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Schedule</Label>
							<Select value={payoutSchedule} onValueChange={(v) => setPayoutSchedule(v as "weekly" | "monthly")}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
									<SelectItem value="monthly">Monthly (1st of month)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<p className="text-sm text-muted-foreground">
							Partners will receive payouts {payoutSchedule === "weekly" ? "every Monday" : "on the 1st of each month"}.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5 text-green-600" />
						Payment Methods
					</CardTitle>
					<CardDescription>
						Enable or disable payment methods for customers
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3">
								<CreditCard className="h-5 w-5 text-blue-600" />
								<div>
									<p className="font-medium">Credit/Debit Cards</p>
									<p className="text-xs text-muted-foreground">Visa, Mastercard, etc.</p>
								</div>
							</div>
							<Switch
								checked={paymentMethods.cards}
								onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, cards: checked })}
							/>
						</div>

						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3">
								<Smartphone className="h-5 w-5 text-gray-800" />
								<div>
									<p className="font-medium">Apple Pay</p>
									<p className="text-xs text-muted-foreground">iOS devices</p>
								</div>
							</div>
							<Switch
								checked={paymentMethods.applePay}
								onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, applePay: checked })}
							/>
						</div>

						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3">
								<Wallet className="h-5 w-5 text-green-600" />
								<div>
									<p className="font-medium">Google Pay</p>
									<p className="text-xs text-muted-foreground">Android devices</p>
								</div>
							</div>
							<Switch
								checked={paymentMethods.googlePay}
								onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, googlePay: checked })}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">
					Last updated: {format(new Date(data.updatedAt), "PPpp")}
				</p>
			)}
		</div>
	);
}
