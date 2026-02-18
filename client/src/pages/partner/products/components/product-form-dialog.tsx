import { Upload } from "lucide-react";

import { ProductCategory, ProductStatus } from "@/types/product";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";

import type { ProductFormData } from "../types";
import { CATEGORY_LABELS } from "../types";

interface ProductFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: ProductFormData;
	setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
	isEditing: boolean;
	imageInputRef: React.RefObject<HTMLInputElement | null>;
	onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSave: (e: React.FormEvent) => void;
	isPending: boolean;
}

export function ProductFormDialog({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	imageInputRef,
	onImageChange,
	onSave,
	isPending,
}: ProductFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
					<DialogDescription>
						{isEditing ? "Update product information" : "Add a new product to your shop"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={onSave} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="image">
							Product Image <span className="text-destructive">*</span>
						</Label>
						<div className="flex items-center gap-4">
							<div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
								{formData.imageUrl && !formData.imageUrl.startsWith("/placeholder") ? (
									<img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
								) : (
									<Upload className="h-8 w-8 text-muted-foreground" />
								)}
							</div>
							<div className="flex-1">
								<input
									ref={imageInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={onImageChange}
								/>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => imageInputRef.current?.click()}
								>
									<Upload className="mr-2 h-4 w-4" />
									{formData.imageUrl ? "Change Image" : "Upload Image"}
								</Button>
								<p className="text-xs text-muted-foreground mt-1">Max size: 5MB. JPG, PNG supported.</p>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">
							Product Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							placeholder="Enter product name"
							value={formData.name}
							onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
							maxLength={100}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							placeholder="Enter product description"
							value={formData.description}
							onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
							maxLength={500}
							rows={3}
						/>
						<p className="text-xs text-muted-foreground text-right">{formData.description.length}/500 characters</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="category">
								Category <span className="text-destructive">*</span>
							</Label>
							<Select
								value={formData.category}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as ProductCategory }))}
							>
								<SelectTrigger id="category">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(CATEGORY_LABELS).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="price">
								Price (&euro;) <span className="text-destructive">*</span>
							</Label>
							<Input
								id="price"
								type="number"
								step="0.01"
								min="0.01"
								placeholder="0.00"
								value={formData.price}
								onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="stock">
							Stock Quantity <span className="text-destructive">*</span>
						</Label>
						<Input
							id="stock"
							type="number"
							min="0"
							placeholder="0"
							value={formData.stock}
							onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
							required
						/>
						{formData.stock === "0" && (
							<p className="text-sm text-yellow-600 dark:text-yellow-400">Product will be marked as Out of Stock</p>
						)}
					</div>

					{formData.stock !== "0" && (
						<div className="flex items-center justify-between rounded-lg border border-border p-3">
							<Label htmlFor="status" className="text-sm font-medium">
								Available for Sale
							</Label>
							<Switch
								id="status"
								checked={formData.status === ProductStatus.Available}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({
										...prev,
										status: checked ? ProductStatus.Available : ProductStatus.Unavailable,
									}))
								}
							/>
						</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isEditing ? "Update Product" : "Add Product"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
