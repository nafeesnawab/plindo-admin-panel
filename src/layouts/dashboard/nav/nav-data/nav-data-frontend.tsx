import { Icon } from "@/components/icon";
import type { NavProps } from "@/components/nav";

export const frontendNavData: NavProps["data"] = [
	{
		name: "Overview",
		items: [
			{
				title: "Dashboard",
				path: "/dashboard",
				icon: <Icon icon="solar:chart-2-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Management",
		items: [
			{
				title: "Partner Management",
				path: "/partners",
				icon: <Icon icon="solar:users-group-two-rounded-bold-duotone" size="24" />,
			},
			{
				title: "User Management",
				path: "/customers",
				icon: <Icon icon="solar:user-rounded-bold-duotone" size="24" />,
			},
			{
				title: "Cars Management",
				path: "/cars",
				icon: <Icon icon="mdi:car" size="24" />,
			},
			{
				title: "Booking Management",
				path: "/bookings",
				icon: <Icon icon="solar:calendar-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Finance",
		items: [
			{
				title: "Financial Reports",
				path: "/finance",
				icon: <Icon icon="solar:wallet-money-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Configuration",
		items: [
			{
				title: "Platform Settings",
				path: "/settings",
				icon: <Icon icon="solar:settings-bold-duotone" size="24" />,
			},
			{
				title: "Legal Pages",
				path: "/legal",
				icon: <Icon icon="solar:document-text-bold-duotone" size="24" />,
				children: [
					{
						title: "Terms & Conditions",
						path: "/legal/terms",
					},
					{
						title: "Privacy Policy",
						path: "/legal/privacy",
					},
					{
						title: "Refund Policy",
						path: "/legal/refund",
					},
					{
						title: "About Us",
						path: "/legal/about",
					},
					{
						title: "FAQ Management",
						path: "/legal/faqs",
					},
				],
			},
			{
				title: "System Logs",
				path: "/system-logs",
				icon: <Icon icon="solar:server-bold-duotone" size="24" />,
			},
		],
	},
];
