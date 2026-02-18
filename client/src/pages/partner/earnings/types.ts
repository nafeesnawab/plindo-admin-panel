export interface Transaction {
	id: string;
	date: string;
	bookingId: string;
	customer: string;
	service: string;
	grossAmount: number;
	commission: number;
	netAmount: number;
}

export interface Payout {
	id: string;
	payoutDate: string;
	period: string;
	totalBookings: number;
	netAmount: number;
	status: "completed" | "pending" | "processing";
}

export interface EarningsData {
	total: number;
	thisMonth: number;
	pendingPayout: number;
	nextPayoutDate: string;
}

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export const PAYOUT_STATUS_CONFIG: Record<Payout["status"], { label: string; color: string; darkColor: string }> = {
	completed: {
		label: "Completed",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		darkColor: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
	},
	pending: {
		label: "Pending",
		color: "bg-yellow-50 text-yellow-700 border-yellow-200",
		darkColor: "dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
	},
	processing: {
		label: "Processing",
		color: "bg-blue-50 text-blue-700 border-blue-200",
		darkColor: "dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
	},
};

export const CHART_PERIODS = ["day", "week", "month", "year"] as const;

export const SERVICE_OPTIONS = ["Basic Wash", "Premium Detail", "Interior Clean", "Full Detail"] as const;

export const mockTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
	id: `TXN-${1000 + i}`,
	date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
	bookingId: `BK-${2000 + i}`,
	customer: ["John Smith", "Sarah Johnson", "Mike Brown", "Emily Davis", "James Wilson"][i % 5],
	service: ["Basic Wash", "Premium Detail", "Interior Clean", "Full Detail"][i % 4],
	grossAmount: [25, 75, 45, 120][i % 4],
	commission: [2.5, 7.5, 4.5, 12][i % 4],
	netAmount: [22.5, 67.5, 40.5, 108][i % 4],
}));

export const mockPayouts: Payout[] = [
	{
		id: "PAY-001",
		payoutDate: "2024-01-15",
		period: "Jan 1-15, 2024",
		totalBookings: 45,
		netAmount: 2565,
		status: "completed",
	},
	{
		id: "PAY-002",
		payoutDate: "2024-01-01",
		period: "Dec 16-31, 2023",
		totalBookings: 52,
		netAmount: 2880,
		status: "completed",
	},
	{
		id: "PAY-003",
		payoutDate: "2024-01-22",
		period: "Jan 16-22, 2024",
		totalBookings: 28,
		netAmount: 1512,
		status: "pending",
	},
];

export const mockEarnings: EarningsData = {
	total: 45680,
	thisMonth: 4250,
	pendingPayout: 1512,
	nextPayoutDate: "2024-01-31",
};

export const generateChartData = (period: string) => {
	const labels: string[] = [];
	const data: number[] = [];

	if (period === "day") {
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
			data.push(Math.floor(Math.random() * 300) + 100);
		}
	} else if (period === "week") {
		for (let i = 3; i >= 0; i--) {
			labels.push(`Week ${4 - i}`);
			data.push(Math.floor(Math.random() * 1500) + 500);
		}
	} else if (period === "month") {
		for (let i = 5; i >= 0; i--) {
			const date = new Date();
			date.setMonth(date.getMonth() - i);
			labels.push(date.toLocaleDateString("en-US", { month: "short" }));
			data.push(Math.floor(Math.random() * 5000) + 2000);
		}
	} else {
		for (let i = 2; i >= 0; i--) {
			labels.push(`${2024 - i}`);
			data.push(Math.floor(Math.random() * 50000) + 20000);
		}
	}

	return { labels, data };
};
