import type { ApexOptions } from "apexcharts";
import { mergeDeepRight } from "ramda";
import { useSettings } from "@/store/settingStore";
import { themeVars } from "@/theme/theme.css";
import { breakpointsTokens } from "@/theme/tokens/breakpoints";
import { paletteColors, presetsColors } from "@/theme/tokens/color";
import type { ThemeColorPresets, ThemeMode } from "@/types/enum";
import { removePx, rgbAlpha } from "@/utils/theme";

export function useChart(options: ApexOptions) {
	const { themeColorPresets, themeMode } = useSettings();

	const baseOptions = baseCharOptions(themeMode, themeColorPresets) ?? {};
	return mergeDeepRight(baseOptions, options) as ApexOptions;
}

const baseCharOptions = (themeMode: ThemeMode, themeColorPresets: ThemeColorPresets): ApexOptions => {
	const isDarkMode = themeMode === "dark";
	const textColor = isDarkMode ? "#ffffff" : "#1C252E";
	const secondaryTextColor = isDarkMode ? "#919EAB" : "#637381";
	const disabledTextColor = isDarkMode ? "#637381" : "#919EAB";
	const gridColor = isDarkMode ? "#27272A" : "#F4F6F8";

	const LABEL_TOTAL = {
		show: true,
		label: "Total",
		color: secondaryTextColor,
		fontSize: themeVars.typography.fontSize.sm,
		lineHeight: themeVars.typography.lineHeight.tight,
	};

	const LABEL_VALUE = {
		offsetY: 8,
		color: textColor,
		fontSize: themeVars.typography.fontSize.sm,
		lineHeight: themeVars.typography.lineHeight.tight,
	};
	return {
		// Colors
		colors: [
			presetsColors[themeColorPresets].default,
			paletteColors.info.default,
			paletteColors.warning.default,
			paletteColors.error.default,
			paletteColors.success.default,

			paletteColors.warning.dark,
			paletteColors.info.dark,
			paletteColors.error.dark,
			paletteColors.success.dark,
		],

		// Chart
		chart: {
			toolbar: { show: false },
			zoom: { enabled: false },
			parentHeightOffset: 0,
			foreColor: disabledTextColor,
			fontFamily: themeVars.typography.fontFamily.openSans,
			// 优化动画配置以提高响应式性能
			animations: {
				enabled: true,
				speed: 360,
				animateGradually: { enabled: true, delay: 120 },
				dynamicAnimation: { enabled: true, speed: 360 },
			},
			// 启用快速响应式重绘
			redrawOnParentResize: true,
			redrawOnWindowResize: true,
		},

		// States
		states: {
			hover: { filter: { type: isDarkMode ? "lighten" : "darken" } },
			active: { filter: { type: isDarkMode ? "lighten" : "darken" } },
		},

		// Fill
		fill: {
			opacity: 1,
			gradient: {
				type: "vertical",
				shadeIntensity: 0,
				opacityFrom: 0.4,
				opacityTo: 0,
				stops: [0, 100],
			},
		},

		// Datalabels
		dataLabels: {
			enabled: false,
			style: {
				colors: [textColor],
			},
		},

		// Stroke
		stroke: {
			width: 2.5,
			curve: "smooth",
			lineCap: "round",
		},

		// Grid
		grid: {
			strokeDashArray: 3,
			borderColor: gridColor,
			padding: { top: 0, right: 0, bottom: 0 },
			xaxis: { lines: { show: false } },
		},

		// Xaxis
		xaxis: {
			axisBorder: { show: false },
			axisTicks: { show: false },
			labels: {
				style: {
					colors: Array(12).fill(textColor),
				},
			},
		},
		yaxis: {
			tickAmount: 5,
			labels: {
				style: {
					colors: [textColor],
				},
			},
		},

		// Markers
		markers: {
			size: 0,
			strokeColors: themeVars.colors.background.paper,
		},

		// Tooltip
		tooltip: { theme: themeMode, fillSeriesColor: false, x: { show: true } },

		// Legend
		legend: {
			show: false,
			fontSize: themeVars.typography.fontSize.sm,
			position: "top",
			horizontalAlign: "right",
			markers: { shape: "circle" },
			fontWeight: 500,
			itemMargin: { horizontal: 8, vertical: 8 },
			labels: { colors: textColor },
		},

		// plotOptions
		plotOptions: {
			// Bar
			bar: { borderRadius: 4, columnWidth: "48%", borderRadiusApplication: "end" },

			// Pie + Donut
			pie: {
				donut: { labels: { show: true, value: { ...LABEL_VALUE }, total: { ...LABEL_TOTAL } } },
			},

			// Radialbar
			radialBar: {
				hollow: { margin: -8, size: "100%" },
				track: {
					margin: -8,
					strokeWidth: "50%",
					background: rgbAlpha(themeVars.colors.palette.gray[500], 0.5),
				},
				dataLabels: {
					value: { ...LABEL_VALUE },
					total: { ...LABEL_TOTAL },
				},
			},

			// Radar
			radar: {
				polygons: {
					fill: { colors: ["transparent"] },
					strokeColors: gridColor,
					connectorColors: gridColor,
				},
			},

			// polarArea
			polarArea: {
				rings: {
					strokeColor: gridColor,
				},
				spokes: {
					connectorColors: gridColor,
				},
			},
		},

		// Responsive
		responsive: [
			{
				// sm
				breakpoint: removePx(breakpointsTokens.sm),
				options: {
					plotOptions: { bar: { columnWidth: "80%", borderRadius: 3 } },
				},
			},
			{
				// md
				breakpoint: removePx(breakpointsTokens.md),
				options: {
					plotOptions: { bar: { columnWidth: "62%" } },
				},
			},
		],
	};
};
