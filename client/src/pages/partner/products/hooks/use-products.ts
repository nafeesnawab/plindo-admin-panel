import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import productService from "@/api/services/productService";
import { usePartnerInfo } from "@/store/authStore";
import { ProductStatus } from "@/types/product";

interface UseProductsOptions {
	searchTerm: string;
	statusFilter: string;
	categoryFilter: string;
}

interface UseOrdersOptions {
	orderStatusFilter: string;
	enabled: boolean;
}

export function useProducts({
	searchTerm,
	statusFilter,
	categoryFilter,
}: UseProductsOptions) {
	const queryClient = useQueryClient();
	const partnerInfo = usePartnerInfo();
	const partnerId = partnerInfo.id ?? "";

	const { data: productsData, isLoading } = useQuery({
		queryKey: [
			"partner-products",
			partnerId,
			searchTerm,
			statusFilter,
			categoryFilter,
		],
		queryFn: () =>
			productService.getProducts(partnerId, {
				search: searchTerm || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				category: categoryFilter !== "all" ? categoryFilter : undefined,
			}),
		enabled: !!partnerId,
	});

	const products = productsData?.items || [];
	const lowStockCount = products.filter(
		(p) => p.stock > 0 && p.stock <= 5,
	).length;
	const outOfStockCount = products.filter(
		(p) => p.status === ProductStatus.OutOfStock,
	).length;

	const createMutation = useMutation({
		mutationFn: (data: {
			name: string;
			description?: string;
			category: string;
			price: number;
			stock: number;
			imageUrl: string;
			status: string;
		}) => productService.createProduct(partnerId, data as any),
		onSuccess: () => {
			toast.success("Product created successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
		},
		onError: () => {
			toast.error("Failed to create product");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			productService.updateProduct(id, data as any),
		onSuccess: () => {
			toast.success("Product updated successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
		},
		onError: () => {
			toast.error("Failed to update product");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => productService.deleteProduct(id),
		onSuccess: () => {
			toast.success("Product deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
		},
		onError: () => {
			toast.error("Failed to delete product");
		},
	});

	const updateStockMutation = useMutation({
		mutationFn: ({ id, stock }: { id: string; stock: number }) =>
			productService.updateStock(id, stock),
		onSuccess: () => {
			toast.success("Stock updated successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
		},
		onError: () => {
			toast.error("Failed to update stock");
		},
	});

	const toggleAvailabilityMutation = useMutation({
		mutationFn: (id: string) => productService.toggleAvailability(id),
		onSuccess: () => {
			toast.success("Availability updated");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update availability");
		},
	});

	return {
		products,
		isLoading,
		lowStockCount,
		outOfStockCount,
		createMutation,
		updateMutation,
		deleteMutation,
		updateStockMutation,
		toggleAvailabilityMutation,
	};
}

export function useOrders({ orderStatusFilter, enabled }: UseOrdersOptions) {
	const queryClient = useQueryClient();
	const partnerInfo = usePartnerInfo();
	const partnerId = partnerInfo.id ?? "";

	const { data: ordersData, isLoading } = useQuery({
		queryKey: ["partner-product-orders", partnerId, orderStatusFilter],
		queryFn: () =>
			productService.getProductOrders(partnerId, {
				status: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
			}),
		enabled: enabled && !!partnerId,
	});

	const updateOrderStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			productService.updateOrderStatus(id, status),
		onSuccess: () => {
			toast.success("Order status updated");
			queryClient.invalidateQueries({ queryKey: ["partner-product-orders"] });
		},
		onError: () => {
			toast.error("Failed to update order status");
		},
	});

	return {
		orders: ordersData?.items || [],
		isLoading,
		updateOrderStatusMutation,
	};
}
