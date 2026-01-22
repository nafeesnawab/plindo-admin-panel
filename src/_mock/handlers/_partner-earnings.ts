import { delay, HttpResponse, http } from "msw";
import { ResultStatus } from "@/types/enum";

// Types
interface Transaction {
	id: string;
	date: string;
	bookingId: string;
	customer: string;
	service: string;
	grossAmount: number;
	commission: number;
	netAmount: number;
}

interface Payout {
	id: string;
	payoutDate: string;
	period: string;
	totalBookings: number;
	grossEarnings: number;
	commission: number;
	netAmount: number;
	status: "completed" | "pending" | "processing";
}

interface BankAccount {
	iban: string;
	bankName: string;
	accountHolder: string;
	verified: boolean;
}

interface EarningsOverview {
	total: number;
	thisMonth: number;
	thisWeek: number;
	today: number;
	grossRevenue: number;
	commission: number;
	netEarnings: number;
	pendingPayout: number;
	nextPayoutDate: string;
}

// In-memory storage
const transactionsStore = new Map<string, Transaction[]>();
const payoutsStore = new Map<string, Payout[]>();
const bankAccountStore = new Map<string, BankAccount>();
const earningsStore = new Map<string, EarningsOverview>();

// Generate mock transactions
const generateMockTransactions = (partnerId: string): Transaction[] => {
	const services = ["Basic Wash", "Premium Detail", "Interior Clean", "Full Detail"];
	const customers = ["John Smith", "Sarah Johnson", "Mike Brown", "Emily Davis", "James Wilson"];
	const prices = [25, 75, 45, 120];

	return Array.from({ length: 50 }, (_, i) => {
		const serviceIndex = i % 4;
		const grossAmount = prices[serviceIndex];
		const commission = grossAmount * 0.1;

		return {
			id: `TXN-${partnerId}-${1000 + i}`,
			date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
			bookingId: `BK-${2000 + i}`,
			customer: customers[i % 5],
			service: services[serviceIndex],
			grossAmount,
			commission,
			netAmount: grossAmount - commission,
		};
	});
};

// Generate mock payouts
const generateMockPayouts = (partnerId: string): Payout[] => {
	return [
		{
			id: `PAY-${partnerId}-001`,
			payoutDate: "2024-01-15",
			period: "Jan 1-15, 2024",
			totalBookings: 45,
			grossEarnings: 2850,
			commission: 285,
			netAmount: 2565,
			status: "completed",
		},
		{
			id: `PAY-${partnerId}-002`,
			payoutDate: "2024-01-01",
			period: "Dec 16-31, 2023",
			totalBookings: 52,
			grossEarnings: 3200,
			commission: 320,
			netAmount: 2880,
			status: "completed",
		},
		{
			id: `PAY-${partnerId}-003`,
			payoutDate: "2024-01-22",
			period: "Jan 16-22, 2024",
			totalBookings: 28,
			grossEarnings: 1680,
			commission: 168,
			netAmount: 1512,
			status: "pending",
		},
	];
};

// Initialize partner data
const initializePartnerData = (partnerId: string) => {
	if (!transactionsStore.has(partnerId)) {
		transactionsStore.set(partnerId, generateMockTransactions(partnerId));
	}
	if (!payoutsStore.has(partnerId)) {
		payoutsStore.set(partnerId, generateMockPayouts(partnerId));
	}
	if (!bankAccountStore.has(partnerId)) {
		bankAccountStore.set(partnerId, {
			iban: "DE89 3704 0044 0532 0130 00",
			bankName: "Deutsche Bank",
			accountHolder: "Clean Cars GmbH",
			verified: true,
		});
	}
	if (!earningsStore.has(partnerId)) {
		earningsStore.set(partnerId, {
			total: 45680,
			thisMonth: 4250,
			thisWeek: 1120,
			today: 285,
			grossRevenue: 4250,
			commission: 425,
			netEarnings: 3825,
			pendingPayout: 1512,
			nextPayoutDate: "2024-01-31",
		});
	}
};

// Initialize demo partner
initializePartnerData("demo-partner-1");

// API Handlers
const getEarningsOverview = http.get("/api/partner/earnings/overview", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const earnings = earningsStore.get(partnerId);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { earnings },
	});
});

const getTransactions = http.get("/api/partner/earnings/transactions", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const dateFilter = url.searchParams.get("dateFilter");
	const serviceFilter = url.searchParams.get("serviceFilter");
	const page = parseInt(url.searchParams.get("page") || "1");
	const limit = parseInt(url.searchParams.get("limit") || "20");

	initializePartnerData(partnerId);
	let transactions = transactionsStore.get(partnerId) || [];

	// Apply filters
	if (serviceFilter && serviceFilter !== "all") {
		transactions = transactions.filter((t) => t.service === serviceFilter);
	}

	if (dateFilter && dateFilter !== "all") {
		const now = new Date();
		const filterDate = new Date();

		switch (dateFilter) {
			case "today":
				filterDate.setHours(0, 0, 0, 0);
				break;
			case "week":
				filterDate.setDate(now.getDate() - 7);
				break;
			case "month":
				filterDate.setMonth(now.getMonth() - 1);
				break;
			case "year":
				filterDate.setFullYear(now.getFullYear() - 1);
				break;
		}

		transactions = transactions.filter((t) => new Date(t.date) >= filterDate);
	}

	// Pagination
	const total = transactions.length;
	const startIndex = (page - 1) * limit;
	const paginatedTransactions = transactions.slice(startIndex, startIndex + limit);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: {
			transactions: paginatedTransactions,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		},
	});
});

const getPayouts = http.get("/api/partner/earnings/payouts", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const payouts = payoutsStore.get(partnerId) || [];

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { payouts },
	});
});

const getBankAccount = http.get("/api/partner/earnings/bank-account", async ({ request }) => {
	await delay(200);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";

	initializePartnerData(partnerId);
	const bankAccount = bankAccountStore.get(partnerId);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { bankAccount },
	});
});

const updateBankAccount = http.put("/api/partner/earnings/bank-account", async ({ request }) => {
	await delay(500);

	const url = new URL(request.url);
	const partnerId = url.searchParams.get("partnerId") || "demo-partner-1";
	const updates = (await request.json()) as Partial<BankAccount>;

	initializePartnerData(partnerId);
	const currentAccount = bankAccountStore.get(partnerId);

	const updatedAccount: BankAccount = {
		...(currentAccount || { iban: "", bankName: "", accountHolder: "", verified: false }),
		...updates,
		verified: false, // Reset verification when details change
	};

	bankAccountStore.set(partnerId, updatedAccount);

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Bank account updated successfully. Verification may take 1-2 business days.",
		data: { bankAccount: updatedAccount },
	});
});

const getEarningsChart = http.get("/api/partner/earnings/chart", async ({ request }) => {
	await delay(300);

	const url = new URL(request.url);
	const period = url.searchParams.get("period") || "month";

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

	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "",
		data: { labels, values: data },
	});
});

const exportTransactions = http.get("/api/partner/earnings/export", async ({ request }) => {
	await delay(500);

	const url = new URL(request.url);
	const format = url.searchParams.get("format") || "csv";

	// In a real app, this would generate and return a file
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: `Transactions exported as ${format.toUpperCase()}`,
		data: {
			downloadUrl: `/api/downloads/transactions.${format}`,
		},
	});
});

const downloadPayoutStatement = http.get("/api/partner/earnings/payouts/:id/statement", async ({ params }) => {
	await delay(300);

	const { id } = params;

	// In a real app, this would generate and return a PDF
	return HttpResponse.json({
		status: ResultStatus.SUCCESS,
		message: "Payout statement ready for download",
		data: {
			payoutId: id,
			downloadUrl: `/api/downloads/payout-${id}.pdf`,
		},
	});
});

export const partnerEarningsHandlers = [
	getEarningsOverview,
	getTransactions,
	getPayouts,
	getBankAccount,
	updateBankAccount,
	getEarningsChart,
	exportTransactions,
	downloadPayoutStatement,
];
