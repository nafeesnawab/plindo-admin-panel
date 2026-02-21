import Partner from "../../models/Partner.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/settings
 */
export const getSettings = async (req, res) => {
	try {
		const partner = await Partner.findById(req.user.partnerId).select("email phone notificationSettings");
		if (!partner) return error(res, "Partner not found", 404);

		return success(res, {
			settings: {
				account: {
					email: partner.email,
					phone: partner.phone || "",
				},
				notifications: partner.notificationSettings || {
					newBooking: true,
					newReview: true,
					customerMessage: true,
				},
			},
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/partner/settings
 */
export const updateSettings = async (req, res) => {
	try {
		const updates = {};
		if (req.body.account?.phone) updates.phone = req.body.account.phone;
		if (req.body.notifications) updates.notificationSettings = req.body.notifications;

		const partner = await Partner.findByIdAndUpdate(req.user.partnerId, updates, { new: true }).select(
			"email phone notificationSettings",
		);
		if (!partner) return error(res, "Partner not found", 404);

		return success(res, {
			settings: {
				account: { email: partner.email, phone: partner.phone || "" },
				notifications: partner.notificationSettings || { newBooking: true, newReview: true, customerMessage: true },
			},
		}, "Settings updated successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/settings/password
 */
export const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return error(res, "Current and new password are required", 400);
		}
		if (newPassword.length < 8) {
			return error(res, "Password must be at least 8 characters", 400, 10003);
		}

		const partner = await Partner.findById(req.user.partnerId).select("+password");
		if (!partner) return error(res, "Partner not found", 404);

		const isMatch = await partner.comparePassword(currentPassword);
		if (!isMatch) return error(res, "Current password is incorrect", 400, 10002);

		partner.password = newPassword;
		await partner.save();

		return success(res, {}, "Password changed successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
