import express from "express";
import {
	getCommissions,
	getPayouts,
	getRevenueByPartner,
	getRevenueOverview,
	getRevenueTrend,
	getSubscriptionRevenue,
	markPayoutPaid,
} from "../controllers/finance.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/revenue-overview", getRevenueOverview);
router.get("/revenue-trend", getRevenueTrend);
router.get("/revenue-by-partner", getRevenueByPartner);
router.get("/commissions", getCommissions);
router.get("/payouts", getPayouts);
router.post("/payouts/:id/mark-paid", markPayoutPaid);
router.get("/subscriptions", getSubscriptionRevenue);

export default router;
