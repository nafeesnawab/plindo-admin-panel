import express from "express";
import { getSubscriptionPlans } from "../controllers/slotBooking.controller.js";

const router = express.Router();

// GET /api/subscriptions/plans
router.get("/plans", getSubscriptionPlans);

export default router;
