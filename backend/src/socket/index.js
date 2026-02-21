import jwt from "jsonwebtoken";
import Conversation from "../models/Conversation.model.js";
import Message from "../models/Message.model.js";

/**
 * Attach Socket.IO logic to the io instance.
 * Each conversation is a Socket.IO room named after its MongoDB _id.
 *
 * Events (client → server):
 *   join_conversation   { conversationId }
 *   send_message        { conversationId, text }
 *   mark_read           { conversationId }
 *
 * Events (server → client):
 *   new_message         <Message document>
 *   messages_read       { conversationId }
 *   error               { message }
 */
export function initSocket(io) {
	// Authenticate every socket connection with the partner/customer JWT
	io.use((socket, next) => {
		const token = socket.handshake.auth?.token || socket.handshake.query?.token;
		if (!token) return next(new Error("Authentication required"));
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			socket.user = decoded; // { id, role, partnerId? }
			next();
		} catch {
			next(new Error("Invalid token"));
		}
	});

	io.on("connection", (socket) => {
		const { user } = socket;

		socket.on("join_conversation", async ({ conversationId }) => {
			try {
				// Validate access
				const filter =
					user.role === "partner"
						? { _id: conversationId, partnerId: user.partnerId }
						: { _id: conversationId, customerId: user.id };

				const conv = await Conversation.findOne(filter);
				if (!conv) {
					socket.emit("error", { message: "Conversation not found or access denied" });
					return;
				}
				socket.join(conversationId);
			} catch {
				socket.emit("error", { message: "Failed to join conversation" });
			}
		});

		socket.on("send_message", async ({ conversationId, text }) => {
			if (!text?.trim()) return;
			try {
				const senderId =
					user.role === "partner" ? String(user.partnerId) : String(user.id);

				const message = await Message.create({
					conversationId,
					senderId,
					text: text.trim(),
				});

				const now = new Date().toISOString();
				await Conversation.findByIdAndUpdate(conversationId, {
					lastMessage: text.trim(),
					lastMessageTime: now,
					lastMessageAt: now,
					$inc: { unreadCount: 1 },
				});

				// Emit to everyone in the room (including sender for confirmation)
				io.to(conversationId).emit("new_message", message);
			} catch {
				socket.emit("error", { message: "Failed to send message" });
			}
		});

		socket.on("mark_read", async ({ conversationId }) => {
			try {
				const readerId =
					user.role === "partner" ? String(user.partnerId) : String(user.id);

				await Message.updateMany(
					{ conversationId, senderId: { $ne: readerId }, read: false },
					{ read: true },
				);
				await Conversation.findByIdAndUpdate(conversationId, { unreadCount: 0 });
				io.to(conversationId).emit("messages_read", { conversationId });
			} catch {
				socket.emit("error", { message: "Failed to mark messages as read" });
			}
		});
	});
}
