import { useRef, useState } from "react";
import { toast } from "sonner";

import type { Product } from "@/types/product";
import { ProductStatus } from "@/types/product";

import type { ProductFormData } from "../types";
import { getInitialFormData } from "../types";

export function useProductForm() {
	const [formData, setFormData] = useState<ProductFormData>(getInitialFormData());
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [showForm, setShowForm] = useState(false);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setFormData((prev) => ({ ...prev, imageUrl: url }));
			e.target.value = "";
		}
	};

	const openForm = (product?: Product) => {
		if (product) {
			setEditingProduct(product);
			setFormData({
				name: product.name,
				description: product.description || "",
				category: product.category,
				price: product.price.toString(),
				stock: product.stock.toString(),
				imageUrl: product.imageUrl,
				status: product.status === ProductStatus.OutOfStock ? ProductStatus.Available : product.status,
			});
		} else {
			setEditingProduct(null);
			setFormData(getInitialFormData());
		}
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditingProduct(null);
	};

	const validate = (): boolean => {
		if (!formData.name || !formData.price || !formData.stock) {
			toast.error("Please fill in all required fields");
			return false;
		}
		if (!editingProduct && !formData.imageUrl) {
			toast.error("Product image is required");
			return false;
		}
		if (Number.parseFloat(formData.price) <= 0) {
			toast.error("Price must be greater than 0");
			return false;
		}
		if (Number.parseInt(formData.stock) < 0) {
			toast.error("Stock cannot be negative");
			return false;
		}
		return true;
	};

	const getPayload = () => ({
		name: formData.name,
		description: formData.description || undefined,
		category: formData.category,
		price: Number.parseFloat(formData.price),
		stock: Number.parseInt(formData.stock),
		imageUrl: formData.imageUrl,
		status: Number.parseInt(formData.stock) === 0 ? ProductStatus.OutOfStock : formData.status,
	});

	return {
		formData,
		setFormData,
		editingProduct,
		showForm,
		setShowForm,
		imageInputRef,
		handleImageChange,
		openForm,
		closeForm,
		validate,
		getPayload,
		isEditing: !!editingProduct,
	};
}
