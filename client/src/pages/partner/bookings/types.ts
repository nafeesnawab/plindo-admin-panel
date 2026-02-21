import type { BookingStatus, ServiceCategory } from "@/types/booking";

export const STATUS_CONFIG: Record<
	BookingStatus,
	{
		label: string;
		color: string;
		darkColor: string;
		bgColor: string;
		darkBgColor: string;
		borderColor: string;
		darkBorderColor: string;
	}
> = {
	booked: {
		label: "Booked",
		color: "text-blue-700",
		darkColor: "dark:text-blue-300",
		bgColor: "bg-blue-50",
		darkBgColor: "dark:bg-blue-950/40",
		borderColor: "border-blue-300",
		darkBorderColor: "dark:border-blue-800",
	},
	in_progress: {
		label: "In Progress",
		color: "text-purple-700",
		darkColor: "dark:text-purple-300",
		bgColor: "bg-purple-50",
		darkBgColor: "dark:bg-purple-950/40",
		borderColor: "border-purple-400",
		darkBorderColor: "dark:border-purple-800",
	},
	completed: {
		label: "Completed",
		color: "text-green-700",
		darkColor: "dark:text-green-300",
		bgColor: "bg-green-50",
		darkBgColor: "dark:bg-green-950/40",
		borderColor: "border-green-300",
		darkBorderColor: "dark:border-green-800",
	},
	picked: {
		label: "Picked",
		color: "text-indigo-700",
		darkColor: "dark:text-indigo-300",
		bgColor: "bg-indigo-50",
		darkBgColor: "dark:bg-indigo-950/40",
		borderColor: "border-indigo-300",
		darkBorderColor: "dark:border-indigo-800",
	},
	out_for_delivery: {
		label: "Out for Delivery",
		color: "text-amber-700",
		darkColor: "dark:text-amber-300",
		bgColor: "bg-amber-50",
		darkBgColor: "dark:bg-amber-950/40",
		borderColor: "border-amber-300",
		darkBorderColor: "dark:border-amber-800",
	},
	delivered: {
		label: "Delivered",
		color: "text-teal-700",
		darkColor: "dark:text-teal-300",
		bgColor: "bg-teal-50",
		darkBgColor: "dark:bg-teal-950/40",
		borderColor: "border-teal-300",
		darkBorderColor: "dark:border-teal-800",
	},
	cancelled: {
		label: "Cancelled",
		color: "text-red-700",
		darkColor: "dark:text-red-300",
		bgColor: "bg-red-50",
		darkBgColor: "dark:bg-red-950/40",
		borderColor: "border-red-300",
		darkBorderColor: "dark:border-red-800",
	},
	rescheduled: {
		label: "Rescheduled",
		color: "text-orange-700",
		darkColor: "dark:text-orange-300",
		bgColor: "bg-orange-50",
		darkBgColor: "dark:bg-orange-950/40",
		borderColor: "border-orange-300",
		darkBorderColor: "dark:border-orange-800",
	},
};

export const CATEGORY_BORDER: Record<ServiceCategory, string> = {
	wash: "border-l-blue-500",
	detailing: "border-l-purple-500",
	other: "border-l-gray-500",
};

export const CATEGORY_BG: Record<ServiceCategory, string> = {
	wash: "bg-blue-50 dark:bg-blue-950/30",
	detailing: "bg-purple-50 dark:bg-purple-950/30",
	other: "bg-gray-50 dark:bg-gray-800/30",
};

// Hex colors for IlamyCalendar events
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
	booked: { bg: "#3b82f6", text: "#ffffff" },
	in_progress: { bg: "#8b5cf6", text: "#ffffff" },
	completed: { bg: "#22c55e", text: "#ffffff" },
	picked: { bg: "#6366f1", text: "#ffffff" },
	out_for_delivery: { bg: "#f59e0b", text: "#ffffff" },
	delivered: { bg: "#14b8a6", text: "#ffffff" },
	cancelled: { bg: "#ef4444", text: "#ffffff" },
	rescheduled: { bg: "#f97316", text: "#ffffff" },
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
	wash: { bg: "#3b82f6", text: "#ffffff" },
	detailing: { bg: "#8b5cf6", text: "#ffffff" },
	other: { bg: "#6b7280", text: "#ffffff" },
};
