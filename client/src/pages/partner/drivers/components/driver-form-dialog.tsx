import { FileText, Upload } from "lucide-react";

import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

import type { DriverFormData } from "../types";

interface DriverFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: DriverFormData;
	setFormData: React.Dispatch<React.SetStateAction<DriverFormData>>;
	isEditing: boolean;
	licenseInputRef: React.RefObject<HTMLInputElement | null>;
	insuranceInputRef: React.RefObject<HTMLInputElement | null>;
	photoInputRef: React.RefObject<HTMLInputElement | null>;
	onLicenseUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onInsuranceUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSave: () => void;
	isPending: boolean;
}

export function DriverFormDialog({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	licenseInputRef,
	insuranceInputRef,
	photoInputRef,
	onLicenseUpload,
	onInsuranceUpload,
	onPhotoUpload,
	onSave,
	isPending,
}: DriverFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Driver" : "Add New Driver"}</DialogTitle>
					<DialogDescription>
						{isEditing ? "Update driver information and documents" : "Add a new driver to your team"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-6 py-4">
					<div className="space-y-4">
						<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
							Basic Information
						</h4>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="fullName">
									Full Name <span className="text-destructive">*</span>
								</Label>
								<Input
									id="fullName"
									value={formData.fullName}
									onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
									placeholder="Enter full name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">
									Phone Number <span className="text-destructive">*</span>
								</Label>
								<Input
									id="phone"
									value={formData.phone}
									onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
									placeholder="+1 (555) 123-4567"
								/>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="email">
									Email <span className="text-destructive">*</span>
								</Label>
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
									placeholder="driver@email.com"
								/>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
							Driver's License
						</h4>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="licenseNumber">
									License Number <span className="text-destructive">*</span>
								</Label>
								<Input
									id="licenseNumber"
									value={formData.licenseNumber}
									onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
									placeholder="DL-XXXXXXXXX"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="licenseExpiry">
									License Expiry Date <span className="text-destructive">*</span>
								</Label>
								<Input
									id="licenseExpiry"
									type="date"
									value={formData.licenseExpiry}
									onChange={(e) => setFormData((prev) => ({ ...prev, licenseExpiry: e.target.value }))}
								/>
							</div>
							<div className="space-y-2 sm:col-span-2">
								<Label>License Document</Label>
								<div className="flex items-center gap-4">
									<input
										ref={licenseInputRef}
										type="file"
										accept="image/*,.pdf"
										className="hidden"
										onChange={onLicenseUpload}
									/>
									<Button
										variant="outline"
										className="w-full"
										type="button"
										onClick={() => licenseInputRef.current?.click()}
									>
										<Upload className="mr-2 h-4 w-4" />
										Upload License (Image/PDF)
									</Button>
									{formData.licenseUrl && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<FileText className="h-4 w-4" />
											Document uploaded
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Insurance</h4>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="insuranceExpiry">
									Insurance Expiry Date <span className="text-destructive">*</span>
								</Label>
								<Input
									id="insuranceExpiry"
									type="date"
									value={formData.insuranceExpiry}
									onChange={(e) => setFormData((prev) => ({ ...prev, insuranceExpiry: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label>Insurance Document</Label>
								<input
									ref={insuranceInputRef}
									type="file"
									accept="image/*,.pdf"
									className="hidden"
									onChange={onInsuranceUpload}
								/>
								<Button
									variant="outline"
									className="w-full"
									type="button"
									onClick={() => insuranceInputRef.current?.click()}
								>
									<Upload className="mr-2 h-4 w-4" />
									Upload Insurance Paper
								</Button>
								{formData.insuranceUrl && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<FileText className="h-4 w-4" />
										Document uploaded
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Additional</h4>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Photo (Optional)</Label>
								<div className="flex items-center gap-4">
									{formData.photoUrl && (
										<img src={formData.photoUrl} alt="Driver" className="h-16 w-16 rounded-full object-cover" />
									)}
									<div className="flex-1">
										<input
											ref={photoInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={onPhotoUpload}
										/>
										<Button
											variant="outline"
											className="w-full"
											type="button"
											onClick={() => photoInputRef.current?.click()}
										>
											<Upload className="mr-2 h-4 w-4" />
											{formData.photoUrl ? "Change Photo" : "Upload Photo"}
										</Button>
									</div>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="status">Status</Label>
								<Select
									value={formData.status}
									onValueChange={(value: "active" | "inactive") =>
										setFormData((prev) => ({ ...prev, status: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Active</SelectItem>
										<SelectItem value="inactive">Inactive</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={onSave} disabled={isPending}>
						{isPending ? "Saving..." : isEditing ? "Update Driver" : "Add Driver"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
