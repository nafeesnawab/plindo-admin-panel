export enum ProductCategory {
	OilFluids = "oil_fluids",
	TiresWheels = "tires_wheels",
	Cleaning = "cleaning",
	Accessories = "accessories",
	Parts = "parts",
	Other = "other",
}

export enum ProductStatus {
	Available = "available",
	Unavailable = "unavailable",
	OutOfStock = "out_of_stock",
}

export enum ProductOrderStatus {
	Pending = "pending",
	Ready = "ready",
	Collected = "collected",
	Cancelled = "cancelled",
}

export interface Product {
	id: string;
	partnerId: string;
	name: string;
	description?: string;
	category: ProductCategory;
	price: number;
	stock: number;
	imageUrl: string;
	status: ProductStatus;
	createdAt: string;
	updatedAt: string;
}

export interface ProductOrderItem {
	productId: string;
	name: string;
	quantity: number;
	price: number;
}

export interface ProductOrder {
	id: string;
	orderNumber: string;
	bookingId: string;
	bookingRef: string;
	serviceName: string;
	customerId: string;
	customerName: string;
	customerPhone?: string;
	partnerId: string;
	products: ProductOrderItem[];
	totalAmount: number;
	status: ProductOrderStatus;
	orderDate: string;
	pickupDate?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateProductDto {
	name: string;
	description?: string;
	category: ProductCategory;
	price: number;
	stock: number;
	imageUrl: string;
	status: ProductStatus;
}

export interface UpdateProductDto {
	name?: string;
	description?: string;
	category?: ProductCategory;
	price?: number;
	stock?: number;
	imageUrl?: string;
	status?: ProductStatus;
}

export interface ProductsListResponse {
	items: Product[];
	total: number;
	page: number;
	limit: number;
}

export interface ProductOrdersListResponse {
	items: ProductOrder[];
	total: number;
	page: number;
	limit: number;
}
