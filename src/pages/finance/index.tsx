import { useQuery } from "@tanstack/react-query";
import { Pagination, Tabs } from "antd";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Building2, Calendar, DollarSign, FileSpreadsheet, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import financeService from "@/api/services/financeService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
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
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="shrink-0 flex items-center justify-between mb-4">
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
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardHeader className="shrink-0">
					<CardTitle>Daily Breakdown</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 min-h-0 flex flex-col">
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
					</Table>
					<div className="flex-1 min-h-0 overflow-auto">
						<Table>
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
					</div>
					{data && data.daily.length > pageSize && (
						<div className="shrink-0 flex justify-center pt-4 border-t mt-4">
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

export default function FinancePage() {
	const [activeTab, setActiveTab] = useState("revenue");

	const tabItems = [
		{ key: "revenue", label: "Revenue Overview", children: <RevenueTab /> },
		{ key: "commissions", label: "Commissions", children: <CommissionsTab /> },
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-4 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>
		</div>
	);
}
