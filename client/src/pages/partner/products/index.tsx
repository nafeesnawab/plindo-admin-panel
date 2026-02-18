import { AlertTriangle, Package, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Product } from "@/types/product";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

import { DeleteDialog } from "./components/delete-dialog";
import { OrdersTable } from "./components/orders-table";
import { ProductFormDialog } from "./components/product-form-dialog";
import { ProductsTable } from "./components/products-table";
import { ProductsToolbar } from "./components/products-toolbar";
import { useProductForm } from "./hooks/use-product-form";
import { useOrders, useProducts } from "./hooks/use-products";

export default function PartnerProductsPage() {
	const [activeTab, setActiveTab] = useState("products");
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [orderStatusFilter, setOrderStatusFilter] = useState("all");
	const [showFilters, setShowFilters] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<Product | null>(null);
	const [editingStock, setEditingStock] = useState<string | null>(null);
	const [stockValue, setStockValue] = useState("");

	const form = useProductForm();

	const {
		products,
		isLoading: productsLoading,
		lowStockCount,
		outOfStockCount,
		createMutation,
		updateMutation,
		deleteMutation,
		updateStockMutation,
		toggleAvailabilityMutation,
	} = useProducts({ searchTerm, statusFilter, categoryFilter });

	const {
		orders,
		isLoading: ordersLoading,
		updateOrderStatusMutation,
	} = useOrders({ orderStatusFilter, enabled: activeTab === "orders" });

	const activeFiltersCount = [statusFilter !== "all", categoryFilter !== "all"].filter(Boolean).length;

	const handleFormSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.validate()) return;
		const payload = form.getPayload();

		if (form.editingProduct) {
			updateMutation.mutate(
				{ id: form.editingProduct.id, data: payload as Record<string, unknown> },
				{
					onSuccess: () => form.closeForm(),
				},
			);
		} else {
			createMutation.mutate(payload as any, {
				onSuccess: () => form.closeForm(),
			});
		}
	};

	const handleDeleteClick = (product: Product) => {
		setProductToDelete(product);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (!productToDelete) return;
		deleteMutation.mutate(productToDelete.id, {
			onSuccess: () => {
				setDeleteDialogOpen(false);
				setProductToDelete(null);
			},
		});
	};

	const handleStockUpdate = (productId: string) => {
		const stock = Number.parseInt(stockValue);
		if (Number.isNaN(stock) || stock < 0) {
			toast.error("Invalid stock value");
			return;
		}
		updateStockMutation.mutate(
			{ id: productId, stock },
			{
				onSuccess: () => setEditingStock(null),
			},
		);
	};

	const clearFilters = () => {
		setStatusFilter("all");
		setCategoryFilter("all");
		setSearchTerm("");
	};

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center gap-2 flex-wrap">
				<ProductsToolbar
					searchQuery={searchTerm}
					onSearchChange={setSearchTerm}
					filterStatus={statusFilter}
					onStatusChange={setStatusFilter}
					filterCategory={categoryFilter}
					onCategoryChange={setCategoryFilter}
					showFilters={showFilters}
					onToggleFilters={() => setShowFilters(!showFilters)}
					activeFiltersCount={activeFiltersCount}
					onClearFilters={clearFilters}
				/>
				<Button onClick={() => form.openForm()} size="sm" className="gap-1.5 h-9 shrink-0">
					<Plus className="h-3.5 w-3.5" />
					Add Product
				</Button>
			</div>

			{(lowStockCount > 0 || outOfStockCount > 0) && (
				<div className="flex gap-2 flex-wrap">
					{lowStockCount > 0 && (
						<Badge
							variant="outline"
							className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800"
						>
							<AlertTriangle className="h-3 w-3 mr-1" />
							{lowStockCount} product{lowStockCount > 1 ? "s" : ""} low on stock
						</Badge>
					)}
					{outOfStockCount > 0 && (
						<Badge
							variant="outline"
							className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
						>
							<Package className="h-3 w-3 mr-1" />
							{outOfStockCount} product{outOfStockCount > 1 ? "s" : ""} out of stock
						</Badge>
					)}
				</div>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
				<TabsList className="w-fit">
					<TabsTrigger value="products" className="gap-1.5">
						<Package className="h-3.5 w-3.5" />
						Products
					</TabsTrigger>
					<TabsTrigger value="orders" className="gap-1.5">
						<ShoppingCart className="h-3.5 w-3.5" />
						Orders
					</TabsTrigger>
				</TabsList>

				<TabsContent value="products" className="flex-1 min-h-0 mt-4">
					<ProductsTable
						products={products}
						totalCount={products.length}
						loading={productsLoading}
						onEdit={(product) => form.openForm(product)}
						onToggleAvailability={(id) => toggleAvailabilityMutation.mutate(id)}
						onDelete={handleDeleteClick}
						editingStock={editingStock}
						stockValue={stockValue}
						onStartEditStock={(id, stock) => {
							setEditingStock(id);
							setStockValue(stock.toString());
						}}
						onStockValueChange={setStockValue}
						onStockUpdate={handleStockUpdate}
						onCancelStockEdit={() => setEditingStock(null)}
					/>
				</TabsContent>

				<TabsContent value="orders" className="flex-1 min-h-0 mt-4">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-base">Product Orders</h3>
						<Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
							<SelectTrigger className="h-9 w-[150px] text-xs">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="ready">Ready</SelectItem>
								<SelectItem value="collected">Collected</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<OrdersTable
						orders={orders}
						loading={ordersLoading}
						onUpdateStatus={(id, status) => updateOrderStatusMutation.mutate({ id, status })}
					/>
				</TabsContent>
			</Tabs>

			<ProductFormDialog
				open={form.showForm}
				onOpenChange={form.setShowForm}
				formData={form.formData}
				setFormData={form.setFormData}
				isEditing={form.isEditing}
				imageInputRef={form.imageInputRef}
				onImageChange={form.handleImageChange}
				onSave={handleFormSave}
				isPending={createMutation.isPending || updateMutation.isPending}
			/>

			<DeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				productName={productToDelete?.name ?? ""}
				onConfirm={handleDeleteConfirm}
				isPending={deleteMutation.isPending}
			/>
		</div>
	);
}
