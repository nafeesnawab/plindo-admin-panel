import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Banknote, Download, FileText, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import partnerInvoicesService, { type PartnerInvoice } from "@/api/services/partnerInvoicesService";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

import { EarningsChart } from "./components/earnings-chart";
import { EarningsStats } from "./components/earnings-stats";
import { PayoutsTable } from "./components/payouts-table";
import { TransactionsTable } from "./components/transactions-table";
import { useEarnings } from "./hooks/use-earnings";

function InvoicesTab() {
	const { data, isLoading } = useQuery({
		queryKey: ["partner-invoices"],
		queryFn: () => partnerInvoicesService.getInvoices(),
	});

	const invoices: PartnerInvoice[] = Array.isArray(data) ? data : [];

	if (isLoading) {
		return (
			<div className="space-y-2">
				{["a", "b", "c", "d"].map((k) => <Skeleton key={k} className="h-12" />)}
			</div>
		);
	}
	if (!invoices.length) {
		return <div className="text-center text-muted-foreground py-12 text-sm">No invoices yet</div>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Month</TableHead>
					<TableHead className="text-right">Bookings</TableHead>
					<TableHead className="text-right">Gross Revenue</TableHead>
					<TableHead className="text-right">Commission Paid</TableHead>
					<TableHead className="text-right">Net Amount</TableHead>
					<TableHead>Download</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{invoices.map((inv) => (
					<TableRow key={inv.month}>
						<TableCell className="font-medium">
							{format(new Date(`${inv.month}-01`), "MMMM yyyy")}
						</TableCell>
						<TableCell className="text-right">{inv.totalBookings}</TableCell>
						<TableCell className="text-right">EUR{inv.grossRevenue.toFixed(2)}</TableCell>
						<TableCell className="text-right text-red-600">EUR{inv.commissionPaid.toFixed(2)}</TableCell>
						<TableCell className="text-right font-semibold text-green-600">
							EUR{inv.netAmount.toFixed(2)}
						</TableCell>
						<TableCell>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									partnerInvoicesService.downloadPdf(inv.month);
									toast.success("Downloading...");
								}}
							>
								<Download className="h-3.5 w-3.5 mr-1" /> PDF
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export default function PartnerEarningsPage() {
	const [chartPeriod, setChartPeriod] = useState("month");
	const [dateFilter, setDateFilter] = useState("all");
	const [serviceFilter, setServiceFilter] = useState("all");

	const { earnings, filteredTransactions, payouts, handleExportCSV, handleExportPDF, handleDownloadStatement } =
		useEarnings({ serviceFilter });

	return (
		<div className="flex flex-col gap-4 h-full">
			<EarningsStats earnings={earnings} />

			<EarningsChart chartPeriod={chartPeriod} onPeriodChange={setChartPeriod} />

			<Tabs defaultValue="transactions" className="flex flex-col flex-1 min-h-0">
				<TabsList className="w-fit">
					<TabsTrigger value="transactions" className="gap-1.5">
						<FileText className="h-3.5 w-3.5" />
						Transactions
					</TabsTrigger>
					<TabsTrigger value="payouts" className="gap-1.5">
						<Banknote className="h-3.5 w-3.5" />
						Payouts
					</TabsTrigger>
					<TabsTrigger value="invoices" className="gap-1.5">
						<Receipt className="h-3.5 w-3.5" />
						Invoices
					</TabsTrigger>
				</TabsList>

				<TabsContent value="transactions" className="flex-1 min-h-0 mt-4">
					<TransactionsTable
						transactions={filteredTransactions}
						serviceFilter={serviceFilter}
						onServiceFilterChange={setServiceFilter}
						dateFilter={dateFilter}
						onDateFilterChange={setDateFilter}
						onExportCSV={handleExportCSV}
						onExportPDF={handleExportPDF}
					/>
				</TabsContent>

				<TabsContent value="payouts" className="flex-1 min-h-0 mt-4">
					<PayoutsTable payouts={payouts} onDownloadStatement={handleDownloadStatement} />
				</TabsContent>

				<TabsContent value="invoices" className="flex-1 min-h-0 mt-4">
					<InvoicesTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
