import Conversation from "../../models/Conversation.model.js";
import Customer from "../../models/Customer.model.js";
import Message from "../../models/Message.model.js";
import Partner from "../../models/Partner.model.js";
import { paginate, paginatedResponse } from "../../utils/pagination.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/mobile/conversations
 * List customer's conversations
 */
export const getConversations = async (req, res) => {
	try {
		const customerId = req.user.id;

		const conversations = await Conversation.find({ customerId })
			.sort({ lastMessageAt: -1 })
			.lean();

		// Get partner details
		const partnerIds = conversations.map((c) => c.partnerId);
		const partners = await Partner.find({ _id: { $in: partnerIds } })
			.select("businessName logo")
			.lean();

		const partnerMap = {};
		partners.forEach((p) => {
			partnerMap[p._id.toString()] = p;
		});

		const items = conversations.map((c) => {
			const partner = partnerMap[c.partnerId.toString()];
			return {
				id: c._id,
				partnerId: c.partnerId,
				partnerName: partner?.businessName || "Partner",
				partnerLogo: partner?.logo || "",
				lastMessage: c.lastMessage,
				lastMessageTime: c.lastMessageAt,
				unreadCount: c.unreadCount || 0,
			};
		});

		return success(res, { conversations: items });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/conversations/:id/messages
 * Get messages in a conversation
 */
export const getMessages = async (req, res) => {
	try {
		const { id } = req.params;
		const customerId = req.user.id;
		const { page, limit, skip } = paginate(req.query);

		const conversation = await Conversation.findOne({
			_id: id,
			customerId,
		});

		if (!conversation) {
			return error(res, "Conversation not found", 404);
		}

		const [messages, total] = await Promise.all([
			Message.find({ conversationId: id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Message.countDocuments({ conversationId: id }),
		]);

		// Mark unread messages as read
		await Message.updateMany(
			{ conversationId: id, senderId: { $ne: customerId.toString() }, read: false },
			{ read: true }
		);
		await Conversation.findByIdAndUpdate(id, { unreadCount: 0 });

		const items = messages.reverse().map((m) => ({
			id: m._id,
			senderId: m.senderId,
			isFromCustomer: m.senderId === customerId.toString(),
			text: m.text,
			read: m.read,
			createdAt: m.createdAt,
		}));

		return success(res, paginatedResponse(items, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/conversations/:partnerId/start
 * Start or get existing conversation with a partner
 */
export const startConversation = async (req, res) => {
	try {
		const { partnerId } = req.params;
		const customerId = req.user.id;

		// Check if conversation exists
		let conversation = await Conversation.findOne({
			partnerId,
			customerId,
		});

		if (conversation) {
			return success(res, {
				conversation: {
					id: conversation._id,
					isNew: false,
				},
			});
		}

		// Get customer details
		const customer = await Customer.findById(customerId).select("name");
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		// Get partner details
		const partner = await Partner.findById(partnerId).select("businessName");
		if (!partner) {
			return error(res, "Partner not found", 404);
		}

		// Create new conversation
		conversation = await Conversation.create({
			partnerId,
			customerId,
			customerName: customer.name || "Customer",
			lastMessage: "",
			lastMessageAt: new Date(),
			unreadCount: 0,
		});

		return success(
			res,
			{
				conversation: {
					id: conversation._id,
					partnerId,
					partnerName: partner.businessName,
					isNew: true,
				},
			},
			"Conversation started",
			201
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/conversations/:id/messages
 * Send a message (REST fallback, Socket.IO preferred)
 */
export const sendMessage = async (req, res) => {
	try {
		const { id } = req.params;
		const { text } = req.body;
		const customerId = req.user.id;

		if (!text?.trim()) {
			return error(res, "Message text is required", 400);
		}

		const conversation = await Conversation.findOne({
			_id: id,
			customerId,
		});

		if (!conversation) {
			return error(res, "Conversation not found", 404);
		}

		const message = await Message.create({
			conversationId: id,
			senderId: customerId.toString(),
			text: text.trim(),
		});

		const now = new Date();
		await Conversation.findByIdAndUpdate(id, {
			lastMessage: text.trim(),
			lastMessageTime: now.toISOString(),
			lastMessageAt: now,
		});

		return success(
			res,
			{
				message: {
					id: message._id,
					senderId: message.senderId,
					isFromCustomer: true,
					text: message.text,
					createdAt: message.createdAt,
				},
			},
			"Message sent"
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
