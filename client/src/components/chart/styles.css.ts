import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "@/theme/theme.css";
import { rgbAlpha } from "@/utils/theme";

export const chartWrapper = style(
	{
		cursor: "pointer",
	},
	"apexcharts-wrapper",
);

// TOOLTIP
globalStyle(`${chartWrapper} .apexcharts-tooltip`, {
	color: themeVars.colors.text.primary,
	borderRadius: themeVars.borderRadius.lg,
	backdropFilter: "blur(6px)",
	backgroundColor: rgbAlpha(themeVars.colors.background.paperChannel, 0.8),
	boxShadow: themeVars.shadows.card,
	border: "1px solid",
	borderColor: themeVars.colors.background.neutral,
});

globalStyle(`${chartWrapper} .apexcharts-tooltip-title`, {
	textAlign: "center",
	fontWeight: "bold",
	backgroundColor: themeVars.colors.background.neutral,
	color: themeVars.colors.text.primary,
	borderBottom: "1px solid",
	borderBottomColor: themeVars.colors.background.neutral,
});

// TOOLTIP X
globalStyle(`${chartWrapper} .apexcharts-xaxistooltip`, {
	color: themeVars.colors.text.primary,
	borderRadius: themeVars.borderRadius.lg,
	backdropFilter: "blur(6px)",
	borderColor: "transparent",
	boxShadow: themeVars.shadows.card,
	backgroundColor: themeVars.colors.background.paper,
});

globalStyle(`${chartWrapper} .apexcharts-xaxistooltip::before`, {
	borderBottomColor: rgbAlpha(themeVars.colors.background.paperChannel, 0.8),
});

globalStyle(`${chartWrapper} .apexcharts-xaxistooltip::after`, {
	borderBottomColor: themeVars.colors.background.paper,
});

// LEGEND
globalStyle(`${chartWrapper} .apexcharts-legend`, {
	padding: 0,
});

globalStyle(`${chartWrapper} .apexcharts-legend-series`, {
	display: "inline-flex !important",
	alignItems: "center",
});

globalStyle(`${chartWrapper} .apexcharts-legend-text`, {
	lineHeight: "18px",
	textTransform: "capitalize",
	color: themeVars.colors.text.primary,
});

// DARK MODE TOOLTIP
globalStyle(`${chartWrapper} .apexcharts-tooltip-dark`, {
	color: "#ffffff",
	backgroundColor: rgbAlpha("18 18 18", 0.9),
});

globalStyle(`${chartWrapper} .apexcharts-tooltip-dark .apexcharts-tooltip-title`, {
	backgroundColor: rgbAlpha("39 39 42", 0.9),
	borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
});
