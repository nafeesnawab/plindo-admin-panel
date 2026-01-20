import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import financeService from "@/api/services/financeService";
import { Chart } from "@/components/chart";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import { format } from "date-fns";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CommissionsPage() {
	const [period, setPeriod] = useState<"week" | "month" | "year">("month");

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

	const handleExportPDF = () => {
		toast.info("PDF export coming soon");
	};

	const chartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "bar",
			toolbar: { show: false },
			stacked: true,
		},
		colors: ["#3b82f6", "#10b981"],
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: "60%",
				borderRadius: 4,
			},
		},
		dataLabels: { enabled: false },
		xaxis: {
			categories: data?.daily.map((d) => format(new Date(d.date), "MMM dd")) || [],
			labels: { style: { fontSize: "11px" } },
		},
		yaxis: {
			labels: {
				formatter: (val) => `€${val.toFixed(0)}`,
			},
		},
		tooltip: {
			y: { formatter: (val) => `€${val.toFixed(2)}` },
		},
		legend: { position: "top" },
	};

	const chartSeries = [
		{
			name: "Customer Fees",
			data: data?.daily.map((d) => d.customerFees) || [],
		},
		{
			name: "Partner Fees",
			data: data?.daily.map((d) => d.partnerFees) || [],
		},
	];

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
				<Skeleton className="h-[400px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold">Commissions</h1>
					<Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
						<SelectTrigger className="w-[150px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="week">Last 7 Days</SelectItem>
							<SelectItem value="month">Last 30 Days</SelectItem>
							<SelectItem value="year">This Year</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleExportCSV}>
						<FileSpreadsheet className="h-4 w-4 mr-2" />
						Export CSV
					</Button>
					<Button variant="outline" size="sm" onClick={handleExportPDF}>
						<FileText className="h-4 w-4 mr-2" />
						Export PDF
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Total Bookings</p>
						<p className="text-2xl font-bold">{data?.totals.bookings.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Gross Revenue</p>
						<p className="text-2xl font-bold">€{data?.totals.grossRevenue.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Customer Fees</p>
						<p className="text-2xl font-bold text-blue-600">€{data?.totals.customerFees.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Partner Fees</p>
						<p className="text-2xl font-bold text-green-600">€{data?.totals.partnerFees.toLocaleString()}</p>
					</CardContent>
				</Card>
				<Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground">Total Commission</p>
						<p className="text-2xl font-bold text-purple-600">€{data?.totals.totalCommission.toLocaleString()}</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Commission Trend</CardTitle>
				</CardHeader>
				<CardContent>
					<Chart type="bar" series={chartSeries} options={chartOptions} height={300} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Daily Breakdown</span>
						<Badge variant="secondary">{data?.daily.length} days</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead className="text-right">Bookings</TableHead>
								<TableHead className="text-right">Gross Revenue</TableHead>
								<TableHead className="text-right">Customer Fees (10%)</TableHead>
								<TableHead className="text-right">Partner Fees (10%)</TableHead>
								<TableHead className="text-right">Total Commission</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.daily.map((day) => (
								<TableRow key={day.date}>
									<TableCell className="font-medium">
										{format(new Date(day.date), "MMM dd, yyyy")}
									</TableCell>
									<TableCell className="text-right">{day.bookings}</TableCell>
									<TableCell className="text-right">€{day.grossRevenue.toFixed(2)}</TableCell>
									<TableCell className="text-right text-blue-600">€{day.customerFees.toFixed(2)}</TableCell>
									<TableCell className="text-right text-green-600">€{day.partnerFees.toFixed(2)}</TableCell>
									<TableCell className="text-right font-medium">€{day.totalCommission.toFixed(2)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
