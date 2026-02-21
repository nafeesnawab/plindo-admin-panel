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

router.use(protect, authorize("admin"));

router.get("/disputes", getDisputes);
router.get("/", getBookings);
router.get("/:id", getBookingDetails);
router.post("/:id/cancel", cancelBooking);
router.post("/:id/refund", issueRefund);
router.post("/:id/resolve-dispute", resolveDispute);

export default router;
