import {
	ChevronLeft,
	ChevronRight,
	Edit,
	ImageIcon,
	MoreHorizontal,
	Package,
	Power,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";

import type { Product } from "@/types/product";
import { ProductStatus } from "@/types/product";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

import { CATEGORY_LABELS, ITEMS_PER_PAGE_OPTIONS, STATUS_CONFIG } from "../types";

interface ProductsTableProps {
	products: Product[];
	totalCount: number;
	loading: boolean;
	onEdit: (product: Product) => void;
	onToggleAvailability: (productId: string) => void;
	onDelete: (product: Product) => void;
	editingStock: string | null;
	stockValue: string;
	onStartEditStock: (productId: string, currentStock: number) => void;
	onStockValueChange: (value: string) => void;
	onStockUpdate: (productId: string) => void;
	onCancelStockEdit: () => void;
}

export function ProductsTable({
	products,
	totalCount,
	loading,
	onEdit,
	onToggleAvailability,
	onDelete,
	editingStock,
	stockValue,
	onStartEditStock,
	onStockValueChange,
	onStockUpdate,
	onCancelStockEdit,
}: ProductsTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(10);

	const totalPages = Math.ceil(products.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

	const handlePageChange = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const handleItemsPerPageChange = (value: string) => {
		setItemsPerPage(Number(value));
		setCurrentPage(1);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (products.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
				<Package className="h-10 w-10 mb-3 opacity-40" />
				<p className="text-sm font-medium">
					{totalCount === 0 ? "No products added yet" : "No products match your filters"}
				</p>
				<p className="text-xs mt-1">
					{totalCount === 0 ? "Add your first product to get started" : "Try adjusting your search or filters"}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<div className="overflow-auto flex-1 rounded-xl border border-border">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
						<TableRow className="hover:bg-transparent border-b border-border">
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-4">
								Product
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Category
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Price
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Stock
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Status
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[60px] text-right pr-4">
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedProducts.map((product) => {
							const statusConfig = STATUS_CONFIG[product.status];
							return (
								<TableRow key={product.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
									<TableCell className="py-3 pl-4">
										<div className="flex items-center gap-3">
											<div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
												{product.imageUrl && !product.imageUrl.startsWith("/placeholder") ? (
													<img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
												) : (
													<ImageIcon className="h-4 w-4 text-muted-foreground/50" />
												)}
											</div>
											<div className="min-w-0">
												<p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
												{product.description && (
													<p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
														{product.description}
													</p>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="py-3">
										<span className="text-sm text-foreground">{CATEGORY_LABELS[product.category]}</span>
									</TableCell>
									<TableCell className="py-3 font-semibold text-sm tabular-nums">
										&euro;{product.price.toFixed(2)}
									</TableCell>
									<TableCell className="py-3">
										{editingStock === product.id ? (
											<div className="flex items-center gap-1.5">
												<Input
													type="number"
													value={stockValue}
													onChange={(e) => onStockValueChange(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") onStockUpdate(product.id);
														else if (e.key === "Escape") onCancelStockEdit();
													}}
													className="w-20 h-8 text-xs"
													autoFocus
												/>
												<Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelStockEdit}>
													<X className="h-3.5 w-3.5" />
												</Button>
											</div>
										) : (
											<button
												type="button"
												onClick={() => onStartEditStock(product.id, product.stock)}
												className="text-sm tabular-nums text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
											>
												{product.stock}
											</button>
										)}
									</TableCell>
									<TableCell className="py-3">
										<span
											className={cn(
												"inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
												statusConfig.color,
												statusConfig.darkColor,
											)}
										>
											<span
												className={cn(
													"h-1.5 w-1.5 rounded-full",
													product.status === ProductStatus.Available
														? "bg-emerald-500 dark:bg-emerald-400"
														: product.status === ProductStatus.OutOfStock
															? "bg-red-500 dark:bg-red-400"
															: "bg-gray-400 dark:bg-gray-500",
												)}
											/>
											{statusConfig.label}
										</span>
									</TableCell>
									<TableCell className="py-3 text-right pr-4">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-44">
												<DropdownMenuItem onClick={() => onEdit(product)}>
													<Edit className="mr-2 h-4 w-4" />
													Edit Details
												</DropdownMenuItem>
												{product.status !== ProductStatus.OutOfStock && (
													<DropdownMenuItem onClick={() => onToggleAvailability(product.id)}>
														<Power className="mr-2 h-4 w-4" />
														{product.status === ProductStatus.Available ? "Mark Unavailable" : "Mark Available"}
													</DropdownMenuItem>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => onDelete(product)}
													className="text-destructive focus:text-destructive"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{products.length > 0 && (
				<div className="flex items-center justify-between pt-4 px-1">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span className="text-xs">Rows per page</span>
						<Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
							<SelectTrigger className="h-8 w-[70px] text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ITEMS_PER_PAGE_OPTIONS.map((opt) => (
									<SelectItem key={opt} value={String(opt)}>
										{opt}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center gap-4">
						<span className="text-xs text-muted-foreground tabular-nums">
							{startIndex + 1}&ndash;{Math.min(startIndex + itemsPerPage, products.length)} of {products.length}
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8 rounded-lg"
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((page) => {
									if (totalPages <= 5) return true;
									if (page === 1 || page === totalPages) return true;
									return Math.abs(page - currentPage) <= 1;
								})
								.map((page, idx, arr) => {
									const prevPage = arr[idx - 1];
									const showEllipsis = prevPage !== undefined && page - prevPage > 1;
									return (
										<span key={page} className="flex items-center">
											{showEllipsis && <span className="px-1 text-xs text-muted-foreground">...</span>}
											<Button
												variant={page === currentPage ? "default" : "outline"}
												size="icon"
												className="h-8 w-8 rounded-lg text-xs"
												onClick={() => handlePageChange(page)}
											>
												{page}
											</Button>
										</span>
									);
								})}
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8 rounded-lg"
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
