import Driver from "../../models/Driver.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/drivers
 */
export const getDrivers = async (req, res) => {
	try {
		const filter = { partnerId: req.user.partnerId };
		if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
		if (req.query.search) {
			filter.$or = [
				{ fullName: { $regex: req.query.search, $options: "i" } },
				{ email: { $regex: req.query.search, $options: "i" } },
				{ phone: { $regex: req.query.search, $options: "i" } },
				{ licenseNumber: { $regex: req.query.search, $options: "i" } },
			];
		}
		const drivers = await Driver.find(filter).sort({ createdAt: -1 });
		return success(res, { drivers });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/drivers/active
 */
export const getActiveDrivers = async (req, res) => {
	try {
		const drivers = await Driver.find({ partnerId: req.user.partnerId, status: "active" });
		return success(res, { drivers });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/drivers/expiring
 */
export const getExpiringDrivers = async (req, res) => {
	try {
		const days = parseInt(req.query.days) || 30;
		const now = new Date();
		const threshold = new Date();
		threshold.setDate(threshold.getDate() + days);

		const drivers = await Driver.find({ partnerId: req.user.partnerId, status: "active" });
		const expiring = drivers.filter((d) => {
			const licenseExpiry = new Date(d.licenseExpiry);
			const insuranceExpiry = new Date(d.insuranceExpiry);
			return (
				(licenseExpiry <= threshold && licenseExpiry >= now) ||
				(insuranceExpiry <= threshold && insuranceExpiry >= now) ||
				licenseExpiry < now ||
				insuranceExpiry < now
			);
		});

		return success(res, { drivers: expiring, count: expiring.length });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/drivers/:id
 */
export const getDriver = async (req, res) => {
	try {
		const driver = await Driver.findOne({ _id: req.params.id, partnerId: req.user.partnerId });
		if (!driver) return error(res, "Driver not found", 404, 10001);
		return success(res, { driver });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/drivers
 */
export const createDriver = async (req, res) => {
	try {
		const driver = await Driver.create({ ...req.body, partnerId: req.user.partnerId });
		return success(res, { driver }, "Driver created successfully", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/partner/drivers/:id
 */
export const updateDriver = async (req, res) => {
	try {
		const driver = await Driver.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			req.body,
			{ new: true },
		);
		if (!driver) return error(res, "Driver not found", 404, 10001);
		return success(res, { driver }, "Driver updated successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/partner/drivers/:id
 */
export const deleteDriver = async (req, res) => {
	try {
		const driver = await Driver.findOneAndDelete({ _id: req.params.id, partnerId: req.user.partnerId });
		if (!driver) return error(res, "Driver not found", 404, 10001);
		return success(res, {}, "Driver deleted successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
