import { Icon } from "@/components/icon";
import type { NavProps } from "@/components/nav";

export const partnerNavData: NavProps["data"] = [
	{
		name: "Overview",
		items: [
			{
				title: "Dashboard",
				path: "/partner/dashboard",
				icon: <Icon icon="solar:chart-2-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Orders",
		items: [
			{
				title: "Bookings",
				path: "/partner/bookings",
				icon: <Icon icon="solar:calendar-bold-duotone" size="24" />,
			},
			{
				title: "Schedule",
				path: "/partner/schedule",
				icon: <Icon icon="solar:calendar-date-bold-duotone" size="24" />,
			},
			{
				title: "Messages",
				path: "/partner/messages",
				icon: <Icon icon="solar:chat-round-dots-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Business",
		items: [
			{
				title: "Services",
				path: "/partner/services",
				icon: <Icon icon="solar:widget-5-bold-duotone" size="24" />,
			},
			{
				title: "Drivers",
				path: "/partner/drivers",
				icon: <Icon icon="solar:user-id-bold-duotone" size="24" />,
			},
			{
				title: "Customers",
				path: "/partner/customers",
				icon: <Icon icon="solar:users-group-rounded-bold-duotone" size="24" />,
			},
			{
				title: "Reviews",
				path: "/partner/reviews",
				icon: <Icon icon="solar:star-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Finance",
		items: [
			{
				title: "Earnings",
				path: "/partner/earnings",
				icon: <Icon icon="solar:wallet-money-bold-duotone" size="24" />,
			},
		],
	},
	{
		name: "Settings",
		items: [
			{
				title: "Business Profile",
				path: "/partner/profile",
				icon: <Icon icon="solar:buildings-2-bold-duotone" size="24" />,
			},
			{
				title: "Settings",
				path: "/partner/settings",
				icon: <Icon icon="solar:settings-bold-duotone" size="24" />,
			},
		],
	},
];
