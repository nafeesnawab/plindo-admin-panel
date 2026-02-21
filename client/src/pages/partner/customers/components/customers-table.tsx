import { ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import { useState } from "react";

import type { Customer } from "@/api/services/customerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

import { ITEMS_PER_PAGE_OPTIONS, STATUS_CONFIG, SUBSCRIPTION_BADGE } from "../types";

interface CustomersTableProps {
	customers: Customer[];
	totalCount: number;
	loading: boolean;
	onViewCustomer: (customer: Customer) => void;
}

export function CustomersTable({ customers, totalCount, loading, onViewCustomer }: CustomersTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(10);

	const totalPages = Math.ceil(customers.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

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

	if (customers.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
				<User className="h-10 w-10 mb-3 opacity-40" />
				<p className="text-sm font-medium">
					{totalCount === 0 ? "No customers yet" : "No customers found"}
				</p>
				<p className="text-xs mt-1">
					{totalCount === 0 ? "Customers will appear here" : "Try adjusting your search or filters"}
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
								Customer
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Location
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Bookings
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Total Spent
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Subscription
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
						{paginatedCustomers.map((customer) => {
							const statusConfig = STATUS_CONFIG[customer.status];
							return (
								<TableRow
									key={customer.id}
									className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
									onClick={() => onViewCustomer(customer)}
								>
									<TableCell className="py-3 pl-4">
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9">
												<AvatarImage src={customer.avatar} alt={customer.name} />
												<AvatarFallback>
													{customer.name
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<p className="font-medium text-sm truncate max-w-[200px]">{customer.name}</p>
												<p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
													{customer.email}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell className="py-3">
										<div className="flex items-center gap-1 text-sm text-muted-foreground">
											<MapPin className="h-3 w-3" />
											{customer.location}
										</div>
									</TableCell>
									<TableCell className="py-3 font-semibold text-sm tabular-nums">
										{customer.totalBookings}
									</TableCell>
									<TableCell className="py-3 font-semibold text-sm tabular-nums">
										&euro;{(customer.totalSpent ?? 0).toFixed(2)}
									</TableCell>
									<TableCell className="py-3">
										{customer.subscription.active ? (
											<Badge
												variant="outline"
												className={cn(SUBSCRIPTION_BADGE.color, SUBSCRIPTION_BADGE.darkColor)}
											>
												{customer.subscription.plan}
											</Badge>
										) : (
											<span className="text-sm text-muted-foreground">None</span>
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
													customer.status === "active"
														? "bg-emerald-500 dark:bg-emerald-400"
														: "bg-red-500 dark:bg-red-400",
												)}
											/>
											{statusConfig.label}
										</span>
									</TableCell>
									<TableCell className="py-3 text-right pr-4">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onViewCustomer(customer);
											}}
										>
											View
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{customers.length > 0 && (
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
							{startIndex + 1}&ndash;{Math.min(startIndex + itemsPerPage, customers.length)} of {customers.length}
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
