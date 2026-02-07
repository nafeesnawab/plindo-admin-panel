import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertTriangle,
	Edit,
	Image as ImageIcon,
	Package,
	Plus,
	Search,
	ShoppingCart,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import productService from "@/api/services/productService";
import { type Product, ProductCategory, ProductOrderStatus, ProductStatus } from "@/types/product";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";

const PARTNER_ID = "demo-partner-1";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
	[ProductCategory.OilFluids]: "Oil & Fluids",
	[ProductCategory.TiresWheels]: "Tires & Wheels",
	[ProductCategory.Cleaning]: "Cleaning Products",
	[ProductCategory.Accessories]: "Accessories",
	[ProductCategory.Parts]: "Car Parts",
	[ProductCategory.Other]: "Other",
};

const STATUS_CONFIG = {
	[ProductStatus.Available]: { label: "Available", color: "bg-green-100 text-green-800" },
	[ProductStatus.Unavailable]: { label: "Unavailable", color: "bg-gray-100 text-gray-800" },
	[ProductStatus.OutOfStock]: { label: "Out of Stock", color: "bg-red-100 text-red-800" },
};

const ORDER_STATUS_CONFIG = {
	[ProductOrderStatus.Pending]: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
	[ProductOrderStatus.Ready]: { label: "Ready", color: "bg-blue-100 text-blue-800" },
	[ProductOrderStatus.Collected]: { label: "Collected", color: "bg-green-100 text-green-800" },
	[ProductOrderStatus.Cancelled]: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

interface ProductFormData {
	name: string;
	description: string;
	category: ProductCategory;
	price: string;
	stock: string;
	imageUrl: string;
	status: ProductStatus;
}

export default function PartnerProductsPage() {
	const [activeTab, setActiveTab] = useState("products");
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [orderStatusFilter, setOrderStatusFilter] = useState("all");
	const [showProductForm, setShowProductForm] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
	const [editingStock, setEditingStock] = useState<string | null>(null);
	const [stockValue, setStockValue] = useState("");

	const [formData, setFormData] = useState<ProductFormData>({
		name: "",
		description: "",
		category: ProductCategory.Other,
		price: "",
		stock: "",
		imageUrl: "",
		status: ProductStatus.Available,
	});
	const productImageRef = useRef<HTMLInputElement>(null);

	const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setFormData((prev) => ({ ...prev, imageUrl: url }));
			e.target.value = "";
		}
	};

	const queryClient = useQueryClient();

	const { data: productsData, isLoading: productsLoading } = useQuery({
		queryKey: ["partner-products", PARTNER_ID, searchTerm, statusFilter, categoryFilter],
		queryFn: () =>
			productService.getProducts(PARTNER_ID, {
				search: searchTerm || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				category: categoryFilter !== "all" ? categoryFilter : undefined,
			}),
	});

	const { data: ordersData, isLoading: ordersLoading } = useQuery({
		queryKey: ["partner-product-orders", PARTNER_ID, orderStatusFilter],
		queryFn: () =>
			productService.getProductOrders(PARTNER_ID, {
				status: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
			}),
		enabled: activeTab === "orders",
	});

	const createMutation = useMutation({
		mutationFn: (data: ProductFormData) =>
			productService.createProduct(PARTNER_ID, {
				name: data.name,
				description: data.description || undefined,
				category: data.category,
				price: Number.parseFloat(data.price),
				stock: Number.parseInt(data.stock),
				imageUrl: data.imageUrl,
				status: Number.parseInt(data.stock) === 0 ? ProductStatus.OutOfStock : data.status,
			}),
		onSuccess: () => {
			toast.success("Product created successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
			closeProductForm();
		},
		onError: () => {
			toast.error("Failed to create product");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
			productService.updateProduct(id, {
				name: data.name,
				description: data.description || undefined,
				category: data.category,
				price: Number.parseFloat(data.price),
				stock: Number.parseInt(data.stock),
				imageUrl: data.imageUrl,
				status: Number.parseInt(data.stock) === 0 ? ProductStatus.OutOfStock : data.status,
			}),
		onSuccess: () => {
			toast.success("Product updated successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
			closeProductForm();
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
			setShowDeleteDialog(false);
			setDeletingProduct(null);
		},
		onError: () => {
			toast.error("Failed to delete product");
		},
	});

	const updateStockMutation = useMutation({
		mutationFn: ({ id, stock }: { id: string; stock: number }) => productService.updateStock(id, stock),
		onSuccess: () => {
			toast.success("Stock updated successfully");
			queryClient.invalidateQueries({ queryKey: ["partner-products"] });
			setEditingStock(null);
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
		onError: (error: any) => {
			toast.error(error.message || "Failed to update availability");
		},
	});

	const updateOrderStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) => productService.updateOrderStatus(id, status),
		onSuccess: () => {
			toast.success("Order status updated");
			queryClient.invalidateQueries({ queryKey: ["partner-product-orders"] });
		},
		onError: () => {
			toast.error("Failed to update order status");
		},
	});

	const openProductForm = (product?: Product) => {
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
			setFormData({
				name: "",
				description: "",
				category: ProductCategory.Other,
				price: "",
				stock: "",
				imageUrl: "",
				status: ProductStatus.Available,
			});
		}
		setShowProductForm(true);
	};

	const closeProductForm = () => {
		setShowProductForm(false);
		setEditingProduct(null);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name || !formData.price || !formData.stock) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (!editingProduct && !formData.imageUrl) {
			toast.error("Product image is required");
			return;
		}

		if (Number.parseFloat(formData.price) <= 0) {
			toast.error("Price must be greater than 0");
			return;
		}

		if (Number.parseInt(formData.stock) < 0) {
			toast.error("Stock cannot be negative");
			return;
		}

		if (editingProduct) {
			updateMutation.mutate({ id: editingProduct.id, data: formData });
		} else {
			createMutation.mutate(formData);
		}
	};

	const handleStockUpdate = (productId: string) => {
		const stock = Number.parseInt(stockValue);
		if (Number.isNaN(stock) || stock < 0) {
			toast.error("Invalid stock value");
			return;
		}
		updateStockMutation.mutate({ id: productId, stock });
	};

	const products = productsData?.items || [];
	const orders = ordersData?.items || [];

	const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
	const outOfStockCount = products.filter((p) => p.status === ProductStatus.OutOfStock).length;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Products for Sale</h1>
					<p className="text-muted-foreground">Manage your shop products and orders</p>
				</div>
				<Button onClick={() => openProductForm()}>
					<Plus className="h-4 w-4 mr-2" />
					Add Product
				</Button>
			</div>

			{(lowStockCount > 0 || outOfStockCount > 0) && (
				<div className="flex gap-3">
					{lowStockCount > 0 && (
						<Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
							<AlertTriangle className="h-3 w-3 mr-1" />
							{lowStockCount} product{lowStockCount > 1 ? "s" : ""} low on stock
						</Badge>
					)}
					{outOfStockCount > 0 && (
						<Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
							<Package className="h-3 w-3 mr-1" />
							{outOfStockCount} product{outOfStockCount > 1 ? "s" : ""} out of stock
						</Badge>
					)}
				</div>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="products">
						<Package className="h-4 w-4 mr-2" />
						Products
					</TabsTrigger>
					<TabsTrigger value="orders">
						<ShoppingCart className="h-4 w-4 mr-2" />
						Product Orders
					</TabsTrigger>
				</TabsList>

				<TabsContent value="products" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Search by product name..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-9"
										/>
									</div>
								</div>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value={ProductStatus.Available}>Available</SelectItem>
										<SelectItem value={ProductStatus.Unavailable}>Unavailable</SelectItem>
										<SelectItem value={ProductStatus.OutOfStock}>Out of Stock</SelectItem>
									</SelectContent>
								</Select>
								<Select value={categoryFilter} onValueChange={setCategoryFilter}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Filter by category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Categories</SelectItem>
										{Object.entries(CATEGORY_LABELS).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							{productsLoading ? (
								<div className="space-y-3">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
									))}
								</div>
							) : products.length === 0 ? (
								<div className="text-center py-12">
									<Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-2">No products added yet</h3>
									<p className="text-muted-foreground mb-4">Start selling products at your shop</p>
									<Button onClick={() => openProductForm()}>
										<Plus className="h-4 w-4 mr-2" />
										Add Your First Product
									</Button>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Image</TableHead>
											<TableHead>Product Name</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Stock</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{products.map((product) => (
											<TableRow key={product.id}>
												<TableCell>
													<div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
														{product.imageUrl.startsWith("/placeholder") ? (
															<ImageIcon className="h-6 w-6 text-muted-foreground" />
														) : (
															<img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
														)}
													</div>
												</TableCell>
												<TableCell className="font-medium">{product.name}</TableCell>
												<TableCell>{CATEGORY_LABELS[product.category]}</TableCell>
												<TableCell>€{product.price.toFixed(2)}</TableCell>
												<TableCell>
													{editingStock === product.id ? (
														<div className="flex items-center gap-2">
															<Input
																type="number"
																value={stockValue}
																onChange={(e) => setStockValue(e.target.value)}
																onKeyDown={(e) => {
																	if (e.key === "Enter") {
																		handleStockUpdate(product.id);
																	} else if (e.key === "Escape") {
																		setEditingStock(null);
																	}
																}}
																className="w-20"
																autoFocus
															/>
															<Button size="sm" variant="ghost" onClick={() => setEditingStock(null)}>
																<X className="h-4 w-4" />
															</Button>
														</div>
													) : (
														<button
															type="button"
															onClick={() => {
																setEditingStock(product.id);
																setStockValue(product.stock.toString());
															}}
															className="hover:underline"
														>
															{product.stock}
														</button>
													)}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Badge className={STATUS_CONFIG[product.status].color}>
															{STATUS_CONFIG[product.status].label}
														</Badge>
														{product.status !== ProductStatus.OutOfStock && (
															<Switch
																checked={product.status === ProductStatus.Available}
																onCheckedChange={() => toggleAvailabilityMutation.mutate(product.id)}
																disabled={toggleAvailabilityMutation.isPending}
															/>
														)}
													</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button size="sm" variant="ghost" onClick={() => openProductForm(product)}>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => {
																setDeletingProduct(product);
																setShowDeleteDialog(true);
															}}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="orders" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Product Orders</CardTitle>
								<Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value={ProductOrderStatus.Pending}>Pending</SelectItem>
										<SelectItem value={ProductOrderStatus.Ready}>Ready</SelectItem>
										<SelectItem value={ProductOrderStatus.Collected}>Collected</SelectItem>
										<SelectItem value={ProductOrderStatus.Cancelled}>Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							{ordersLoading ? (
								<div className="space-y-3">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={`order-skeleton-${i}`} className="h-16 w-full" />
									))}
								</div>
							) : orders.length === 0 ? (
								<div className="text-center py-12">
									<ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-2">No orders yet</h3>
									<p className="text-muted-foreground">Product orders will appear here</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Order ID</TableHead>
											<TableHead>Linked Booking</TableHead>
											<TableHead>Customer</TableHead>
											<TableHead>Products</TableHead>
											<TableHead>Total</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{orders.map((order) => (
											<TableRow key={order.id}>
												<TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
												<TableCell>
													<div>
														<p className="font-mono text-xs text-muted-foreground">{order.bookingRef}</p>
														<p className="text-sm font-medium">{order.serviceName}</p>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<p className="font-medium">{order.customerName}</p>
														{order.customerPhone && (
															<p className="text-sm text-muted-foreground">{order.customerPhone}</p>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="space-y-1">
														{order.products.map((item) => (
															<div key={`${order.id}-${item.productId}`} className="text-sm">
																{item.name} × {item.quantity}
															</div>
														))}
													</div>
												</TableCell>
												<TableCell className="font-semibold">€{order.totalAmount.toFixed(2)}</TableCell>
												<TableCell className="text-sm">{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
												<TableCell>
													<Badge className={ORDER_STATUS_CONFIG[order.status].color}>
														{ORDER_STATUS_CONFIG[order.status].label}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														{order.status === ProductOrderStatus.Pending && (
															<Button
																size="sm"
																onClick={() =>
																	updateOrderStatusMutation.mutate({
																		id: order.id,
																		status: ProductOrderStatus.Ready,
																	})
																}
															>
																Mark Ready
															</Button>
														)}
														{order.status === ProductOrderStatus.Ready && (
															<Button
																size="sm"
																onClick={() =>
																	updateOrderStatusMutation.mutate({
																		id: order.id,
																		status: ProductOrderStatus.Collected,
																	})
																}
															>
																Mark Collected
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={showProductForm} onOpenChange={setShowProductForm}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
						<DialogDescription>
							{editingProduct ? "Update product information" : "Add a new product to your shop"}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="image">
								Product Image <span className="text-red-500">*</span>
							</Label>
							<div className="flex items-center gap-4">
								<div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center overflow-hidden">
									{formData.imageUrl && !formData.imageUrl.startsWith("/placeholder") ? (
										<img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
									) : (
										<Upload className="h-8 w-8 text-muted-foreground" />
									)}
								</div>
								<div className="flex-1">
									<input
										ref={productImageRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleProductImageChange}
									/>
									<Button
										type="button"
										variant="outline"
										className="w-full"
										onClick={() => productImageRef.current?.click()}
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
								Product Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								placeholder="Enter product name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								maxLength={500}
								rows={3}
							/>
							<p className="text-xs text-muted-foreground text-right">{formData.description.length}/500 characters</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="category">
									Category <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.category}
									onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
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
									Price (€) <span className="text-red-500">*</span>
								</Label>
								<Input
									id="price"
									type="number"
									step="0.01"
									min="0.01"
									placeholder="0.00"
									value={formData.price}
									onChange={(e) => setFormData({ ...formData, price: e.target.value })}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="stock">
								Stock Quantity <span className="text-red-500">*</span>
							</Label>
							<Input
								id="stock"
								type="number"
								min="0"
								placeholder="0"
								value={formData.stock}
								onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
								required
							/>
							{formData.stock === "0" && (
								<p className="text-sm text-yellow-600">⚠️ Product will be marked as Out of Stock</p>
							)}
						</div>

						{formData.stock !== "0" && (
							<div className="flex items-center justify-between">
								<Label htmlFor="status">Available for Sale</Label>
								<Switch
									id="status"
									checked={formData.status === ProductStatus.Available}
									onCheckedChange={(checked) =>
										setFormData({
											...formData,
											status: checked ? ProductStatus.Available : ProductStatus.Unavailable,
										})
									}
								/>
							</div>
						)}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={closeProductForm}>
								Cancel
							</Button>
							<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
								{editingProduct ? "Update Product" : "Add Product"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Product</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <strong>{deletingProduct?.name}</strong>? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
