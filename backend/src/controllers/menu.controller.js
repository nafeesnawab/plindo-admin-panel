import { error, success } from "../utils/response.js";

const MENU_ITEMS = [
	{ key: "dashboard", name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
	{ key: "partners", name: "Partners", path: "/partners", icon: "Building2" },
	{ key: "customers", name: "Customers", path: "/customers", icon: "Users" },
	{ key: "bookings", name: "Bookings", path: "/bookings", icon: "Calendar" },
	{ key: "finance", name: "Finance", path: "/finance", icon: "DollarSign" },
	{ key: "analytics", name: "Analytics", path: "/analytics", icon: "BarChart3" },
	{ key: "support", name: "Support", path: "/support", icon: "HeadphonesIcon" },
	{ key: "settings", name: "Settings", path: "/settings", icon: "Settings" },
	{ key: "legal", name: "Legal", path: "/legal", icon: "FileText" },
	{ key: "logs", name: "Logs", path: "/logs", icon: "ScrollText" },
];

/**
 * GET /api/menu
 */
export const getMenu = async (req, res) => {
	try {
		return success(res, { menu: MENU_ITEMS });
	} catch (err) {
		return error(res, err.message, 500);
	}
};
