import express from "express";
import {
	advanceServiceStep,
	calculatePrice,
	createSlotBooking,
	getAvailableSlots,
	getSlotBookingById,
	rescheduleBooking,
	updateBookingStatus,
} from "../controllers/slotBooking.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public / customer-facing endpoints (require auth but no role restriction)
router.get("/slots", protect, getAvailableSlots);
router.post("/calculate-price", protect, calculatePrice);
router.post("/slot", protect, createSlotBooking);
router.get("/slot/:id", protect, getSlotBookingById);
router.post("/:id/reschedule", protect, rescheduleBooking);
router.patch("/:id/status", protect, updateBookingStatus);
router.patch("/:id/step/advance", protect, advanceServiceStep);

export default router;
