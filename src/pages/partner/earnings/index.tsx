import {
	ArrowDownToLine,
	ArrowUpRight,
	Banknote,
	Building2,
	Calendar,
	CreditCard,
	DollarSign,
	Download,
	Edit,
	FileText,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Chart from "@/components/chart/chart";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { cn } from "@/utils";

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

// Mock data
const mockTransactions: Transaction[] = Array.from({ length: 20 }, (_, i) => ({
	id: `TXN-${1000 + i}`,
	date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
	bookingId: `BK-${2000 + i}`,
	customer: ["John Smith", "Sarah Johnson", "Mike Brown", "Emily Davis", "James Wilson"][i % 5],
	service: ["Basic Wash", "Premium Detail", "Interior Clean", "Full Detail"][i % 4],
	grossAmount: [25, 75, 45, 120][i % 4],
	commission: [2.5, 7.5, 4.5, 12][i % 4],
	netAmount: [22.5, 67.5, 40.5, 108][i % 4],
}));

const mockPayouts: Payout[] = [
	{
		id: "PAY-001",
		payoutDate: "2024-01-15",
		period: "Jan 1-15, 2024",
		totalBookings: 45,
		grossEarnings: 2850,
		commission: 285,
		netAmount: 2565,
		status: "completed",
	},
	{
		id: "PAY-002",
		payoutDate: "2024-01-01",
		period: "Dec 16-31, 2023",
		totalBookings: 52,
		grossEarnings: 3200,
		commission: 320,
		netAmount: 2880,
		status: "completed",
	},
	{
		id: "PAY-003",
		payoutDate: "2024-01-22",
		period: "Jan 16-22, 2024",
		totalBookings: 28,
		grossEarnings: 1680,
		commission: 168,
		netAmount: 1512,
		status: "pending",
	},
];

const mockBankAccount: BankAccount = {
	iban: "DE89 3704 0044 0532 0130 00",
	bankName: "Deutsche Bank",
	accountHolder: "Clean Cars GmbH",
	verified: true,
};

// Chart data
const generateChartData = (period: string) => {
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

export default function PartnerEarningsPage() {
	const [chartPeriod, setChartPeriod] = useState("month");
	const [dateFilter, setDateFilter] = useState("all");
	const [serviceFilter, setServiceFilter] = useState("all");
	const [bankDialogOpen, setBankDialogOpen] = useState(false);
	const [bankAccount, setBankAccount] = useState<BankAccount>(mockBankAccount);
	const [editingBank, setEditingBank] = useState<BankAccount>(mockBankAccount);

	// Earnings data
	const earnings = {
		total: 45680,
		thisMonth: 4250,
		thisWeek: 1120,
		today: 285,
		grossRevenue: 4250,
		commission: 425,
		netEarnings: 3825,
		pendingPayout: 1512,
		nextPayoutDate: "2024-01-31",
	};

	// Chart configuration
	const chartData = generateChartData(chartPeriod);
	const chartOptions = {
		chart: {
			type: "bar" as const,
			toolbar: { show: false },
		},
		plotOptions: {
			bar: {
				borderRadius: 4,
				columnWidth: "60%",
			},
		},
		dataLabels: { enabled: false },
		xaxis: {
			categories: chartData.labels,
		},
		yaxis: {
			labels: {
				formatter: (val: number) => `€${val}`,
			},
		},
		colors: ["#3b82f6"],
		tooltip: {
			y: {
				formatter: (val: number) => `€${val.toFixed(2)}`,
			},
		},
	};

	const chartSeries = [
		{
			name: "Earnings",
			data: chartData.data,
		},
	];

	// Filter transactions
	const filteredTransactions = mockTransactions.filter((txn) => {
		if (serviceFilter !== "all" && txn.service !== serviceFilter) return false;
		return true;
	});

	// Handlers
	const handleExportCSV = () => {
		toast.success("Transaction history exported to CSV");
	};

	const handleExportPDF = () => {
		toast.success("Transaction history exported to PDF");
	};

	const handleDownloadStatement = (payoutId: string) => {
		toast.success(`Payout statement ${payoutId} downloaded`);
	};

	const handleSaveBankAccount = () => {
		setBankAccount(editingBank);
		setBankDialogOpen(false);
		toast.success("Bank account updated successfully");
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold">Earnings & Payments</h1>
				<p className="text-muted-foreground">Track your earnings and manage payouts</p>
			</div>

			{/* Earnings Overview Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Earnings</p>
								<p className="text-2xl font-bold">€{earnings.total.toLocaleString()}</p>
								<p className="text-xs text-muted-foreground">All time</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<Wallet className="h-6 w-6 text-primary" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">This Month</p>
								<p className="text-2xl font-bold">€{earnings.thisMonth.toLocaleString()}</p>
								<div className="flex items-center text-xs text-green-600">
									<ArrowUpRight className="h-3 w-3" />
									<span>12% vs last month</span>
								</div>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
								<TrendingUp className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">This Week</p>
								<p className="text-2xl font-bold">€{earnings.thisWeek.toLocaleString()}</p>
								<p className="text-xs text-muted-foreground">7 days</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
								<Calendar className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Today</p>
								<p className="text-2xl font-bold">€{earnings.today.toLocaleString()}</p>
								<p className="text-xs text-muted-foreground">So far</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
								<DollarSign className="h-6 w-6 text-purple-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Breakdown & Chart Row */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Earnings Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">This Month's Breakdown</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between py-2 border-b">
							<span className="text-muted-foreground">Gross Revenue</span>
							<span className="font-medium">€{earnings.grossRevenue.toLocaleString()}</span>
						</div>
						<div className="flex items-center justify-between py-2 border-b">
							<span className="text-muted-foreground">Platform Commission (10%)</span>
							<span className="font-medium text-red-500">-€{earnings.commission.toLocaleString()}</span>
						</div>
						<div className="flex items-center justify-between py-2 border-b">
							<span className="font-medium">Net Earnings (90%)</span>
							<span className="font-bold text-green-600">€{earnings.netEarnings.toLocaleString()}</span>
						</div>
						<div className="flex items-center justify-between py-2 border-b">
							<span className="text-muted-foreground">Pending Payout</span>
							<span className="font-medium">€{earnings.pendingPayout.toLocaleString()}</span>
						</div>
						<div className="flex items-center justify-between py-2">
							<span className="text-muted-foreground">Next Payout Date</span>
							<span className="font-medium">{earnings.nextPayoutDate}</span>
						</div>
					</CardContent>
				</Card>

				{/* Earnings Chart */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-base">Earnings Overview</CardTitle>
						<div className="flex gap-1">
							{["day", "week", "month", "year"].map((period) => (
								<Button
									key={period}
									variant={chartPeriod === period ? "default" : "ghost"}
									size="sm"
									onClick={() => setChartPeriod(period)}
									className="capitalize"
								>
									{period}
								</Button>
							))}
						</div>
					</CardHeader>
					<CardContent>
						<Chart type="bar" series={chartSeries} options={chartOptions} height={280} />
					</CardContent>
				</Card>
			</div>

			{/* Tabs for Transactions, Payouts, Bank */}
			<Tabs defaultValue="transactions" className="space-y-4">
				<TabsList>
					<TabsTrigger value="transactions" className="gap-2">
						<FileText className="h-4 w-4" />
						Transactions
					</TabsTrigger>
					<TabsTrigger value="payouts" className="gap-2">
						<Banknote className="h-4 w-4" />
						Payouts
					</TabsTrigger>
					<TabsTrigger value="bank" className="gap-2">
						<Building2 className="h-4 w-4" />
						Bank Account
					</TabsTrigger>
				</TabsList>

				{/* Transaction History */}
				<TabsContent value="transactions">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Transaction History</CardTitle>
								<CardDescription>All completed bookings and earnings</CardDescription>
							</div>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" onClick={handleExportCSV}>
									<Download className="h-4 w-4 mr-1" />
									CSV
								</Button>
								<Button variant="outline" size="sm" onClick={handleExportPDF}>
									<FileText className="h-4 w-4 mr-1" />
									PDF
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{/* Filters */}
							<div className="flex flex-wrap gap-4 mb-4">
								<Select value={dateFilter} onValueChange={setDateFilter}>
									<SelectTrigger className="w-[180px]">
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
								<Select value={serviceFilter} onValueChange={setServiceFilter}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Service type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Services</SelectItem>
										<SelectItem value="Basic Wash">Basic Wash</SelectItem>
										<SelectItem value="Premium Detail">Premium Detail</SelectItem>
										<SelectItem value="Interior Clean">Interior Clean</SelectItem>
										<SelectItem value="Full Detail">Full Detail</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Table */}
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Date</TableHead>
											<TableHead>Booking ID</TableHead>
											<TableHead>Customer</TableHead>
											<TableHead>Service</TableHead>
											<TableHead className="text-right">Gross</TableHead>
											<TableHead className="text-right">Commission</TableHead>
											<TableHead className="text-right">Net</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTransactions.map((txn) => (
											<TableRow key={txn.id} className="cursor-pointer hover:bg-muted/50">
												<TableCell>{txn.date}</TableCell>
												<TableCell className="font-mono text-sm">{txn.bookingId}</TableCell>
												<TableCell>{txn.customer}</TableCell>
												<TableCell>
													<Badge variant="outline">{txn.service}</Badge>
												</TableCell>
												<TableCell className="text-right">€{txn.grossAmount.toFixed(2)}</TableCell>
												<TableCell className="text-right text-red-500">-€{txn.commission.toFixed(2)}</TableCell>
												<TableCell className="text-right font-medium text-green-600">
													€{txn.netAmount.toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Payout History */}
				<TabsContent value="payouts">
					<Card>
						<CardHeader>
							<CardTitle>Payout History</CardTitle>
							<CardDescription>All payouts received to your bank account</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Payout Date</TableHead>
											<TableHead>Period</TableHead>
											<TableHead className="text-right">Bookings</TableHead>
											<TableHead className="text-right">Gross</TableHead>
											<TableHead className="text-right">Commission</TableHead>
											<TableHead className="text-right">Net</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{mockPayouts.map((payout) => (
											<TableRow key={payout.id} className="cursor-pointer hover:bg-muted/50">
												<TableCell>{payout.payoutDate}</TableCell>
												<TableCell>{payout.period}</TableCell>
												<TableCell className="text-right">{payout.totalBookings}</TableCell>
												<TableCell className="text-right">€{payout.grossEarnings.toFixed(2)}</TableCell>
												<TableCell className="text-right text-red-500">-€{payout.commission.toFixed(2)}</TableCell>
												<TableCell className="text-right font-medium text-green-600">
													€{payout.netAmount.toFixed(2)}
												</TableCell>
												<TableCell>
													<Badge
														className={cn(
															payout.status === "completed" && "bg-green-100 text-green-800",
															payout.status === "pending" && "bg-yellow-100 text-yellow-800",
															payout.status === "processing" && "bg-blue-100 text-blue-800",
														)}
													>
														{payout.status}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<Button variant="ghost" size="sm" onClick={() => handleDownloadStatement(payout.id)}>
														<ArrowDownToLine className="h-4 w-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Bank Account */}
				<TabsContent value="bank">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Bank Account Details</CardTitle>
								<CardDescription>Your linked bank account for payouts</CardDescription>
							</div>
							<Button variant="outline" onClick={() => setBankDialogOpen(true)}>
								<Edit className="h-4 w-4 mr-2" />
								Update
							</Button>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-2">
								<div className="space-y-4">
									<div className="flex items-center gap-4 p-4 rounded-lg border">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
											<CreditCard className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1">
											<p className="text-sm text-muted-foreground">IBAN</p>
											<p className="font-mono font-medium">{bankAccount.iban}</p>
										</div>
									</div>

									<div className="flex items-center gap-4 p-4 rounded-lg border">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
											<Building2 className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1">
											<p className="text-sm text-muted-foreground">Bank Name</p>
											<p className="font-medium">{bankAccount.bankName}</p>
										</div>
									</div>

									<div className="flex items-center gap-4 p-4 rounded-lg border">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
											<Wallet className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1">
											<p className="text-sm text-muted-foreground">Account Holder</p>
											<p className="font-medium">{bankAccount.accountHolder}</p>
										</div>
									</div>
								</div>

								<div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-muted/30">
									<div
										className={cn(
											"flex h-16 w-16 items-center justify-center rounded-full mb-4",
											bankAccount.verified ? "bg-green-100" : "bg-yellow-100",
										)}
									>
										{bankAccount.verified ? (
											<Badge className="bg-green-600">Verified</Badge>
										) : (
											<Badge className="bg-yellow-600">Pending</Badge>
										)}
									</div>
									<h3 className="text-lg font-medium mb-2">Account Status</h3>
									<p className="text-sm text-muted-foreground text-center">
										{bankAccount.verified
											? "Your bank account is verified and ready to receive payouts."
											: "Your bank account is pending verification. This may take 1-2 business days."}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Bank Account Dialog */}
			<Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Bank Account</DialogTitle>
						<DialogDescription>Enter your bank account details for payouts</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="iban">IBAN</Label>
							<Input
								id="iban"
								placeholder="DE89 3704 0044 0532 0130 00"
								value={editingBank.iban}
								onChange={(e) => setEditingBank((prev) => ({ ...prev, iban: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bankName">Bank Name</Label>
							<Input
								id="bankName"
								placeholder="Deutsche Bank"
								value={editingBank.bankName}
								onChange={(e) => setEditingBank((prev) => ({ ...prev, bankName: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="accountHolder">Account Holder Name</Label>
							<Input
								id="accountHolder"
								placeholder="John Doe"
								value={editingBank.accountHolder}
								onChange={(e) => setEditingBank((prev) => ({ ...prev, accountHolder: e.target.value }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBankDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveBankAccount}>Save Changes</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
