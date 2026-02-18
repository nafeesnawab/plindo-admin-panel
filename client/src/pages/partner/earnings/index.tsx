import { Banknote, FileText } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

import { EarningsChart } from "./components/earnings-chart";
import { EarningsStats } from "./components/earnings-stats";
import { PayoutsTable } from "./components/payouts-table";
import { TransactionsTable } from "./components/transactions-table";
import { useEarnings } from "./hooks/use-earnings";

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
			</Tabs>
		</div>
	);
}
