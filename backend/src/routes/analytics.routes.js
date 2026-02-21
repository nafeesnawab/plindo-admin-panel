import express from "express";
import {
	getBookingAnalytics,
	getPartnerAnalytics,
	getSubscriptionAnalytics,
	getUserAnalytics,
} from "../controllers/analytics.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", getUserAnalytics);
router.get("/bookings", getBookingAnalytics);
router.get("/partners", getPartnerAnalytics);
router.get("/subscriptions", getSubscriptionAnalytics);

export default router;
