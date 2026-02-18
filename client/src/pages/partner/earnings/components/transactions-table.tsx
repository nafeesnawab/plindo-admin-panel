import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import type { Transaction } from "../types";
import { ITEMS_PER_PAGE_OPTIONS, SERVICE_OPTIONS } from "../types";

interface TransactionsTableProps {
	transactions: Transaction[];
	serviceFilter: string;
	onServiceFilterChange: (value: string) => void;
	dateFilter: string;
	onDateFilterChange: (value: string) => void;
	onExportCSV: () => void;
	onExportPDF: () => void;
}

export function TransactionsTable({
	transactions,
	serviceFilter,
	onServiceFilterChange,
	dateFilter,
	onDateFilterChange,
	onExportCSV,
	onExportPDF,
}: TransactionsTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(10);

	const totalPages = Math.ceil(transactions.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

	const handlePageChange = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const handleItemsPerPageChange = (value: string) => {
		setItemsPerPage(Number(value));
		setCurrentPage(1);
	};

	return (
		<div className="flex flex-col flex-1 min-h-0 gap-4">
			<div className="flex items-center justify-between flex-wrap gap-2">
				<div className="flex gap-2 flex-wrap">
					<Select value={dateFilter} onValueChange={onDateFilterChange}>
						<SelectTrigger className="h-9 w-[150px] text-xs">
							<SelectValue placeholder="Date range" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Time</SelectItem>
							<SelectItem value="today">Today</SelectItem>
							<SelectItem value="week">This Week</SelectItem>
							<SelectItem value="month">This Month</SelectItem>
							<SelectItem value="year">This Year</SelectItem>
						</SelectContent>
					</Select>
					<Select value={serviceFilter} onValueChange={onServiceFilterChange}>
						<SelectTrigger className="h-9 w-[150px] text-xs">
							<SelectValue placeholder="Service type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Services</SelectItem>
							{SERVICE_OPTIONS.map((s) => (
								<SelectItem key={s} value={s}>{s}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={onExportCSV} className="h-9 gap-1.5 text-xs">
						<Download className="h-3.5 w-3.5" />
						CSV
					</Button>
					<Button variant="outline" size="sm" onClick={onExportPDF} className="h-9 gap-1.5 text-xs">
						<FileText className="h-3.5 w-3.5" />
						PDF
					</Button>
				</div>
			</div>

			<div className="overflow-auto flex-1 rounded-xl border border-border">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
						<TableRow className="hover:bg-transparent border-b border-border">
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-4">Date</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Booking</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Service</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Gross</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Commission</TableHead>
							<TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pr-4">Net</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedTransactions.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-16">
									<div className="flex flex-col items-center text-muted-foreground">
										<FileText className="h-10 w-10 mb-3 opacity-40" />
										<p className="text-sm font-medium">No transactions found</p>
										<p className="text-xs mt-1">Try adjusting your filters</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							paginatedTransactions.map((txn) => (
								<TableRow key={txn.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
									<TableCell className="py-3 pl-4 text-sm">{txn.date}</TableCell>
									<TableCell className="py-3 font-mono text-xs text-muted-foreground">{txn.bookingId}</TableCell>
									<TableCell className="py-3 text-sm">{txn.customer}</TableCell>
									<TableCell className="py-3">
										<Badge variant="outline" className="text-xs">{txn.service}</Badge>
									</TableCell>
									<TableCell className="py-3 text-right text-sm tabular-nums">&euro;{txn.grossAmount.toFixed(2)}</TableCell>
									<TableCell className="py-3 text-right text-sm tabular-nums text-red-500 dark:text-red-400">-&euro;{txn.commission.toFixed(2)}</TableCell>
									<TableCell className="py-3 text-right pr-4 text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">&euro;{txn.netAmount.toFixed(2)}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{transactions.length > 0 && (
				<div className="flex items-center justify-between pt-2 px-1">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span className="text-xs">Rows per page</span>
						<Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
							<SelectTrigger className="h-8 w-[70px] text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ITEMS_PER_PAGE_OPTIONS.map((opt) => (
									<SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-xs text-muted-foreground tabular-nums">
							{startIndex + 1}&ndash;{Math.min(startIndex + itemsPerPage, transactions.length)} of {transactions.length}
						</span>
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
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
											<Button variant={page === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 rounded-lg text-xs" onClick={() => handlePageChange(page)}>
												{page}
											</Button>
										</span>
									);
								})}
							<Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
