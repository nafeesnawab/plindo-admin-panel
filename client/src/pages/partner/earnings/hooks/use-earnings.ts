import { toast } from "sonner";

import { mockEarnings, mockPayouts, mockTransactions } from "../types";

export function useEarnings({ serviceFilter }: { serviceFilter: string }) {
	const earnings = mockEarnings;
	const payouts = mockPayouts;

	const filteredTransactions = mockTransactions.filter((txn) => {
		if (serviceFilter !== "all" && txn.service !== serviceFilter) return false;
		return true;
	});

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
