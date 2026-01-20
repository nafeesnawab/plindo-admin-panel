import { setupWorker } from "msw/browser";
import { analyticsHandlers } from "./handlers/_analytics";
import { bookingHandlers } from "./handlers/_bookings";
import { customerHandlers } from "./handlers/_customers";
import {
	getBookingsTrend,
	getDashboardStats,
	getRecentBookings,
	getRecentPartnerApplications,
	getRecentUsers,
	getRevenueTrend,
	getUserGrowth,
} from "./handlers/_dashboard";
import { mockTokenExpired } from "./handlers/_demo";
import { financeHandlers } from "./handlers/_finance";
import { legalHandlers } from "./handlers/_legal";
import { logsHandlers } from "./handlers/_logs";
import { menuList } from "./handlers/_menu";
import { notificationHandlers } from "./handlers/_notifications";
import { partnerHandlers } from "./handlers/_partners";
import { settingsHandlers } from "./handlers/_settings";
import { supportHandlers } from "./handlers/_support";
import { signIn, userList } from "./handlers/_user";

const handlers = [
	signIn,
	userList,
	mockTokenExpired,
	menuList,
	getDashboardStats,
	getBookingsTrend,
	getRevenueTrend,
	getUserGrowth,
	getRecentBookings,
	getRecentPartnerApplications,
	getRecentUsers,
	...partnerHandlers,
	...customerHandlers,
	...bookingHandlers,
	...financeHandlers,
	...notificationHandlers,
	...analyticsHandlers,
	...settingsHandlers,
	...legalHandlers,
	...supportHandlers,
	...logsHandlers,
];
const worker = setupWorker(...handlers);

export { worker };
