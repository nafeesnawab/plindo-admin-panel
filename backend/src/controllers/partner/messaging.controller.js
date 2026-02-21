import Conversation from "../../models/Conversation.model.js";
import Message from "../../models/Message.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/conversations
 * List all conversations for this partner
 */
export const getConversations = async (req, res) => {
	try {
		const conversations = await Conversation.find({ partnerId: req.user.partnerId })
			.sort({ lastMessageAt: -1 })
			.lean();
		return success(res, { conversations });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/conversations/:conversationId/messages
 */
export const getMessages = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const conv = await Conversation.findOne({
			_id: conversationId,
			partnerId: req.user.partnerId,
		});
		if (!conv) return error(res, "Conversation not found", 404);

		const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();

		// Mark unread messages as read
		await Message.updateMany(
			{ conversationId, senderId: { $ne: String(req.user.partnerId) }, read: false },
			{ read: true },
		);
		await Conversation.findByIdAndUpdate(conversationId, { unreadCount: 0 });

		return success(res, { messages });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/conversations/:conversationId/messages
 * Send a message (REST fallback; socket is preferred)
 */
export const sendMessage = async (req, res) => {
	try {
		const { conversationId } = req.params;
		const { text } = req.body;
		if (!text?.trim()) return error(res, "Message text is required", 400);

		const conv = await Conversation.findOne({
			_id: conversationId,
			partnerId: req.user.partnerId,
		});
		if (!conv) return error(res, "Conversation not found", 404);

		const message = await Message.create({
			conversationId,
			senderId: String(req.user.partnerId),
			text: text.trim(),
		});

		const now = new Date().toISOString();
		await Conversation.findByIdAndUpdate(conversationId, {
			lastMessage: text.trim(),
			lastMessageTime: now,
			lastMessageAt: now,
		});

		return success(res, { message }, "Message sent");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
