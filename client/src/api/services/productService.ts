import apiClient from "../apiClient";
import type {
	CreateProductDto,
	Product,
	ProductOrder,
	ProductOrdersListResponse,
	ProductsListResponse,
	UpdateProductDto,
} from "@/types/product";

export enum ProductApi {
	Products = "/partner/products",
	ProductDetails = "/partner/products/:id",
	UpdateStock = "/partner/products/:id/stock",
	ToggleAvailability = "/partner/products/:id/toggle",
	ProductOrders = "/partner/product-orders",
	ProductOrderDetails = "/partner/product-orders/:id",
	UpdateOrderStatus = "/partner/product-orders/:id/status",
	CancelOrder = "/partner/product-orders/:id/cancel",
}

interface GetProductsParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	category?: string;
}

interface GetProductOrdersParams {
	page?: number;
	limit?: number;
	status?: string;
}

const getProducts = (partnerId: string, params?: GetProductsParams) =>
	apiClient.get<ProductsListResponse>({
		url: ProductApi.Products,
		params: { partnerId, ...params },
	});

const getProductDetails = (id: string) =>
	apiClient.get<Product>({
		url: ProductApi.ProductDetails.replace(":id", id),
	});

const createProduct = (partnerId: string, data: CreateProductDto) =>
	apiClient.post<Product>({
		url: ProductApi.Products,
		data: { ...data, partnerId },
	});

const updateProduct = (id: string, data: UpdateProductDto) =>
	apiClient.put<Product>({
		url: ProductApi.ProductDetails.replace(":id", id),
		data,
	});

const deleteProduct = (id: string) =>
	apiClient.delete<void>({
		url: ProductApi.ProductDetails.replace(":id", id),
	});

const updateStock = (id: string, stock: number) =>
	apiClient.patch<Product>({
		url: ProductApi.UpdateStock.replace(":id", id),
		data: { stock },
	});

const toggleAvailability = (id: string) =>
	apiClient.patch<Product>({
		url: ProductApi.ToggleAvailability.replace(":id", id),
	});

const getProductOrders = (partnerId: string, params?: GetProductOrdersParams) =>
	apiClient.get<ProductOrdersListResponse>({
		url: ProductApi.ProductOrders,
		params: { partnerId, ...params },
	});

const getProductOrderDetails = (id: string) =>
	apiClient.get<ProductOrder>({
		url: ProductApi.ProductOrderDetails.replace(":id", id),
	});

const updateOrderStatus = (id: string, status: string) =>
	apiClient.patch<ProductOrder>({
		url: ProductApi.UpdateOrderStatus.replace(":id", id),
		data: { status },
	});

const cancelOrder = (id: string, reason?: string) =>
	apiClient.post<ProductOrder>({
		url: ProductApi.CancelOrder.replace(":id", id),
		data: { reason },
	});

export default {
	getProducts,
	getProductDetails,
	createProduct,
	updateProduct,
	deleteProduct,
	updateStock,
	toggleAvailability,
	getProductOrders,
	getProductOrderDetails,
	updateOrderStatus,
	cancelOrder,
};
