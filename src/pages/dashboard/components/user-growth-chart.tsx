import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/api/services/dashboardService";
import { Chart } from "@/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

export default function UserGrowthChart() {
	const { data, isLoading } = useQuery({
		queryKey: ["user-growth"],
		queryFn: dashboardService.getUserGrowth,
	});

	const chartOptions: ApexCharts.ApexOptions = {
		chart: {
			type: "line",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		dataLabels: { enabled: false },
		stroke: { curve: "smooth", width: 3 },
		markers: {
			size: 0,
			hover: { size: 5 },
		},
		xaxis: {
			categories: data?.map((d) => d.date) ?? [],
			labels: {
				formatter: (value) => {
					const date = new Date(value);
					return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
				},
				rotate: -45,
				rotateAlways: false,
			},
			tickAmount: 10,
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
		colors: ["#8b5cf6"],
	};

	const series = [
		{
			name: "New Users",
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
			<CardHeader>
				<CardTitle>User Growth (Last 30 Days)</CardTitle>
			</CardHeader>
			<CardContent>
				<Chart type="line" height={300} options={chartOptions} series={series} />
			</CardContent>
		</Card>
	);
}
