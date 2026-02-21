import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Crown, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import settingsService, {
	type SubscriptionPlan,
} from "@/api/services/settingsService";
import { Button } from "@/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";

function PlanCard({
	plan,
	onChange,
	accent,
	icon,
}: {
	plan: SubscriptionPlan;
	onChange: (p: SubscriptionPlan) => void;
	accent: "blue" | "amber";
	icon: React.ReactNode;
}) {
	return (
		<Card className={accent === "amber" ? "border-amber-200" : ""}>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{icon}
						{plan.name} Plan
					</div>
					<div className="flex items-center gap-2">
						<Switch
							checked={plan.enabled}
							onCheckedChange={(checked) => onChange({ ...plan, enabled: checked })}
						/>
						<span className="text-sm font-normal text-muted-foreground">
							{plan.enabled ? "Enabled" : "Disabled"}
						</span>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Price (EUR/month)</Label>
						<Input
							type="number"
							min={0}
							value={plan.price}
							onChange={(e) => onChange({ ...plan, price: Number(e.target.value) })}
						/>
					</div>
					<div className="space-y-2">
						<Label>Washes Included</Label>
						<Input
							type="number"
							min={0}
							value={plan.washesIncluded}
							onChange={(e) =>
								onChange({ ...plan, washesIncluded: Number(e.target.value) })
							}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label>Features (one per line)</Label>
					<Textarea
						rows={4}
						value={plan.features.join("\n")}
						onChange={(e) =>
							onChange({
								...plan,
								features: e.target.value.split("\n").filter(Boolean),
							})
						}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

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
		mutationFn: () => {
			if (!basicPlan || !premiumPlan) return Promise.reject(new Error("Plans not loaded"));
			return settingsService.updateSubscriptionPlans({ basic: basicPlan, premium: premiumPlan });
		},
		onSuccess: () => {
			toast.success("Subscription plans updated");
			queryClient.invalidateQueries({
				queryKey: ["settings-subscription-plans"],
			});
		},
		onError: () => toast.error("Failed to update plans"),
	});

	const hasChanges =
		data &&
		basicPlan &&
		premiumPlan &&
		(JSON.stringify(basicPlan) !== JSON.stringify(data.basic) ||
			JSON.stringify(premiumPlan) !== JSON.stringify(data.premium));

	if (isLoading || !basicPlan || !premiumPlan) {
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
					<h1 className="text-2xl font-bold">Subscription Plans</h1>
					<p className="text-muted-foreground">
						Manage subscription plan pricing and features
					</p>
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
				<PlanCard
					plan={basicPlan}
					onChange={setBasicPlan}
					accent="blue"
					icon={<Sparkles className="h-5 w-5 text-blue-600" />}
				/>
				<PlanCard
					plan={premiumPlan}
					onChange={setPremiumPlan}
					accent="amber"
					icon={<Crown className="h-5 w-5 text-amber-500" />}
				/>
			</div>

			{data?.updatedAt && (
				<p className="text-sm text-muted-foreground">
					Last updated: {format(new Date(data.updatedAt), "PPpp")}
				</p>
			)}
		</div>
	);
}
