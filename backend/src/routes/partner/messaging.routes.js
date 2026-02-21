import express from "express";
import { getConversations, getMessages, sendMessage } from "../../controllers/partner/messaging.controller.js";

const router = express.Router();

router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);

export default router;
