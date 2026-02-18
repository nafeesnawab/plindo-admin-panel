import { ArrowLeft, Car, Plus, Trash2 } from "lucide-react";

import { SERVICE_CATEGORY_LABELS } from "@/types/booking";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { cn } from "@/utils";

import type { CarOverride, DistanceCharges, Service } from "../types";
import { getInitialDistanceCharges, SERVICE_TYPE_CONFIG } from "../types";

interface ServicePricingPanelProps {
	service: Service;
	bodyTypePricing: { bodyType: string; price: number }[];
	carOverrides: CarOverride[];
	distanceCharges: DistanceCharges | undefined;
	onUpdateBodyTypePrice: (bodyType: string, price: number) => void;
	onRemoveCarOverride: (carId: string) => void;
	onUpdateCarOverridePrice: (carId: string, price: number) => void;
	getBodyTypeDefaultPrice: (bodyType: string) => number;
	onOpenCarOverride: () => void;
	onUpdateDistanceCharge: (key: keyof DistanceCharges, value: number) => void;
	onSave: () => void;
	onBack: () => void;
}

export function ServicePricingPanel({
	service,
	bodyTypePricing,
	carOverrides,
	distanceCharges,
	onUpdateBodyTypePrice,
	onRemoveCarOverride,
	onUpdateCarOverridePrice,
	getBodyTypeDefaultPrice,
	onOpenCarOverride,
	onUpdateDistanceCharge,
	onSave,
	onBack,
}: ServicePricingPanelProps) {
	const typeConfig = SERVICE_TYPE_CONFIG[service.serviceType];
	const needsDistanceCharges = service.serviceType === "pick_by_me";

	return (
		<div className="flex flex-col h-[calc(100vh-var(--layout-header-height)-48px)]">
			{/* Compact header bar */}
			<div className="flex items-center justify-between pb-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex items-center gap-2">
						<span className="text-sm font-semibold">{service.name}</span>
						<span className="text-xs text-muted-foreground">·</span>
						<span className="text-xs text-muted-foreground">{typeConfig.label}</span>
						<span className="text-xs text-muted-foreground">·</span>
						<span className="text-xs text-muted-foreground">{SERVICE_CATEGORY_LABELS[service.serviceCategory]}</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={onBack}>
						Cancel
					</Button>
					<Button size="sm" onClick={onSave}>
						Save Pricing
					</Button>
				</div>
			</div>

			{/* Two-column layout filling remaining space */}
			<div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
				{/* Left: Body Type Pricing */}
				<div className="flex flex-col rounded-lg border border-border overflow-hidden">
					<div className="px-4 py-3 border-b border-border bg-muted/40">
						<p className="text-sm font-semibold">Body Type Prices</p>
						<p className="text-xs text-muted-foreground mt-0.5">Default price per vehicle body type</p>
					</div>
					<div className="flex-1 overflow-auto">
						<div className="divide-y divide-border">
							{bodyTypePricing.map((bp) => (
								<div key={bp.bodyType} className="flex items-center justify-between px-4 py-2.5">
									<span className="text-sm font-medium">{bp.bodyType}</span>
									<div className="flex items-center gap-1.5">
										<span className="text-xs text-muted-foreground">{"\u00A3"}</span>
										<Input
											type="number"
											min={0}
											step={0.5}
											value={bp.price || ""}
											onChange={(e) => onUpdateBodyTypePrice(bp.bodyType, parseFloat(e.target.value) || 0)}
											className="w-20 h-7 text-sm text-right"
											placeholder="0"
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Distance charges inline below body types if needed */}
					{needsDistanceCharges && (
						<div className="border-t border-border">
							<div className="px-4 py-3 border-b border-border bg-muted/40">
								<p className="text-sm font-semibold">Distance Charges</p>
								<p className="text-xs text-muted-foreground mt-0.5">Pickup distance surcharge</p>
							</div>
							<div className="grid grid-cols-3 gap-3 p-4">
								{(["0-1km", "1-2km", "2-3km"] as const).map((key) => (
									<div key={key} className="space-y-1">
										<Label className="text-xs text-muted-foreground">{key.replace("km", " km")}</Label>
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-muted-foreground">{"\u00A3"}</span>
											<Input
												type="number"
												min={0}
												step={0.5}
												value={distanceCharges?.[key] ?? getInitialDistanceCharges()[key]}
												onChange={(e) => onUpdateDistanceCharge(key, parseFloat(e.target.value) || 0)}
												className="h-7 text-sm"
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right: Car Overrides */}
				<div className="flex flex-col rounded-lg border border-border overflow-hidden">
					<div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
						<div>
							<p className="text-sm font-semibold">Car-Specific Overrides</p>
							<p className="text-xs text-muted-foreground mt-0.5">Custom prices for specific cars</p>
						</div>
						<Button variant="outline" size="sm" onClick={onOpenCarOverride} className="h-7 text-xs gap-1.5">
							<Plus className="h-3.5 w-3.5" />
							Add
						</Button>
					</div>
					<div className="flex-1 overflow-auto">
						{carOverrides.length > 0 ? (
							<div className="divide-y divide-border">
								{carOverrides.map((co) => {
									const defaultPrice = getBodyTypeDefaultPrice(co.bodyType);
									return (
										<div key={co.carId} className="flex items-center justify-between px-4 py-2.5 gap-3">
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium truncate">
													{co.make} {co.model}
												</p>
												<p className="text-xs text-muted-foreground">
													{co.bodyType} · default {"\u00A3"}
													{defaultPrice}
												</p>
											</div>
											<div className="flex items-center gap-1.5 shrink-0">
												<span className="text-xs text-muted-foreground">{"\u00A3"}</span>
												<Input
													type="number"
													min={0}
													step={0.5}
													value={co.price || ""}
													onChange={(e) => onUpdateCarOverridePrice(co.carId, parseFloat(e.target.value) || 0)}
													className="w-20 h-7 text-sm text-right"
												/>
												<Button
													variant="ghost"
													size="icon"
													className={cn("h-7 w-7 shrink-0")}
													onClick={() => onRemoveCarOverride(co.carId)}
												>
													<Trash2 className="h-3.5 w-3.5 text-destructive" />
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
								<Car className="h-8 w-8 mb-2 opacity-30" />
								<p className="text-sm font-medium">No overrides</p>
								<p className="text-xs mt-1 max-w-[200px]">
									Add one only if a specific car needs a different price than its body type default.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
