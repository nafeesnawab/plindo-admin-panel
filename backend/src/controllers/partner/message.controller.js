import Conversation from "../../models/Conversation.model.js";
import Message from "../../models/Message.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/messages/conversations
 */
export const getConversations = async (req, res) => {
	try {
		const filter = { partnerId: req.user.partnerId };
		if (req.query.search) {
			filter.customerName = { $regex: req.query.search, $options: "i" };
		}

		const convs = await Conversation.find(filter).sort({ lastMessageAt: -1 });
		const conversations = await Promise.all(
			convs.map(async (c) => {
				const lastMsg = await Message.findOne({ conversationId: c._id }).sort({ createdAt: -1 });
				const unread = await Message.countDocuments({ conversationId: c._id, senderId: { $ne: "partner" }, read: false });
				return {
					id: c._id,
					customerId: c.customerId,
					customerName: c.customerName,
					lastMessage: lastMsg?.text || "",
					lastMessageTime: lastMsg ? lastMsg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
					unreadCount: unread,
					messages: [],
				};
			}),
		);

		return success(res, { conversations });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/messages/conversations/:id
 */
export const getConversation = async (req, res) => {
	try {
		const conv = await Conversation.findOne({ _id: req.params.id, partnerId: req.user.partnerId });
		if (!conv) return error(res, "Conversation not found", 404);

		const msgs = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 });
		const unread = await Message.countDocuments({ conversationId: conv._id, senderId: { $ne: "partner" }, read: false });

		return success(res, {
			conversation: {
				id: conv._id,
				customerId: conv.customerId,
				customerName: conv.customerName,
				lastMessage: msgs[msgs.length - 1]?.text || "",
				lastMessageTime: msgs[msgs.length - 1]?.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "",
				unreadCount: unread,
				messages: msgs.map((m) => ({
					id: m._id,
					senderId: m.senderId,
					text: m.text,
					timestamp: m.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
					read: m.read,
				})),
			},
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/messages/conversations/:id/send
 */
export const sendMessage = async (req, res) => {
	try {
		const conv = await Conversation.findOne({ _id: req.params.id, partnerId: req.user.partnerId });
		if (!conv) return error(res, "Conversation not found", 404);

		const msg = await Message.create({
			conversationId: conv._id,
			senderId: "partner",
			text: req.body.text,
			read: false,
		});

		conv.lastMessageAt = new Date();
		await conv.save();

		return success(res, {
			message: {
				id: msg._id,
				senderId: msg.senderId,
				text: msg.text,
				timestamp: msg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				read: msg.read,
			},
		}, "Message sent");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/messages/conversations/:id/read
 */
export const markAsRead = async (req, res) => {
	try {
		const conv = await Conversation.findOne({ _id: req.params.id, partnerId: req.user.partnerId });
		if (!conv) return error(res, "Conversation not found", 404);

		await Message.updateMany(
			{ conversationId: conv._id, senderId: { $ne: "partner" } },
			{ read: true },
		);

		return success(res, {}, "Marked as read");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
