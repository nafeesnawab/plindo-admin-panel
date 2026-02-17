import type { Props as ApexChartProps } from "react-apexcharts";
import ApexChart from "react-apexcharts";
import { chartWrapper } from "./styles.css";

export default function Chart(props: ApexChartProps) {
	// Check if dark mode is active
	const isDarkMode = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

	return (
		<div className={chartWrapper}>
			<ApexChart
				{...props}
				options={{
					...props.options,
					chart: {
						...props.options?.chart,
						animations: {
							...props.options?.chart?.animations,
							enabled: true,
							speed: 200,
							animateGradually: {
								enabled: false,
							},
							dynamicAnimation: {
								enabled: true,
								speed: 200,
							},
						},
						redrawOnParentResize: true,
						redrawOnWindowResize: true,
					},
					xaxis: {
						...props.options?.xaxis,
						labels: {
							...props.options?.xaxis?.labels,
							style: {
								...props.options?.xaxis?.labels?.style,
								colors: isDarkMode ? "#ffffff" : props.options?.xaxis?.labels?.style?.colors,
							},
						},
					},
					yaxis: Array.isArray(props.options?.yaxis)
						? props.options?.yaxis
						: {
								...props.options?.yaxis,
								labels: {
									...props.options?.yaxis?.labels,
									style: {
										...props.options?.yaxis?.labels?.style,
										colors: isDarkMode ? "#ffffff" : props.options?.yaxis?.labels?.style?.colors,
									},
								},
							},
					tooltip: {
						...props.options?.tooltip,
						theme: isDarkMode ? "dark" : "light",
						style: {
							...props.options?.tooltip?.style,
							fontSize: "12px",
						},
						cssClass: isDarkMode ? "apexcharts-tooltip-dark" : "",
						x: {
							...props.options?.tooltip?.x,
						},
						y: {
							...props.options?.tooltip?.y,
						},
					},
					legend: {
						...props.options?.legend,
						labels: {
							...props.options?.legend?.labels,
							colors: isDarkMode ? "#ffffff" : props.options?.legend?.labels?.colors,
						},
					},
				}}
			/>
		</div>
	);
}
