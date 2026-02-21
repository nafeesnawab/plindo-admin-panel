import express from "express";
import { getAdminBookings } from "../controllers/slotBooking.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/admin/bookings
router.get("/", protect, authorize("admin"), getAdminBookings);

export default router;
