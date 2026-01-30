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
				children: [
					{
						title: "Pending Applications",
						path: "/partners/pending",
					},
					{
						title: "Active Partners",
						path: "/partners/active",
					},
					{
						title: "Suspended Partners",
						path: "/partners/suspended",
					},
				],
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
				children: [
					{
						title: "All Bookings",
						path: "/bookings",
					},
					{
						title: "Disputes",
						path: "/bookings/disputes",
					},
				],
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
				children: [
					{
						title: "Revenue Overview",
						path: "/finance",
					},
					{
						title: "Commissions",
						path: "/finance/commissions",
					},
					{
						title: "Payouts",
						path: "/finance/payouts",
					},
					{
						title: "Subscriptions",
						path: "/finance/subscriptions",
					},
				],
			},
		],
	},
	{
		name: "Communications",
		items: [
			{
				title: "Notifications",
				path: "/notifications",
				icon: <Icon icon="solar:bell-bold-duotone" size="24" />,
				children: [
					{
						title: "Send Notification",
						path: "/notifications/send",
					},
					{
						title: "History",
						path: "/notifications/history",
					},
				],
			},
		],
	},
	{
		name: "Insights",
		items: [
			{
				title: "Analytics",
				path: "/analytics",
				icon: <Icon icon="solar:graph-up-bold-duotone" size="24" />,
				children: [
					{
						title: "User Analytics",
						path: "/analytics/users",
					},
					{
						title: "Booking Analytics",
						path: "/analytics/bookings",
					},
					{
						title: "Partner Analytics",
						path: "/analytics/partners",
					},
					{
						title: "Subscription Analytics",
						path: "/analytics/subscriptions",
					},
				],
			},
		],
	},
	{
		name: "Support",
		items: [
			{
				title: "Support Tickets",
				path: "/support/tickets",
				icon: <Icon icon="solar:chat-round-dots-bold-duotone" size="24" />,
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
				children: [
					{
						title: "Commission",
						path: "/settings/commission",
					},
					{
						title: "Booking Rules",
						path: "/settings/booking-rules",
					},
					{
						title: "Subscription Plans",
						path: "/settings/subscription-plans",
					},
					{
						title: "Payment",
						path: "/settings/payment",
					},
					{
						title: "Notifications",
						path: "/settings/notifications",
					},
				],
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
