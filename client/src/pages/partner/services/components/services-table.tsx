import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Edit,
	ImageIcon,
	MoreHorizontal,
	PoundSterling,
	Power,
	Trash2,
} from "lucide-react";
import { useState } from "react";

import { SERVICE_CATEGORY_LABELS } from "@/types/booking";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { cn } from "@/utils";

import type { Service } from "../types";
import { formatDuration, getBasePrice, ITEMS_PER_PAGE_OPTIONS, SERVICE_TYPE_CONFIG } from "../types";

interface ServicesTableProps {
	services: Service[];
	totalCount: number;
	loading: boolean;
	onEdit: (service: Service) => void;
	onManagePricing: (service: Service) => void;
	onDuplicate: (service: Service) => void;
	onToggleStatus: (serviceId: string) => void;
	onDelete: (service: Service) => void;
}

export function ServicesTable({
	services,
	totalCount,
	loading,
	onEdit,
	onManagePricing,
	onDuplicate,
	onToggleStatus,
	onDelete,
}: ServicesTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(10);

	const totalPages = Math.ceil(services.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedServices = services.slice(startIndex, startIndex + itemsPerPage);

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

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<div className="overflow-auto flex-1 rounded-xl border border-border">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
						<TableRow className="hover:bg-transparent border-b border-border">
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-4">
								Service
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Type
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Category
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Price
							</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Duration
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
						{paginatedServices.map((service) => {
							const typeConfig = SERVICE_TYPE_CONFIG[service.serviceType];
							return (
								<TableRow key={service.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
									<TableCell className="py-3 pl-4">
										<div className="flex items-center gap-3">
											<div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
												{service.bannerUrl ? (
													<img src={service.bannerUrl} alt={service.name} className="h-full w-full object-cover" />
												) : (
													<ImageIcon className="h-4 w-4 text-muted-foreground/50" />
												)}
											</div>
											<div className="min-w-0">
												<p className="font-medium text-sm truncate max-w-[200px]">{service.name}</p>
												{service.description && (
													<p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
														{service.description}
													</p>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="py-3">
										<span
											className={cn(
												"inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border",
												typeConfig.color,
												typeConfig.darkColor,
											)}
										>
											{typeConfig.icon}
											{typeConfig.label}
										</span>
									</TableCell>
									<TableCell className="py-3">
										{service.serviceCategory && (
											<span className="text-sm text-foreground">
												{SERVICE_CATEGORY_LABELS[service.serviceCategory]}
											</span>
										)}
									</TableCell>
									<TableCell className="py-3 font-semibold text-sm tabular-nums">{getBasePrice(service)}</TableCell>
									<TableCell className="py-3">
										<span className="text-sm text-muted-foreground tabular-nums">
											{formatDuration(service.duration)}
										</span>
									</TableCell>
									<TableCell className="py-3">
										<span
											className={cn(
												"inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
												service.status === "active"
													? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
													: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
											)}
										>
											<span
												className={cn(
													"h-1.5 w-1.5 rounded-full",
													service.status === "active"
														? "bg-emerald-500 dark:bg-emerald-400"
														: "bg-gray-400 dark:bg-gray-500",
												)}
											/>
											{service.status === "active" ? "Active" : "Inactive"}
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
												<DropdownMenuItem onClick={() => onEdit(service)}>
													<Edit className="mr-2 h-4 w-4" />
													Edit Details
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => onManagePricing(service)}>
													<PoundSterling className="mr-2 h-4 w-4" />
													Manage Pricing
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem onClick={() => onDuplicate(service)}>
													<Copy className="mr-2 h-4 w-4" />
													Duplicate
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => onToggleStatus(service.id)}>
													<Power className="mr-2 h-4 w-4" />
													{service.status === "active" ? "Deactivate" : "Activate"}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => onDelete(service)}
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
						{services.length === 0 && (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
									{totalCount === 0 ? "No services added yet" : "No services match your filters"}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{services.length > 0 && (
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
							{startIndex + 1}–{Math.min(startIndex + itemsPerPage, services.length)} of {services.length}
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
