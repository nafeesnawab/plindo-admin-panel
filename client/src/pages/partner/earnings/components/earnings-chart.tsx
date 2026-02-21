import { useQuery } from "@tanstack/react-query";

import earningsService from "@/api/services/earningsService";
import type { ChartPeriod } from "@/api/services/earningsService";
import Chart from "@/components/chart/chart";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

import { CHART_PERIODS } from "../types";

interface EarningsChartProps {
	chartPeriod: string;
	onPeriodChange: (period: string) => void;
}

export function EarningsChart({
	chartPeriod,
	onPeriodChange,
}: EarningsChartProps) {
	const { data: chartData } = useQuery({
		queryKey: ["partner-earnings-chart", chartPeriod],
		queryFn: () => earningsService.getChart(chartPeriod as ChartPeriod),
	});

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
			categories: chartData?.labels ?? [],
		},
		yaxis: {
			labels: {
				formatter: (val: number) => `\u20AC${val}`,
			},
		},
		colors: ["#3b82f6"],
		tooltip: {
			y: {
				formatter: (val: number) => `\u20AC${val.toFixed(2)}`,
			},
		},
	};

	const chartSeries = [{ name: "Earnings", data: chartData?.values ?? [] }];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">Earnings Overview</CardTitle>
				<div className="flex gap-1">
					{CHART_PERIODS.map((period) => (
						<Button
							key={period}
							variant={chartPeriod === period ? "default" : "ghost"}
							size="sm"
							onClick={() => onPeriodChange(period)}
							className="capitalize text-xs h-8"
						>
							{period}
						</Button>
					))}
				</div>
			</CardHeader>
			<CardContent>
				<Chart
					type="bar"
					series={chartSeries}
					options={chartOptions}
					height={280}
				/>
			</CardContent>
		</Card>
	);
}
