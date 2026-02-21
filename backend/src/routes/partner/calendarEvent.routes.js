import express from "express";
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from "../../controllers/partner/calendarEvent.controller.js";

const router = express.Router();

router.get("/calendar-events", getCalendarEvents);
router.post("/calendar-events", createCalendarEvent);
router.delete("/calendar-events/:id", deleteCalendarEvent);

export default router;
