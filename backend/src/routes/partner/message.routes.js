import express from "express";
import {
	getConversation,
	getConversations,
	markAsRead,
	sendMessage,
} from "../../controllers/partner/message.controller.js";

const router = express.Router();

router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversation);
router.post("/conversations/:id/send", sendMessage);
router.post("/conversations/:id/read", markAsRead);

export default router;
