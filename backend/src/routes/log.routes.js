import express from "express";
import {
	getActivityLogs,
	getApiErrors,
	getPaymentFailures,
	getSystemErrors,
} from "../controllers/log.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/activity", getActivityLogs);
router.get("/errors", getSystemErrors);
router.get("/payments", getPaymentFailures);
router.get("/api", getApiErrors);

export default router;
