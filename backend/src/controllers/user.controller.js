import User from "../models/User.model.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";
import { error, success } from "../utils/response.js";

export const getAllUsers = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = {};

		if (req.query.search) {
			filter.$or = [
				{ username: { $regex: req.query.search, $options: "i" } },
				{ email: { $regex: req.query.search, $options: "i" } },
			];
		}

		const [users, total] = await Promise.all([
			User.find(filter).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
			User.countDocuments(filter),
		]);

		return success(res, paginatedResponse(users, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

export const getUserById = async (req, res) => {
	try {
		const user = await User.findById(req.params.id).select("-password");
		if (!user) {
			return error(res, "User not found", 404);
		}
		return success(res, { user });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

export const updateUser = async (req, res) => {
	try {
		const { username, email, role, isActive } = req.body;

		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ username, email, role, isActive },
			{ new: true, runValidators: true },
		).select("-password");

		if (!user) {
			return error(res, "User not found", 404);
		}

		return success(res, { user }, "User updated successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

export const deleteUser = async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);
		if (!user) {
			return error(res, "User not found", 404);
		}
		return success(res, {}, "User deleted successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
