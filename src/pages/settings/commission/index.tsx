import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import settingsService from "@/api/services/settingsService";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";
import { format } from "date-fns";
import { Percent, Save, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function CommissionSettingsPage() {
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
		mutationFn: () => settingsService.updateCommissionSettings({
			customerCommission,
			partnerCommission,
		}),
		onSuccess: () => {
			toast.success("Commission settings updated");
			queryClient.invalidateQueries({ queryKey: ["settings-commission"] });
		},
		onError: () => {
			toast.error("Failed to update settings");
		},
	});

	const hasChanges = data && (
		customerCommission !== data.customerCommission ||
		partnerCommission !== data.partnerCommission
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
					<h1 className="text-2xl font-bold">Commission Settings</h1>
					<p className="text-muted-foreground">Configure platform commission rates</p>
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
							<Users className="h-5 w-5 text-blue-600" />
							Customer Commission
						</CardTitle>
						<CardDescription>
							Percentage charged to customers on each booking
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Commission Rate (%)</Label>
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
						</div>
						<div className="p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Example: For a €20 service, customer pays <strong>€{(20 * (1 + customerCommission / 100)).toFixed(2)}</strong>
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								Platform earns: <strong>€{(20 * customerCommission / 100).toFixed(2)}</strong>
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-green-600" />
							Partner Commission
						</CardTitle>
						<CardDescription>
							Percentage deducted from partner earnings on each booking
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Commission Rate (%)</Label>
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
						</div>
						<div className="p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Example: For a €20 service, partner receives <strong>€{(20 * (1 - partnerCommission / 100)).toFixed(2)}</strong>
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								Platform earns: <strong>€{(20 * partnerCommission / 100).toFixed(2)}</strong>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Total Platform Commission (per €20 booking)</p>
							<p className="text-sm text-muted-foreground">
								Customer commission + Partner commission
							</p>
						</div>
						<div className="text-right">
							<p className="text-2xl font-bold text-green-600">
								€{((20 * customerCommission / 100) + (20 * partnerCommission / 100)).toFixed(2)}
							</p>
							<p className="text-sm text-muted-foreground">
								{customerCommission + partnerCommission}% total
							</p>
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
