import { setupWorker } from "msw/browser";
import { analyticsHandlers } from "./handlers/_analytics";
import { bookingHandlers } from "./handlers/_bookings";
import { carsHandlers } from "./handlers/_cars";
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
import { partnerAuthHandlers } from "./handlers/_partner-auth";
import { partnerDriversHandlers } from "./handlers/_partner-drivers";
import { partnerEarningsHandlers } from "./handlers/_partner-earnings";
import { partnerMessagesHandlers } from "./handlers/_partner-messages";
import { partnerProfileHandlers } from "./handlers/_partner-profile";
import { partnerReviewsHandlers } from "./handlers/_partner-reviews";
import { partnerScheduleHandlers } from "./handlers/_partner-schedule";
import { partnerServicesHandlers } from "./handlers/_partner-services";
import { partnerSettingsHandlers } from "./handlers/_partner-settings";
import { partnerHandlers } from "./handlers/_partners";
import { productOrderHandlers } from "./handlers/_product-orders";
import { productHandlers } from "./handlers/_products";
import { settingsHandlers } from "./handlers/_settings";
import { slotBookingHandlers } from "./handlers/_slot-bookings";
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
	...slotBookingHandlers, // Must be before bookingHandlers to match /api/bookings/slots before /api/bookings/:id
	...bookingHandlers,
	...financeHandlers,
	...notificationHandlers,
	...analyticsHandlers,
	...settingsHandlers,
	...legalHandlers,
	...supportHandlers,
	...logsHandlers,
	...partnerAuthHandlers,
	...partnerServicesHandlers,
	...partnerScheduleHandlers,
	...partnerEarningsHandlers,
	...partnerReviewsHandlers,
	...partnerMessagesHandlers,
	...partnerDriversHandlers,
	...partnerProfileHandlers,
	...partnerSettingsHandlers,
	...carsHandlers,
	...productHandlers,
	...productOrderHandlers,
];
const worker = setupWorker(...handlers);

export { worker };
