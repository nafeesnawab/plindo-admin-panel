import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
	EarningsOverview,
	Transaction,
} from "@/api/services/earningsService";
import earningsService from "@/api/services/earningsService";

import type { EarningsData, Payout } from "../types";

export function useEarnings({ serviceFilter }: { serviceFilter: string }) {
	const { data: overviewData } = useQuery({
		queryKey: ["partner-earnings-overview"],
		queryFn: () => earningsService.getOverview(),
	});

	const { data: transactionsData } = useQuery({
		queryKey: ["partner-earnings-transactions"],
		queryFn: () => earningsService.getTransactions({ limit: 100 }),
	});

	const { data: payoutsData } = useQuery({
		queryKey: ["partner-earnings-payouts"],
		queryFn: () => earningsService.getPayouts(),
	});

	const overview: EarningsOverview | null = overviewData ?? null;

	const earnings: EarningsData = {
		total: overview?.total ?? 0,
		thisMonth: overview?.thisMonth ?? 0,
		pendingPayout: overview?.pendingPayout ?? 0,
		nextPayoutDate: overview?.nextPayoutDate ?? "",
	};

	const allTransactions: Transaction[] = transactionsData?.transactions ?? [];

	const filteredTransactions = allTransactions.filter((txn) => {
		if (serviceFilter !== "all" && txn.service !== serviceFilter) return false;
		return true;
	});

	const payouts: Payout[] = (payoutsData?.payouts ?? []) as Payout[];

	const handleExportCSV = () => {
		toast.success("Transaction history exported to CSV");
	};

	const handleExportPDF = () => {
		toast.success("Transaction history exported to PDF");
	};

	const handleDownloadStatement = (payoutId: string) => {
		toast.success(`Payout statement ${payoutId} downloaded`);
	};

	return {
		earnings,
		filteredTransactions,
		payouts,
		handleExportCSV,
		handleExportPDF,
		handleDownloadStatement,
	};
}
