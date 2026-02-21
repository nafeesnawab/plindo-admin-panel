import Service from "../../models/Service.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/services
 */
export const getServices = async (req, res) => {
	try {
		const services = await Service.find({ partnerId: req.user.partnerId }).sort(
			{ createdAt: -1 },
		);
		return success(res, { services });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/services/:id
 */
export const getServiceById = async (req, res) => {
	try {
		const service = await Service.findOne({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!service) return error(res, "Service not found", 404);
		return success(res, { service });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/services
 */
export const createService = async (req, res) => {
	try {
		const service = await Service.create({
			...req.body,
			partnerId: req.user.partnerId,
		});
		return success(res, { service }, "Service created", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/partner/services/:id
 */
export const updateService = async (req, res) => {
	try {
		const service = await Service.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			req.body,
			{ new: true },
		);
		if (!service) return error(res, "Service not found", 404);
		return success(res, { service }, "Service updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/partner/services/:id
 */
export const deleteService = async (req, res) => {
	try {
		const service = await Service.findOneAndDelete({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!service) return error(res, "Service not found", 404);
		return success(res, {}, "Service deleted");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PATCH /api/partner/services/:id/toggle
 */
export const toggleService = async (req, res) => {
	try {
		const service = await Service.findOne({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!service) return error(res, "Service not found", 404);
		const newStatus =
			req.body.status || (service.status === "active" ? "inactive" : "active");
		service.status = newStatus;
		await service.save();
		return success(
			res,
			{ service },
			`Service ${service.status === "active" ? "activated" : "deactivated"}`,
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/services/:id/duplicate
 */
export const duplicateService = async (req, res) => {
	try {
		const original = await Service.findOne({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!original) return error(res, "Service not found", 404);
		const { _id, createdAt, updatedAt, ...data } = original.toObject();
		const copy = await Service.create({ ...data, name: `${data.name} (Copy)` });
		return success(res, { service: copy }, "Service duplicated", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
