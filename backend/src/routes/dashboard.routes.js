import express from "express";
import {
	getBookingsTrend,
	getRecentBookings,
	getRecentPartnerApplications,
	getRecentUsers,
	getRevenueTrend,
	getStats,
	getUserGrowth,
} from "../controllers/dashboard.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/bookings-trend", getBookingsTrend);
router.get("/revenue-trend", getRevenueTrend);
router.get("/user-growth", getUserGrowth);
router.get("/recent-bookings", getRecentBookings);
router.get("/recent-partner-applications", getRecentPartnerApplications);
router.get("/recent-users", getRecentUsers);

export default router;
