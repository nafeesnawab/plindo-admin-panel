import type { Customer } from "@/api/services/customerService";

export const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export const STATUS_CONFIG: Record<Customer["status"], { label: string; color: string; darkColor: string }> = {
	active: {
		label: "Active",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		darkColor: "dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
	},
	suspended: {
		label: "Suspended",
		color: "bg-red-50 text-red-700 border-red-200",
		darkColor: "dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
	},
};

export const SUBSCRIPTION_BADGE = {
	color: "bg-purple-50 text-purple-700 border-purple-200",
	darkColor: "dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
};

export interface StatCard {
	label: string;
	value: number;
	icon: "users" | "star" | "car";
	color: string;
	darkColor: string;
	iconColor: string;
	darkIconColor: string;
}

export const getStatCards = (total: number, withSubscriptions: number, vehicleCount: number): StatCard[] => [
	{
		label: "Total Customers",
		value: total,
		icon: "users",
		color: "bg-blue-50",
		darkColor: "dark:bg-blue-950/40",
		iconColor: "text-blue-600",
		darkIconColor: "dark:text-blue-400",
	},
	{
		label: "With Subscriptions",
		value: withSubscriptions,
		icon: "star",
		color: "bg-green-50",
		darkColor: "dark:bg-green-950/40",
		iconColor: "text-green-600",
		darkIconColor: "dark:text-green-400",
	},
	{
		label: "Vehicles Registered",
		value: vehicleCount,
		icon: "car",
		color: "bg-purple-50",
		darkColor: "dark:bg-purple-950/40",
		iconColor: "text-purple-600",
		darkIconColor: "dark:text-purple-400",
	},
];
