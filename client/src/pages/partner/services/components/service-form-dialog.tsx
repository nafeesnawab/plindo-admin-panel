import { Droplets, Sparkles, Upload, X } from "lucide-react";

import type { ServiceCategory } from "@/types/booking";
import { SERVICE_CATEGORY_COLORS, SERVICE_CATEGORY_LABELS } from "@/types/booking";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";
import { cn } from "@/utils";

import type { ServiceBasicsData } from "../hooks/use-service-form";
import type { ServiceType } from "../types";
import { SERVICE_TYPE_CONFIG } from "../types";

const SERVICE_TYPE_DESCRIPTIONS: Record<ServiceType, string> = {
	book_me: "Customer drives to your location",
	pick_by_me: "You pick up & deliver the car",
	washing_van: "Your van goes to the customer",
};

const CATEGORY_ICONS: Record<ServiceCategory, React.ReactNode> = {
	wash: <Droplets className="h-4 w-4" />,
	detailing: <Sparkles className="h-4 w-4" />,
	other: <Droplets className="h-4 w-4" />,
};

interface ServiceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: ServiceBasicsData;
	setFormData: React.Dispatch<React.SetStateAction<ServiceBasicsData>>;
	isEditing: boolean;
	bannerPreview: string;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemoveBanner: () => void;
	onSave: () => void;
}

export function ServiceFormDialog({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	bannerPreview,
	fileInputRef,
	onFileUpload,
	onRemoveBanner,
	onSave,
}: ServiceFormDialogProps) {
	const handleTypeChange = (type: ServiceType) => {
		setFormData((prev) => ({ ...prev, serviceType: type }));
	};

	const handleCategoryChange = (category: ServiceCategory) => {
		setFormData((prev) => ({ ...prev, serviceCategory: category }));
	};

	const categories: ServiceCategory[] = ["wash", "detailing"];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Service" : "Create New Service"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update your service details. Pricing is managed separately."
							: "Set up the basics. You can configure pricing after creating."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 py-2">
					{/* Service Type */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">How is this service delivered? *</Label>
						<div className="grid gap-2 grid-cols-3">
							{(Object.keys(SERVICE_TYPE_CONFIG) as ServiceType[]).map((type) => {
								const config = SERVICE_TYPE_CONFIG[type];
								const isSelected = formData.serviceType === type;
								return (
									<button
										key={type}
										type="button"
										onClick={() => handleTypeChange(type)}
										disabled={isEditing}
										className={cn(
											"border rounded-lg p-2.5 text-center transition-all cursor-pointer",
											isSelected
												? "border-primary bg-primary/5 ring-1 ring-primary"
												: "border-border hover:border-primary/50 hover:bg-muted/50",
											isEditing && "opacity-60 cursor-not-allowed",
										)}
									>
										<div
											className={cn(
												"mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-1.5",
												config.color,
												config.darkColor,
											)}
										>
											{config.icon}
										</div>
										<p className="text-xs font-medium">{config.label}</p>
										<p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
											{SERVICE_TYPE_DESCRIPTIONS[type]}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* Category */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">Category *</Label>
						<div className="grid gap-2 grid-cols-2">
							{categories.map((cat) => {
								const isSelected = formData.serviceCategory === cat;
								const colors = SERVICE_CATEGORY_COLORS[cat];
								return (
									<button
										key={cat}
										type="button"
										onClick={() => handleCategoryChange(cat)}
										className={cn(
											"border rounded-lg p-2.5 text-left transition-all cursor-pointer flex items-center gap-2.5",
											isSelected
												? "border-primary bg-primary/5 ring-1 ring-primary"
												: "border-border hover:border-primary/50 hover:bg-muted/50",
										)}
									>
										<div className={cn("p-1.5 rounded-lg", colors.bg, colors.text)}>{CATEGORY_ICONS[cat]}</div>
										<span className="font-medium text-sm">{SERVICE_CATEGORY_LABELS[cat]}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Name + Duration */}
					<div className="grid gap-3 grid-cols-3">
						<div className="space-y-1.5 col-span-2">
							<Label htmlFor="svc-name" className="text-sm">
								Service Name *
							</Label>
							<Input
								id="svc-name"
								placeholder="e.g., Basic Exterior Wash"
								value={formData.name}
								onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="svc-duration" className="text-sm">
								Duration (min) *
							</Label>
							<Input
								id="svc-duration"
								type="number"
								min={5}
								step={5}
								value={formData.duration}
								onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
							/>
						</div>
					</div>

					{/* Description */}
					<div className="space-y-1.5">
						<Label htmlFor="svc-desc" className="text-sm">
							Description
						</Label>
						<Textarea
							id="svc-desc"
							placeholder="Briefly describe what this service includes..."
							value={formData.description}
							onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value.slice(0, 500) }))}
							className="min-h-[70px] resize-none text-sm"
						/>
						<p className="text-[10px] text-muted-foreground text-right">{formData.description.length}/500</p>
					</div>

					{/* Banner */}
					<div className="space-y-1.5">
						<Label className="text-sm">Banner Image</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={onFileUpload}
							className="hidden"
							id="svc-banner"
						/>
						{bannerPreview ? (
							<div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
								<img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
								<div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
									<Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
										<Upload className="h-3.5 w-3.5 mr-1.5" />
										Change
									</Button>
									<Button variant="destructive" size="sm" onClick={onRemoveBanner}>
										<X className="h-3.5 w-3.5 mr-1.5" />
										Remove
									</Button>
								</div>
							</div>
						) : (
							<label
								htmlFor="svc-banner"
								className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-border"
							>
								<Upload className="h-5 w-5 text-muted-foreground mb-1" />
								<span className="text-xs font-medium">Upload banner (optional)</span>
								<span className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</span>
							</label>
						)}
					</div>

					{/* Status */}
					<div className="flex items-center justify-between rounded-lg border border-border p-3">
						<div>
							<p className="text-sm font-medium">Active</p>
							<p className="text-xs text-muted-foreground">Service is visible and bookable</p>
						</div>
						<Switch
							checked={formData.status === "active"}
							onCheckedChange={(checked) =>
								setFormData((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
							}
						/>
					</div>
				</div>

				<DialogFooter className="gap-2 pt-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={onSave}>{isEditing ? "Save Changes" : "Create Service"}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
