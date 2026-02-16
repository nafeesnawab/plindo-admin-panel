import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pagination, Tabs } from "antd";
import { format } from "date-fns";
import {
	ArrowDown,
	ArrowUp,
	Building2,
	Calendar,
	Check,
	Clock,
	Crown,
	DollarSign,
	Download,
	FileSpreadsheet,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import financeService, { type Payout } from "@/api/services/financeService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Progress } from "@/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

function RevenueTab() {
	const { data: overview, isLoading: loadingOverview } = useQuery({
		queryKey: ["revenue-overview"],
		queryFn: () => financeService.getRevenueOverview(),
	});

	const { data: trend, isLoading: loadingTrend } = useQuery({
		queryKey: ["revenue-trend"],
		queryFn: () => financeService.getRevenueTrend(),
	});

	const { data: partnerRevenue, isLoading: loadingPartners } = useQuery({
		queryKey: ["revenue-by-partner"],
		queryFn: () => financeService.getRevenueByPartner(),
	});

	const chartOptions: ApexCharts.ApexOptions = {
		chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
		colors: ["#3b82f6", "#10b981"],
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
		xaxis: { categories: trend?.map((t) => `${t.month} ${t.year}`) || [], labels: { style: { fontSize: "12px" } } },
		yaxis: { labels: { formatter: (val) => `EUR${(val / 1000).toFixed(0)}k` } },
		tooltip: { y: { formatter: (val) => `EUR${val.toFixed(2)}` } },
		legend: { position: "top" },
	};

	const chartSeries = [
		{ name: "Total Revenue", data: trend?.map((t) => t.revenue) || [] },
		{ name: "Net Commission", data: trend?.map((t) => t.customerCommission + t.partnerCommission) || [] },
	];

	if (loadingOverview)
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
		);

	const stats = [
		{
			title: "All Time Revenue",
			value: overview?.allTime.totalRevenue || 0,
			commission: overview?.allTime.netRevenue || 0,
			icon: Wallet,
			color: "text-blue-600",
			bg: "bg-blue-500/10",
		},
		{
			title: "This Month",
			value: overview?.thisMonth.totalRevenue || 0,
			growth: overview?.thisMonth.growth,
			icon: Calendar,
			color: "text-green-600",
			bg: "bg-green-500/10",
		},
		{
			title: "Today",
			value: overview?.today.totalRevenue || 0,
			growth: overview?.today.growth,
			icon: DollarSign,
			color: "text-orange-600",
			bg: "bg-orange-500/10",
		},
	];

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between mb-2">
								<div className={`p-2 rounded-lg ${stat.bg}`}>
									<stat.icon className={`h-5 w-5 ${stat.color}`} />
								</div>
								{stat.growth !== undefined && (
									<Badge className={stat.growth >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
										{stat.growth >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
										{Math.abs(stat.growth)}%
									</Badge>
								)}
							</div>
							<p className="text-sm text-muted-foreground">{stat.title}</p>
							<p className="text-2xl font-bold">EUR{stat.value.toLocaleString()}</p>
							{stat.commission !== undefined && (
								<p className="text-xs text-muted-foreground mt-1">
									Platform Commission: EUR{stat.commission.toLocaleString()}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingTrend ? (
							<Skeleton className="h-[300px]" />
						) : (
							<Chart type="area" series={chartSeries} options={chartOptions} height={300} />
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Top Partners
						</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingPartners ? (
							<Skeleton className="h-[200px]" />
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Partner</TableHead>
										<TableHead className="text-right">Revenue</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{partnerRevenue?.slice(0, 5).map((partner, index) => (
										<TableRow key={partner.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
													<span className="text-sm font-medium truncate max-w-[120px]">{partner.businessName}</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-medium">
												EUR{partner.totalRevenue.toLocaleString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function CommissionsTab() {
	const [period, setPeriod] = useState<"week" | "month" | "year">("month");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["commissions", period],
		queryFn: () => financeService.getCommissions(period),
	});

	const handleExportCSV = () => {
		if (!data) return;
		const headers = ["Date", "Bookings", "Gross Revenue", "Customer Fees", "Partner Fees", "Total Commission"];
		const rows = data.daily.map((d) => [
			d.date,
			d.bookings,
			d.grossRevenue,
			d.customerFees,
			d.partnerFees,
			d.totalCommission,
		]);
		const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `commissions-${period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
		link.click();
		URL.revokeObjectURL(url);
		toast.success("CSV exported successfully");
	};

	if (isLoading)
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
		);

	const paginatedDaily = data?.daily.slice((page - 1) * pageSize, page * pageSize) || [];

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex items-center justify-between">
				<Select
					value={period}
					onValueChange={(v) => {
						setPeriod(v as typeof period);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="week">Last 7 Days</SelectItem>
						<SelectItem value="month">Last 30 Days</SelectItem>
						<SelectItem value="year">This Year</SelectItem>
					</SelectContent>
				</Select>
				<Button variant="outline" size="sm" onClick={handleExportCSV}>
					<FileSpreadsheet className="h-4 w-4 mr-2" />
					Export CSV
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Total Bookings</p>
						<p className="text-2xl font-bold">{data?.totals.bookings.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Gross Revenue</p>
						<p className="text-2xl font-bold">EUR{data?.totals.grossRevenue.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Total Commission</p>
						<p className="text-2xl font-bold text-purple-600">EUR{data?.totals.totalCommission.toLocaleString()}</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Daily Breakdown</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead className="text-right">Bookings</TableHead>
								<TableHead className="text-right">Gross Revenue</TableHead>
								<TableHead className="text-right">Customer Fees</TableHead>
								<TableHead className="text-right">Partner Fees</TableHead>
								<TableHead className="text-right">Total Commission</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedDaily.map((day) => (
								<TableRow key={day.date}>
									<TableCell className="font-medium">{format(new Date(day.date), "MMM dd, yyyy")}</TableCell>
									<TableCell className="text-right">{day.bookings}</TableCell>
									<TableCell className="text-right">EUR{day.grossRevenue.toFixed(2)}</TableCell>
									<TableCell className="text-right text-blue-600">EUR{day.customerFees.toFixed(2)}</TableCell>
									<TableCell className="text-right text-green-600">EUR{day.partnerFees.toFixed(2)}</TableCell>
									<TableCell className="text-right font-medium">EUR{day.totalCommission.toFixed(2)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					{data && data.daily.length > pageSize && (
						<div className="flex justify-center mt-4">
							<Pagination
								current={page}
								total={data.daily.length}
								pageSize={pageSize}
								onChange={setPage}
								showSizeChanger={false}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function PayoutsTab() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["payouts", page, statusFilter],
		queryFn: () => financeService.getPayouts({ page, limit: 10, status: statusFilter || undefined }),
	});

	const markPaidMutation = useMutation({
		mutationFn: (id: string) => financeService.markPayoutPaid(id),
		onSuccess: () => {
			toast.success("Payout marked as paid");
			queryClient.invalidateQueries({ queryKey: ["payouts"] });
			setShowConfirmDialog(false);
			setSelectedPayout(null);
		},
		onError: () => toast.error("Failed to mark payout as paid"),
	});

	const handleDownloadReport = (payout: Payout) => {
		const content = `PAYOUT REPORT\n=============\nPartner: ${payout.partner.businessName}\nOwner: ${payout.partner.ownerName}\nBank Account: ${payout.partner.bankAccount}\n\nPeriod: ${format(new Date(payout.period.start), "MMM dd, yyyy")} - ${format(new Date(payout.period.end), "MMM dd, yyyy")}\n\nTotal Bookings: ${payout.totalBookings}\nGross Earnings: EUR${payout.grossEarnings.toFixed(2)}\nCommission Deducted (10%): EUR${payout.commissionDeducted.toFixed(2)}\nNet Payout: EUR${payout.netPayout.toFixed(2)}\n\nStatus: ${payout.status.toUpperCase()}`;
		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `payout-${payout.partner.businessName.replace(/\s+/g, "-")}.txt`;
		link.click();
		URL.revokeObjectURL(url);
		toast.success("Report downloaded");
	};

	if (isLoading)
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
		);

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex gap-4">
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-yellow-600" />
						<span className="text-sm">
							<strong>{data?.summary.pendingCount}</strong> pending (EUR{data?.summary.totalPending.toFixed(2)})
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Check className="h-4 w-4 text-green-600" />
						<span className="text-sm">
							<strong>{data?.summary.paidCount}</strong> paid (EUR{data?.summary.totalPaid.toFixed(2)})
						</span>
					</div>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(v) => {
						setStatusFilter(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="All Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Card>
				<CardContent className="pt-6">
					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">No payouts found</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Partner</TableHead>
									<TableHead>Period</TableHead>
									<TableHead className="text-right">Bookings</TableHead>
									<TableHead className="text-right">Gross</TableHead>
									<TableHead className="text-right">Commission</TableHead>
									<TableHead className="text-right">Net Payout</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.items.map((payout) => (
									<TableRow key={payout.id}>
										<TableCell>
											<div>
												<p className="font-medium">{payout.partner.businessName}</p>
												<p className="text-xs text-muted-foreground">{payout.partner.ownerName}</p>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{format(new Date(payout.period.start), "MMM dd")} -{" "}
												{format(new Date(payout.period.end), "MMM dd")}
											</div>
										</TableCell>
										<TableCell className="text-right">{payout.totalBookings}</TableCell>
										<TableCell className="text-right">EUR{payout.grossEarnings.toFixed(2)}</TableCell>
										<TableCell className="text-right text-red-600">
											-EUR{payout.commissionDeducted.toFixed(2)}
										</TableCell>
										<TableCell className="text-right font-bold">EUR{payout.netPayout.toFixed(2)}</TableCell>
										<TableCell>
											{payout.status === "paid" ? (
												<Badge className="bg-green-500/10 text-green-600">Paid</Badge>
											) : (
												<Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												{payout.status === "pending" && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setSelectedPayout(payout);
															setShowConfirmDialog(true);
														}}
													>
														<Check className="h-4 w-4 mr-1" />
														Mark Paid
													</Button>
												)}
												<Button variant="ghost" size="icon" onClick={() => handleDownloadReport(payout)}>
													<Download className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
					{data && data.total > 10 && (
						<div className="flex justify-center mt-4">
							<Pagination
								current={page}
								total={data.total}
								pageSize={10}
								onChange={setPage}
								showSizeChanger={false}
								showTotal={(total) => `Total ${total} payouts`}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Payout</DialogTitle>
						<DialogDescription>Are you sure you want to mark this payout as paid?</DialogDescription>
					</DialogHeader>
					{selectedPayout && (
						<div className="space-y-2 py-4">
							<p>
								<strong>Partner:</strong> {selectedPayout.partner.businessName}
							</p>
							<p>
								<strong>Bank Account:</strong> {selectedPayout.partner.bankAccount}
							</p>
							<p>
								<strong>Amount:</strong> EUR{selectedPayout.netPayout.toFixed(2)}
							</p>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => selectedPayout && markPaidMutation.mutate(selectedPayout.id)}
							disabled={markPaidMutation.isPending}
						>
							<Check className="h-4 w-4 mr-2" />
							Confirm Payment
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function SubscriptionsTab() {
	const { data, isLoading } = useQuery({
		queryKey: ["subscription-revenue"],
		queryFn: () => financeService.getSubscriptionRevenue(),
	});

	if (isLoading)
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
		);

	const totalSubscribers = data?.overview.totalActive || 0;
	const basicPercentage = totalSubscribers > 0 ? ((data?.overview.basicSubscribers || 0) / totalSubscribers) * 100 : 0;
	const premiumPercentage =
		totalSubscribers > 0 ? ((data?.overview.premiumSubscribers || 0) / totalSubscribers) * 100 : 0;

	return (
		<div className="flex-1 min-h-0 overflow-auto space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Total Active Subscribers</p>
						<p className="text-2xl font-bold">{data?.overview.totalActive.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Monthly Revenue</p>
						<p className="text-2xl font-bold">EUR{data?.overview.totalMonthlyRevenue.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Churn Rate</p>
						<p className="text-2xl font-bold">{data?.overview.churnRate}%</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Subscription Plans</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{data?.plans.map((plan) => (
						<div key={plan.name} className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{plan.name === "Premium" ? (
										<Crown className="h-5 w-5 text-amber-500" />
									) : (
										<TrendingUp className="h-5 w-5 text-blue-500" />
									)}
									<span className="font-medium">{plan.name} Plan</span>
									<Badge variant="outline">EUR{plan.price}/mo</Badge>
								</div>
								<span className="font-bold">EUR{plan.revenue.toLocaleString()}/mo</span>
							</div>
							<div className="flex items-center gap-4">
								<Progress value={plan.name === "Basic" ? basicPercentage : premiumPercentage} className="flex-1 h-2" />
								<span className="text-sm text-muted-foreground w-24 text-right">{plan.subscribers} users</span>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export default function FinancePage() {
	const [activeTab, setActiveTab] = useState("revenue");

	const tabItems = [
		{ key: "revenue", label: "Revenue Overview", children: <RevenueTab /> },
		{ key: "commissions", label: "Commissions", children: <CommissionsTab /> },
		{ key: "payouts", label: "Payouts", children: <PayoutsTab /> },
		{ key: "subscriptions", label: "Subscriptions", children: <SubscriptionsTab /> },
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>
		</div>
	);
}
