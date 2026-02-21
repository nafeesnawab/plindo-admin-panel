import express from "express";
import {
	getBookingsTimeline,
	getCapacity,
	getPartnerBookings,
	getWeeklyAvailability,
	updateCapacity,
	updateWeeklyAvailability,
} from "../../controllers/partner/schedule.controller.js";

const router = express.Router();

router.get("/availability/weekly", getWeeklyAvailability);
router.put("/availability/weekly", updateWeeklyAvailability);
router.get("/capacity", getCapacity);
router.put("/capacity", updateCapacity);
router.get("/bookings/timeline", getBookingsTimeline);
router.get("/bookings", getPartnerBookings);

export default router;
