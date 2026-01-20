import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import settingsService, { type SubscriptionPlan } from "@/api/services/settingsService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";
import { format } from "date-fns";
import { Crown, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionPlansPage() {
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
		mutationFn: () => settingsService.updateSubscriptionPlans({
			basic: basicPlan!,
			premium: premiumPlan!,
		}),
		onSuccess: () => {
			toast.success("Subscription plans updated");
			queryClient.invalidateQueries({ queryKey: ["settings-subscription-plans"] });
		},
		onError: () => {
			toast.error("Failed to update plans");
		},
	});

	const hasChanges = data && basicPlan && premiumPlan && (
		JSON.stringify(basicPlan) !== JSON.stringify(data.basic) ||
		JSON.stringify(premiumPlan) !== JSON.stringify(data.premium)
	);

	if (isLoading || !basicPlan || !premiumPlan) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Skeleton className="h-[400px]" />
					<Skeleton className="h-[400px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Subscription Plans</h1>
					<p className="text-muted-foreground">Manage subscription plan pricing and features</p>
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
						<CardDescription>Entry-level subscription for casual users</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Price (€/month)</Label>
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
								rows={4}
								value={basicPlan.features.join("\n")}
								onChange={(e) => setBasicPlan({ 
									...basicPlan, 
									features: e.target.value.split("\n").filter(Boolean) 
								})}
							/>
						</div>
						<div className="p-4 bg-blue-500/10 rounded-lg">
							<p className="text-sm font-medium text-blue-600">Preview</p>
							<p className="text-2xl font-bold">€{basicPlan.price}<span className="text-sm font-normal">/month</span></p>
							<p className="text-sm text-muted-foreground">{basicPlan.washesIncluded} washes included</p>
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
						<CardDescription>Full-featured subscription for power users</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Price (€/month)</Label>
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
								rows={4}
								value={premiumPlan.features.join("\n")}
								onChange={(e) => setPremiumPlan({ 
									...premiumPlan, 
									features: e.target.value.split("\n").filter(Boolean) 
								})}
							/>
						</div>
						<div className="p-4 bg-amber-500/10 rounded-lg">
							<p className="text-sm font-medium text-amber-600">Preview</p>
							<p className="text-2xl font-bold">€{premiumPlan.price}<span className="text-sm font-normal">/month</span></p>
							<p className="text-sm text-muted-foreground">{premiumPlan.washesIncluded} washes included</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">
					Last updated: {format(new Date(data.updatedAt), "PPpp")}
				</p>
			)}
		</div>
	);
}
