import express from "express";
import {
	getNotificationDetails,
	getNotificationHistory,
	sendNotification,
} from "../controllers/notification.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.post("/send", sendNotification);
router.get("/history", getNotificationHistory);
router.get("/:id", getNotificationDetails);

export default router;
