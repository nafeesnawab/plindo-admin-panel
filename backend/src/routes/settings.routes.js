import express from "express";
import {
	getBookingRules,
	getCommission,
	getNotificationSettings,
	getNotificationTemplates,
	getPaymentSettings,
	getSubscriptionPlans,
	updateBookingRules,
	updateCommission,
	updateNotificationSettings,
	updateNotificationTemplate,
	updatePaymentSettings,
	updateSubscriptionPlans,
} from "../controllers/settings.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/commission", getCommission);
router.put("/commission", updateCommission);
router.get("/booking-rules", getBookingRules);
router.put("/booking-rules", updateBookingRules);
router.get("/subscription-plans", getSubscriptionPlans);
router.put("/subscription-plans", updateSubscriptionPlans);
router.get("/payment", getPaymentSettings);
router.put("/payment", updatePaymentSettings);
router.get("/notifications", getNotificationSettings);
router.put("/notifications", updateNotificationSettings);
router.get("/notification-templates", getNotificationTemplates);
router.put("/notification-templates/:id", updateNotificationTemplate);

export default router;
