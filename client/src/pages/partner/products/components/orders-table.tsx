import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

import type { ProductOrder } from "@/types/product";
import { ProductOrderStatus } from "@/types/product";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

import { ITEMS_PER_PAGE_OPTIONS, ORDER_STATUS_CONFIG } from "../types";

interface OrdersTableProps {
	orders: ProductOrder[];
	loading: boolean;
	onUpdateStatus: (orderId: string, status: string) => void;
}

export function OrdersTable({ orders, loading, onUpdateStatus }: OrdersTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(10);

	const totalPages = Math.ceil(orders.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

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

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
				<ShoppingCart className="h-10 w-10 mb-3 opacity-40" />
				<p className="text-sm font-medium">No orders yet</p>
				<p className="text-xs mt-1">Product orders will appear here</p>
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
								Order
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Linked Booking
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Customer
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Products
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Total
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Date
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Status
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[120px] text-right pr-4">
								Action
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedOrders.map((order) => {
							const statusConfig = ORDER_STATUS_CONFIG[order.status];
							return (
								<TableRow key={order.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
									<TableCell className="py-3 pl-4">
										<span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
									</TableCell>
									<TableCell className="py-3">
										<div className="min-w-0">
											<p className="font-mono text-xs text-muted-foreground">{order.bookingRef}</p>
											<p className="text-sm font-medium truncate max-w-[160px]">{order.serviceName}</p>
										</div>
									</TableCell>
									<TableCell className="py-3">
										<div className="min-w-0">
											<p className="text-sm font-medium">{order.customerName}</p>
											{order.customerPhone && (
												<p className="text-xs text-muted-foreground">{order.customerPhone}</p>
											)}
										</div>
									</TableCell>
									<TableCell className="py-3">
										<div className="space-y-0.5">
											{order.products.map((item) => (
												<p key={`${order.id}-${item.productId}`} className="text-xs text-foreground">
													{item.name} &times; {item.quantity}
												</p>
											))}
										</div>
									</TableCell>
									<TableCell className="py-3 font-semibold text-sm tabular-nums">
										&euro;{order.totalAmount.toFixed(2)}
									</TableCell>
									<TableCell className="py-3">
										<span className="text-xs text-muted-foreground tabular-nums">
											{format(new Date(order.orderDate), "MMM dd, yyyy")}
										</span>
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
													order.status === ProductOrderStatus.Collected
														? "bg-emerald-500 dark:bg-emerald-400"
														: order.status === ProductOrderStatus.Pending
															? "bg-yellow-500 dark:bg-yellow-400"
															: order.status === ProductOrderStatus.Ready
																? "bg-blue-500 dark:bg-blue-400"
																: "bg-red-500 dark:bg-red-400",
												)}
											/>
											{statusConfig.label}
										</span>
									</TableCell>
									<TableCell className="py-3 text-right pr-4">
										<div className="flex justify-end gap-1.5">
											{order.status === ProductOrderStatus.Pending && (
												<Button
													size="sm"
													className="h-7 text-xs px-2.5"
													onClick={() => onUpdateStatus(order.id, ProductOrderStatus.Ready)}
												>
													Mark Ready
												</Button>
											)}
											{order.status === ProductOrderStatus.Ready && (
												<Button
													size="sm"
													className="h-7 text-xs px-2.5"
													onClick={() => onUpdateStatus(order.id, ProductOrderStatus.Collected)}
												>
													Mark Collected
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{orders.length > 0 && (
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
							{startIndex + 1}&ndash;{Math.min(startIndex + itemsPerPage, orders.length)} of {orders.length}
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
