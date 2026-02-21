import express from "express";
import { getPublicServices } from "../controllers/slotBooking.controller.js";

const router = express.Router();

// GET /api/services — public service list (no auth required for customer booking flow)
router.get("/", getPublicServices);

export default router;
