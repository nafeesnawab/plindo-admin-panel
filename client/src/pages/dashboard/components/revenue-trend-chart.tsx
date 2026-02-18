import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import dashboardService from "@/api/services/dashboardService";
import { Chart } from "@/components/chart";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

export default function RevenueTrendChart() {
	const [days, setDays] = useState(7);

	const { data, isLoading } = useQuery({
		queryKey: ["revenue-trend", days],
		queryFn: () => dashboardService.getRevenueTrend(days),
	});

	const chartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "bar",
			toolbar: { show: false },
		},
		dataLabels: { enabled: false },
		plotOptions: {
			bar: {
				borderRadius: 4,
				columnWidth: "60%",
			},
		},
		xaxis: {
			categories: data?.map((d) => d.date) ?? [],
			labels: {
				formatter: (value) => {
					const date = new Date(value);
					return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
				},
			},
		},
		yaxis: {
			labels: {
				formatter: (value) => `€${(value / 1000).toFixed(1)}k`,
			},
		},
		tooltip: {
			y: {
				formatter: (value) => `€${value.toLocaleString()}`,
			},
		},
		colors: ["#22c55e"],
	};

	const series = [
		{
			name: "Revenue",
			data: data?.map((d) => d.value) ?? [],
		},
	];

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Revenue Trend</CardTitle>
				<div className="flex gap-1">
					<Button variant={days === 7 ? "default" : "outline"} size="sm" onClick={() => setDays(7)}>
						7 Days
					</Button>
					<Button variant={days === 30 ? "default" : "outline"} size="sm" onClick={() => setDays(30)}>
						30 Days
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Chart type="bar" height={300} options={chartOptions} series={series} />
			</CardContent>
		</Card>
	);
}
