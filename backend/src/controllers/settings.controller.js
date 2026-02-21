import Settings from "../models/Settings.model.js";
import { error, success } from "../utils/response.js";

/**
 * GET /api/settings/commission
 */
export const getCommission = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		return success(res, { ...settings.commission.toObject(), updatedAt: settings.updatedAt });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/settings/commission
 */
export const updateCommission = async (req, res) => {
	try {
		const settings = await Settings.findOneAndUpdate(
			{ key: "platform_settings" },
			{ $set: { commission: { ...req.body } } },
			{ new: true, upsert: true },
		);
		return success(res, { ...settings.commission.toObject(), updatedAt: settings.updatedAt }, "Commission settings updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/settings/booking-rules
 */
export const getBookingRules = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		return success(res, { ...settings.bookingRules.toObject(), updatedAt: settings.updatedAt });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/settings/booking-rules
 */
export const updateBookingRules = async (req, res) => {
	try {
		const settings = await Settings.findOneAndUpdate(
			{ key: "platform_settings" },
			{ $set: { bookingRules: { ...req.body } } },
			{ new: true, upsert: true },
		);
		return success(res, { ...settings.bookingRules.toObject(), updatedAt: settings.updatedAt }, "Booking rules updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/settings/subscription-plans
 */
export const getSubscriptionPlans = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		const plans = settings.subscriptionPlans.toObject();
		return success(res, {
			basic: { id: "basic", name: "Basic", ...plans.basic },
			premium: { id: "premium", name: "Premium", ...plans.premium },
			updatedAt: settings.updatedAt,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/settings/subscription-plans
 */
export const updateSubscriptionPlans = async (req, res) => {
	try {
		const settings = await Settings.findOneAndUpdate(
			{ key: "platform_settings" },
			{ $set: { subscriptionPlans: req.body } },
			{ new: true, upsert: true },
		);
		return success(res, { ...settings.subscriptionPlans.toObject(), updatedAt: settings.updatedAt }, "Subscription plans updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/settings/payment
 */
export const getPaymentSettings = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		return success(res, { ...settings.payment.toObject(), updatedAt: settings.updatedAt });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/settings/payment
 */
export const updatePaymentSettings = async (req, res) => {
	try {
		const settings = await Settings.findOneAndUpdate(
			{ key: "platform_settings" },
			{ $set: { payment: { ...req.body } } },
			{ new: true, upsert: true },
		);
		return success(res, { ...settings.payment.toObject(), updatedAt: settings.updatedAt }, "Payment settings updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/settings/notifications
 */
export const getNotificationSettings = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		return success(res, {
			types: settings.notifications.toObject(),
			updatedAt: settings.updatedAt,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/settings/notifications
 */
export const updateNotificationSettings = async (req, res) => {
	try {
		const settings = await Settings.findOneAndUpdate(
			{ key: "platform_settings" },
			{ $set: { notifications: req.body.types || req.body } },
			{ new: true, upsert: true },
		);
		return success(res, { types: settings.notifications.toObject(), updatedAt: settings.updatedAt }, "Notification settings updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/settings/notification-templates
 */
export const getNotificationTemplates = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		return success(res, settings.notificationTemplates);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/settings/notification-templates/:id
 */
export const updateNotificationTemplate = async (req, res) => {
	try {
		const { id } = req.params;
		const { subject, body } = req.body;
		const settings = await Settings.findOne({ key: "platform_settings" });
		if (!settings) return error(res, "Settings not found", 404);

		const tpl = settings.notificationTemplates.find((t) => t.id === id);
		if (!tpl) return error(res, "Template not found", 404);

		tpl.subject = subject;
		tpl.body = body;
		await settings.save();

		return success(res, tpl, "Template updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
