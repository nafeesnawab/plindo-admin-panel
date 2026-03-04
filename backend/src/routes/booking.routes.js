import express from "express";
import {
	cancelBooking,
	getBookingDetails,
	getBookings,
	getDisputes,
	issueRefund,
	resolveDispute,
} from "../controllers/booking.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/disputes", authorize("admin"), getDisputes);
router.get("/", authorize("admin"), getBookings);
router.get("/:id", authorize("admin", "partner"), getBookingDetails);
router.post("/:id/cancel", authorize("admin", "partner"), cancelBooking);
router.post("/:id/refund", authorize("admin"), issueRefund);
router.post("/:id/resolve-dispute", authorize("admin"), resolveDispute);

export default router;
