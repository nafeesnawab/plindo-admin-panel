import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "antd";
import { format } from "date-fns";
import {
	Bell,
	Building2,
	Calendar,
	Clock,
	CreditCard,
	Crown,
	Edit,
	Megaphone,
	Percent,
	Save,
	Settings,
	Smartphone,
	Sparkles,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import settingsService, {
	type NotificationTemplate,
	type NotificationTypes,
	type SubscriptionPlan,
} from "@/api/services/settingsService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";

function CommissionTab() {
	const queryClient = useQueryClient();
	const [customerCommission, setCustomerCommission] = useState(10);
	const [partnerCommission, setPartnerCommission] = useState(10);

	const { data, isLoading } = useQuery({
		queryKey: ["settings-commission"],
		queryFn: () => settingsService.getCommissionSettings(),
	});

	useEffect(() => {
		if (data) {
			setCustomerCommission(data.customerCommission);
			setPartnerCommission(data.partnerCommission);
		}
	}, [data]);

	const updateMutation = useMutation({
		mutationFn: () => settingsService.updateCommissionSettings({ customerCommission, partnerCommission }),
		onSuccess: () => {
			toast.success("Commission settings updated");
			queryClient.invalidateQueries({ queryKey: ["settings-commission"] });
		},
		onError: () => toast.error("Failed to update settings"),
	});

	const hasChanges =
		data && (customerCommission !== data.customerCommission || partnerCommission !== data.partnerCommission);

	if (isLoading) return <Skeleton className="h-[200px]" />;

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex justify-end">
				<Button onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending}>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5 text-blue-600" />
							Customer Commission
						</CardTitle>
						<CardDescription>Percentage charged to customers on each booking</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-2">
							<Input
								type="number"
								min={0}
								max={50}
								value={customerCommission}
								onChange={(e) => setCustomerCommission(Number(e.target.value))}
								className="w-24"
							/>
							<Percent className="h-4 w-4 text-muted-foreground" />
						</div>
						<p className="text-sm text-muted-foreground">
							For a EUR20 service, customer pays <strong>EUR{(20 * (1 + customerCommission / 100)).toFixed(2)}</strong>
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-green-600" />
							Partner Commission
						</CardTitle>
						<CardDescription>Percentage deducted from partner earnings</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-2">
							<Input
								type="number"
								min={0}
								max={50}
								value={partnerCommission}
								onChange={(e) => setPartnerCommission(Number(e.target.value))}
								className="w-24"
							/>
							<Percent className="h-4 w-4 text-muted-foreground" />
						</div>
						<p className="text-sm text-muted-foreground">
							For a EUR20 service, partner receives{" "}
							<strong>EUR{(20 * (1 - partnerCommission / 100)).toFixed(2)}</strong>
						</p>
					</CardContent>
				</Card>
			</div>
			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">Last updated: {format(new Date(data.updatedAt), "PPpp")}</p>
			)}
		</div>
	);
}

function BookingRulesTab() {
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
		onError: () => toast.error("Failed to update settings"),
	});

	const hasChanges =
		data &&
		(minAdvanceHours !== data.minAdvanceBookingHours ||
			maxAdvanceDays !== data.maxAdvanceBookingDays ||
			cancellationWindow !== data.cancellationWindowHours);

	if (isLoading) return <Skeleton className="h-[200px]" />;

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex justify-end">
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
							Min Advance Time
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
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
						<p className="text-sm text-muted-foreground">Must book at least {minAdvanceHours}h before appointment.</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-green-600" />
							Max Advance Time
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
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
						<p className="text-sm text-muted-foreground">Can book up to {maxAdvanceDays} days ahead.</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<XCircle className="h-5 w-5 text-red-600" />
							Cancellation Window
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
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
						<p className="text-sm text-muted-foreground">Free cancel if {cancellationWindow}h+ before appointment.</p>
					</CardContent>
				</Card>
			</div>
			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">Last updated: {format(new Date(data.updatedAt), "PPpp")}</p>
			)}
		</div>
	);
}

function SubscriptionPlansTab() {
	const queryClient = useQueryClient();
	const [basicPlan, setBasicPlan] = useState<SubscriptionPlan | null>(null);
	const [premiumPlan, setPremiumPlan] = useState<SubscriptionPlan | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["settings-subscription-plans"],
		queryFn: () => settingsService.getSubscriptionPlans(),
	});

	useEffect(() => {
		if (data) {
			setBasicPlan(data.basic);
			setPremiumPlan(data.premium);
		}
	}, [data]);

	const updateMutation = useMutation({
		mutationFn: () => settingsService.updateSubscriptionPlans({ basic: basicPlan!, premium: premiumPlan! }),
		onSuccess: () => {
			toast.success("Subscription plans updated");
			queryClient.invalidateQueries({ queryKey: ["settings-subscription-plans"] });
		},
		onError: () => toast.error("Failed to update plans"),
	});

	const hasChanges =
		data &&
		basicPlan &&
		premiumPlan &&
		(JSON.stringify(basicPlan) !== JSON.stringify(data.basic) ||
			JSON.stringify(premiumPlan) !== JSON.stringify(data.premium));

	if (isLoading || !basicPlan || !premiumPlan) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex justify-end">
				<Button onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending}>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="h-5 w-5 text-blue-600" />
								Basic Plan
							</CardTitle>
							<div className="flex items-center gap-2">
								<Switch
									checked={basicPlan.enabled}
									onCheckedChange={(checked) => setBasicPlan({ ...basicPlan, enabled: checked })}
								/>
								<Badge variant={basicPlan.enabled ? "default" : "secondary"}>
									{basicPlan.enabled ? "Enabled" : "Disabled"}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Price (EUR/month)</Label>
								<Input
									type="number"
									min={0}
									value={basicPlan.price}
									onChange={(e) => setBasicPlan({ ...basicPlan, price: Number(e.target.value) })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Washes Included</Label>
								<Input
									type="number"
									min={1}
									value={basicPlan.washesIncluded}
									onChange={(e) => setBasicPlan({ ...basicPlan, washesIncluded: Number(e.target.value) })}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Features (one per line)</Label>
							<Textarea
								rows={3}
								value={basicPlan.features.join("\n")}
								onChange={(e) => setBasicPlan({ ...basicPlan, features: e.target.value.split("\n").filter(Boolean) })}
							/>
						</div>
					</CardContent>
				</Card>
				<Card className="border-amber-200">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Crown className="h-5 w-5 text-amber-500" />
								Premium Plan
							</CardTitle>
							<div className="flex items-center gap-2">
								<Switch
									checked={premiumPlan.enabled}
									onCheckedChange={(checked) => setPremiumPlan({ ...premiumPlan, enabled: checked })}
								/>
								<Badge variant={premiumPlan.enabled ? "default" : "secondary"}>
									{premiumPlan.enabled ? "Enabled" : "Disabled"}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Price (EUR/month)</Label>
								<Input
									type="number"
									min={0}
									value={premiumPlan.price}
									onChange={(e) => setPremiumPlan({ ...premiumPlan, price: Number(e.target.value) })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Washes Included</Label>
								<Input
									type="number"
									min={1}
									value={premiumPlan.washesIncluded}
									onChange={(e) => setPremiumPlan({ ...premiumPlan, washesIncluded: Number(e.target.value) })}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Features (one per line)</Label>
							<Textarea
								rows={3}
								value={premiumPlan.features.join("\n")}
								onChange={(e) =>
									setPremiumPlan({ ...premiumPlan, features: e.target.value.split("\n").filter(Boolean) })
								}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">Last updated: {format(new Date(data.updatedAt), "PPpp")}</p>
			)}
		</div>
	);
}

function PaymentTab() {
	const queryClient = useQueryClient();
	const [paymentMethods, setPaymentMethods] = useState({ cards: true, applePay: true, googlePay: true });
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
		mutationFn: () => settingsService.updatePaymentSettings({ paymentMethods, payoutSchedule }),
		onSuccess: () => {
			toast.success("Payment settings updated");
			queryClient.invalidateQueries({ queryKey: ["settings-payment"] });
		},
		onError: () => toast.error("Failed to update settings"),
	});

	const hasChanges =
		data &&
		(JSON.stringify(paymentMethods) !== JSON.stringify(data.paymentMethods) || payoutSchedule !== data.payoutSchedule);

	if (isLoading) return <Skeleton className="h-[200px]" />;

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex justify-end">
				<Button onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending}>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Wallet className="h-5 w-5 text-purple-600" />
							Stripe
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between p-3 border rounded-lg">
							<div>
								<p className="font-medium">Stripe</p>
								<p className="text-xs text-muted-foreground">{data?.stripeAccountId || "Not connected"}</p>
							</div>
							{data?.stripeConnected ? (
								<Badge className="bg-green-500/10 text-green-600">Connected</Badge>
							) : (
								<Badge variant="destructive">Disconnected</Badge>
							)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-blue-600" />
							Payout Schedule
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Select value={payoutSchedule} onValueChange={(v) => setPayoutSchedule(v as "weekly" | "monthly")}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
								<SelectItem value="monthly">Monthly (1st of month)</SelectItem>
							</SelectContent>
						</Select>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5 text-green-600" />
						Payment Methods
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3">
								<CreditCard className="h-5 w-5 text-blue-600" />
								<div>
									<p className="font-medium">Cards</p>
									<p className="text-xs text-muted-foreground">Visa, Mastercard</p>
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
									<p className="text-xs text-muted-foreground">Android</p>
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
				<p className="text-sm text-muted-foreground">Last updated: {format(new Date(data.updatedAt), "PPpp")}</p>
			)}
		</div>
	);
}

const notificationTypeLabels: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
	bookingConfirmation: {
		label: "Booking Confirmation",
		icon: <Calendar className="h-4 w-4" />,
		description: "Sent when a booking is confirmed",
	},
	bookingReminder: {
		label: "Booking Reminder",
		icon: <Bell className="h-4 w-4" />,
		description: "Sent 24 hours before appointment",
	},
	bookingCancellation: {
		label: "Booking Cancellation",
		icon: <XCircle className="h-4 w-4" />,
		description: "Sent when a booking is cancelled",
	},
	paymentSuccess: {
		label: "Payment Success",
		icon: <CreditCard className="h-4 w-4" />,
		description: "Sent when payment is successful",
	},
	paymentFailed: {
		label: "Payment Failed",
		icon: <CreditCard className="h-4 w-4" />,
		description: "Sent when payment fails",
	},
	promotions: { label: "Promotions", icon: <Megaphone className="h-4 w-4" />, description: "Marketing messages" },
	systemUpdates: {
		label: "System Updates",
		icon: <Settings className="h-4 w-4" />,
		description: "Platform announcements",
	},
};

function NotificationsTab() {
	const queryClient = useQueryClient();
	const [types, setTypes] = useState<NotificationTypes>({
		bookingConfirmation: true,
		bookingReminder: true,
		bookingCancellation: true,
		paymentSuccess: true,
		paymentFailed: true,
		promotions: true,
		systemUpdates: true,
	});
	const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
	const [templateSubject, setTemplateSubject] = useState("");
	const [templateBody, setTemplateBody] = useState("");

	const { data: settingsData, isLoading: settingsLoading } = useQuery({
		queryKey: ["settings-notifications"],
		queryFn: () => settingsService.getNotificationSettings(),
	});

	const { data: templatesData, isLoading: templatesLoading } = useQuery({
		queryKey: ["settings-notification-templates"],
		queryFn: () => settingsService.getNotificationTemplates(),
	});

	useEffect(() => {
		if (settingsData) setTypes(settingsData.types);
	}, [settingsData]);

	const updateSettingsMutation = useMutation({
		mutationFn: () => settingsService.updateNotificationSettings({ types }),
		onSuccess: () => {
			toast.success("Notification settings updated");
			queryClient.invalidateQueries({ queryKey: ["settings-notifications"] });
		},
		onError: () => toast.error("Failed to update settings"),
	});

	const updateTemplateMutation = useMutation({
		mutationFn: () =>
			settingsService.updateNotificationTemplate(editingTemplate!.id, { subject: templateSubject, body: templateBody }),
		onSuccess: () => {
			toast.success("Template updated");
			queryClient.invalidateQueries({ queryKey: ["settings-notification-templates"] });
			setEditingTemplate(null);
		},
		onError: () => toast.error("Failed to update template"),
	});

	const hasChanges = settingsData && JSON.stringify(types) !== JSON.stringify(settingsData.types);

	if (settingsLoading || templatesLoading) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex justify-end">
				<Button
					onClick={() => updateSettingsMutation.mutate()}
					disabled={!hasChanges || updateSettingsMutation.isPending}
				>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5 text-blue-600" />
						Notification Types
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{Object.entries(notificationTypeLabels).map(([key, { label, icon, description }]) => (
							<div key={key} className="flex items-center justify-between p-3 border rounded-lg">
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-lg bg-muted">{icon}</div>
									<div>
										<p className="font-medium text-sm">{label}</p>
										<p className="text-xs text-muted-foreground">{description}</p>
									</div>
								</div>
								<Switch
									checked={types[key as keyof NotificationTypes] ?? true}
									onCheckedChange={(checked) => setTypes({ ...types, [key as keyof NotificationTypes]: checked })}
								/>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Edit className="h-5 w-5 text-green-600" />
						Email Templates
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{templatesData?.map((template) => (
							<div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm">{template.name}</p>
									<p className="text-xs text-muted-foreground truncate">{template.subject}</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setEditingTemplate(template);
										setTemplateSubject(template.subject);
										setTemplateBody(template.body);
									}}
								>
									<Edit className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
			{settingsData?.updatedAt && (
				<p className="text-sm text-muted-foreground">
					Last updated: {format(new Date(settingsData.updatedAt), "PPpp")}
				</p>
			)}

			<Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Subject</Label>
							<Input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} />
						</div>
						<div className="space-y-2">
							<Label>Body</Label>
							<Textarea rows={5} value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} />
						</div>
						<div>
							<p className="text-sm text-muted-foreground mb-2">Available variables:</p>
							<div className="flex gap-1 flex-wrap">
								{editingTemplate?.variables.map((v) => (
									<Badge
										key={v}
										variant="outline"
										className="text-xs cursor-pointer"
										onClick={() => setTemplateBody(templateBody + `{{${v}}}`)}
									>{`{{${v}}}`}</Badge>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingTemplate(null)}>
							Cancel
						</Button>
						<Button onClick={() => updateTemplateMutation.mutate()} disabled={updateTemplateMutation.isPending}>
							Save Template
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default function PlatformSettingsPage() {
	const [activeTab, setActiveTab] = useState("commission");

	const tabItems = [
		{ key: "commission", label: "Commission", children: <CommissionTab /> },
		{ key: "booking-rules", label: "Booking Rules", children: <BookingRulesTab /> },
		{ key: "subscription-plans", label: "Subscription Plans", children: <SubscriptionPlansTab /> },
		{ key: "payment", label: "Payment", children: <PaymentTab /> },
		{ key: "notifications", label: "Notifications", children: <NotificationsTab /> },
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>
		</div>
	);
}
