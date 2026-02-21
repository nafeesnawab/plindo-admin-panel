import Notification from "../models/Notification.model.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

const formatNotification = (n) => ({
	id: n._id,
	title: n.title,
	body: n.body,
	recipientType: n.recipientType,
	recipientName: n.recipientName,
	notificationType: n.notificationType,
	scheduledAt: n.scheduledAt,
	sentAt: n.sentAt,
	status: n.status,
	stats: n.stats || {
		sentCount: 0,
		deliveredCount: 0,
		openedCount: 0,
		failedCount: 0,
		openRate: 0,
		deliveryRate: 0,
	},
});

/**
 * POST /api/notifications/send
 */
export const sendNotification = async (req, res) => {
	try {
		const { title, body, recipientType, recipientId, notificationType, scheduledAt } = req.body;

		if (!title || !body || !recipientType) {
			return error(res, "title, body, and recipientType are required", 400);
		}

		const sentCount = recipientType === "specific_user" ? 1 : 100;
		const deliveredCount = Math.floor(sentCount * 0.95);
		const openedCount = Math.floor(deliveredCount * 0.25);

		const notification = await Notification.create({
			title,
			body,
			recipientType,
			recipientId,
			recipientName: recipientType === "specific_user" ? recipientId : null,
			notificationType: notificationType || "push",
			scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
			sentAt: new Date(),
			status: "sent",
			sentBy: req.user.id,
			stats: {
				sentCount,
				deliveredCount,
				openedCount,
				failedCount: sentCount - deliveredCount,
				openRate: +((openedCount / deliveredCount) * 100).toFixed(1),
				deliveryRate: +((deliveredCount / sentCount) * 100).toFixed(1),
			},
		});

		return success(res, formatNotification(notification), "Notification sent successfully", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/notifications/history
 */
export const getNotificationHistory = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = {};

		if (req.query.recipientType && req.query.recipientType !== "all") {
			filter.recipientType = req.query.recipientType;
		}

		const [items, total] = await Promise.all([
			Notification.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit),
			Notification.countDocuments(filter),
		]);

		return success(res, paginatedResponse(items.map(formatNotification), total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/notifications/:id
 */
export const getNotificationDetails = async (req, res) => {
	try {
		const notification = await Notification.findById(req.params.id);
		if (!notification) return error(res, "Notification not found", 404);
		return success(res, formatNotification(notification));
	} catch (err) {
		return error(res, err.message, 500);
	}
};
