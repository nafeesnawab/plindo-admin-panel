import express from "express";
import {
	assignTicket,
	closeTicket,
	getTicketDetails,
	getTickets,
	replyToTicket,
} from "../controllers/support.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/tickets", getTickets);
router.get("/tickets/:id", getTicketDetails);
router.post("/tickets/:id/reply", replyToTicket);
router.post("/tickets/:id/assign", assignTicket);
router.post("/tickets/:id/close", closeTicket);

export default router;
