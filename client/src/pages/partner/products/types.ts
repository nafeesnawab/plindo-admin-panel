import { ProductCategory, ProductOrderStatus, ProductStatus } from "@/types/product";

export const PARTNER_ID = "demo-partner-1";

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
	[ProductCategory.OilFluids]: "Oil & Fluids",
	[ProductCategory.TiresWheels]: "Tires & Wheels",
	[ProductCategory.Cleaning]: "Cleaning Products",
	[ProductCategory.Accessories]: "Accessories",
	[ProductCategory.Parts]: "Car Parts",
	[ProductCategory.Other]: "Other",
};

export const STATUS_CONFIG: Record<ProductStatus, { label: string; color: string; darkColor: string }> = {
	[ProductStatus.Available]: {
		label: "Available",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		darkColor: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
	},
	[ProductStatus.Unavailable]: {
		label: "Unavailable",
		color: "bg-gray-50 text-gray-600 border-gray-200",
		darkColor: "dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
	},
	[ProductStatus.OutOfStock]: {
		label: "Out of Stock",
		color: "bg-red-50 text-red-700 border-red-200",
		darkColor: "dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
	},
};

export const ORDER_STATUS_CONFIG: Record<ProductOrderStatus, { label: string; color: string; darkColor: string }> = {
	[ProductOrderStatus.Pending]: {
		label: "Pending",
		color: "bg-yellow-50 text-yellow-700 border-yellow-200",
		darkColor: "dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
	},
	[ProductOrderStatus.Ready]: {
		label: "Ready",
		color: "bg-blue-50 text-blue-700 border-blue-200",
		darkColor: "dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
	},
	[ProductOrderStatus.Collected]: {
		label: "Collected",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		darkColor: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
	},
	[ProductOrderStatus.Cancelled]: {
		label: "Cancelled",
		color: "bg-red-50 text-red-700 border-red-200",
		darkColor: "dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
	},
};

export interface ProductFormData {
	name: string;
	description: string;
	category: ProductCategory;
	price: string;
	stock: string;
	imageUrl: string;
	status: ProductStatus;
}

export const getInitialFormData = (): ProductFormData => ({
	name: "",
	description: "",
	category: ProductCategory.Other,
	price: "",
	stock: "",
	imageUrl: "",
	status: ProductStatus.Available,
});
