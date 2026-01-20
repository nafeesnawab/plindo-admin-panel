import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";
import { Chart } from "@/components/chart/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { Button } from "@/ui/button";

export default function BookingsTrendChart() {
	const [days, setDays] = useState(7);

	const { data, isLoading } = useQuery({
		queryKey: ["bookings-trend", days],
		queryFn: () => dashboardService.getBookingsTrend(days),
	});

	const chartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "area",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 2 },
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.4,
				opacityTo: 0.1,
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
				formatter: (value) => Math.round(value).toString(),
			},
		},
		tooltip: {
			x: {
				formatter: (value) => {
					const date = new Date(data?.[value - 1]?.date ?? "");
					return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
				},
			},
		},
		colors: ["#3b82f6"],
	};

	const series = [
		{
			name: "Bookings",
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
				<CardTitle>Bookings Trend</CardTitle>
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
				<Chart type="area" height={300} options={chartOptions} series={series} />
			</CardContent>
		</Card>
	);
}
