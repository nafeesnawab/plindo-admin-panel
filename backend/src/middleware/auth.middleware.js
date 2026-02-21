import jwt from "jsonwebtoken";
import Customer from "../models/Customer.model.js";
import Partner from "../models/Partner.model.js";
import User from "../models/User.model.js";
import { error } from "../utils/response.js";

/**
 * Protect routes — verifies JWT and attaches req.user with role info.
 * Supports both admin (User) and partner (Partner) tokens.
 */
export const protect = async (req, res, next) => {
	try {
		let token;

		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			return error(res, "Not authorized to access this route", 401);
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (decoded.role === "partner") {
			const partner = await Partner.findById(decoded.id).select("-password");
			if (!partner) {
				return error(res, "Partner not found", 401);
			}
			if (partner.status !== "active") {
				return error(res, "Partner account is not active", 401);
			}
			req.user = {
				id: partner._id,
				partnerId: partner._id,
				email: partner.email,
				businessName: partner.businessName,
				role: "partner",
			};
		} else {
			const user = await User.findById(decoded.id).select("-password");
			if (!user) {
				return error(res, "User not found", 401);
			}
			if (!user.isActive) {
				return error(res, "Account has been deactivated", 401);
			}
			req.user = {
				id: user._id,
				email: user.email,
				username: user.username,
				role: user.role,
				avatar: user.avatar,
			};
		}

		next();
	} catch (err) {
		return error(res, "Not authorized to access this route", 401);
	}
};

/**
 * Authorize by role — must be used after protect middleware.
 * Usage: authorize('admin') or authorize('admin', 'partner')
 */
export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return error(
				res,
				`Role '${req.user.role}' is not authorized to access this route`,
				403,
			);
		}
		next();
	};
};

/**
 * Protect customer routes — verifies JWT for customer role only.
 */
export const protectCustomer = async (req, res, next) => {
	try {
		let token;

		if (req.headers.authorization?.startsWith("Bearer")) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			return error(res, "Not authorized to access this route", 401);
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (decoded.role !== "customer") {
			return error(res, "This route is for customers only", 403);
		}

		const customer = await Customer.findById(decoded.id).select("-password");
		if (!customer) {
			return error(res, "Customer not found", 401);
		}

		if (customer.status === "suspended") {
			return error(res, "Your account has been suspended", 401);
		}

		req.user = {
			id: customer._id,
			customerId: customer._id,
			email: customer.email,
			phone: customer.phone,
			name: customer.name,
			role: "customer",
		};

		next();
	} catch {
		return error(res, "Not authorized to access this route", 401);
	}
};
