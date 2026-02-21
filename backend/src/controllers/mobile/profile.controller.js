import Car from "../../models/Car.model.js";
import Customer from "../../models/Customer.model.js";
import Booking from "../../models/Booking.model.js";
import { error, success } from "../../utils/response.js";

const formatCustomer = (c) => ({
	id: c._id,
	name: c.name || "",
	email: c.email || "",
	phone: c.phone || "",
	avatar: c.avatar || "",
	language: c.language || "en",
	location: c.location || "",
	emailVerified: c.emailVerified || false,
	phoneVerified: c.phoneVerified || false,
	isProfileComplete: c.isProfileComplete || false,
	subscriptionTier: c.subscriptionTier || "none",
	subscriptionEndDate: c.subscriptionEndDate || null,
	washesRemaining: c.washesRemaining || 0,
	vehicles: c.vehicles || [],
	paymentMethods: (c.paymentMethods || []).map((pm) => ({
		id: pm._id,
		type: pm.type,
		brand: pm.brand,
		last4: pm.last4,
		expiryDate: pm.expiryDate,
		isDefault: pm.isDefault,
	})),
	totalBookings: c.totalBookings || 0,
	totalSpent: c.totalSpent || 0,
});

/**
 * GET /api/mobile/profile
 * Get customer profile
 */
export const getProfile = async (req, res) => {
	try {
		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		return success(res, { customer: formatCustomer(customer) });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/mobile/profile
 * Update customer profile
 */
export const updateProfile = async (req, res) => {
	try {
		const { name, email, phone, avatar, language, location } = req.body;

		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		// Check email uniqueness if changing
		if (email && email !== customer.email) {
			const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
			if (existing && existing._id.toString() !== customer._id.toString()) {
				return error(res, "Email is already in use", 400);
			}
			customer.email = email.toLowerCase().trim();
			customer.emailVerified = false; // Reset verification
		}

		// Check phone uniqueness if changing
		if (phone && phone !== customer.phone) {
			const existing = await Customer.findOne({ phone: phone.trim() });
			if (existing && existing._id.toString() !== customer._id.toString()) {
				return error(res, "Phone number is already in use", 400);
			}
			customer.phone = phone.trim();
			customer.phoneVerified = false; // Reset verification
		}

		if (name !== undefined) customer.name = name.trim();
		if (avatar !== undefined) customer.avatar = avatar;
		if (language !== undefined) customer.language = language;
		if (location !== undefined) customer.location = location;

		// Check if profile is complete
		customer.isProfileComplete = !!(customer.name && (customer.email || customer.phone));

		await customer.save();

		return success(res, { customer: formatCustomer(customer) }, "Profile updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/mobile/profile/password
 * Change password
 */
export const changePassword = async (req, res) => {
	try {
		const { oldPassword, newPassword } = req.body;

		if (!oldPassword || !newPassword) {
			return error(res, "oldPassword and newPassword are required", 400);
		}

		if (newPassword.length < 6) {
			return error(res, "Password must be at least 6 characters", 400);
		}

		const customer = await Customer.findById(req.user.id).select("+password");
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const isMatch = await customer.comparePassword(oldPassword);
		if (!isMatch) {
			return error(res, "Current password is incorrect", 400);
		}

		customer.password = newPassword;
		await customer.save();

		return success(res, {}, "Password changed successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/mobile/profile
 * Delete customer account
 */
export const deleteAccount = async (req, res) => {
	try {
		const customer = await Customer.findByIdAndDelete(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		// TODO: Clean up related data (bookings, conversations, etc.)

		return success(res, {}, "Account deleted successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/profile/logout
 * Logout (invalidate token - for FCM cleanup)
 */
export const logout = async (req, res) => {
	try {
		// Clear FCM token if provided
		if (req.user.id) {
			await Customer.findByIdAndUpdate(req.user.id, { fcmToken: null });
		}

		return success(res, {}, "Logged out successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/profile/bookings-summary
 * Get quick stats for profile
 */
export const getBookingsSummary = async (req, res) => {
	try {
		const customerId = req.user.id;

		const [totalBookings, pendingBookings, completedBookings, totalSpent] = await Promise.all([
			Booking.countDocuments({ customerId }),
			Booking.countDocuments({ customerId, status: { $in: ["booked", "in_progress"] } }),
			Booking.countDocuments({ customerId, status: "completed" }),
			Booking.aggregate([
				{ $match: { customerId: customerId } },
				{ $group: { _id: null, total: { $sum: "$pricing.finalPrice" } } },
			]),
		]);

		return success(res, {
			totalBookings,
			pendingBookings,
			completedBookings,
			totalSpent: totalSpent[0]?.total || 0,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── Vehicle Management ─────────────────────────────────────────────────────

/**
 * GET /api/mobile/vehicles
 * List customer's vehicles
 */
export const getVehicles = async (req, res) => {
	try {
		const customer = await Customer.findById(req.user.id).select("vehicles");
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const vehicles = (customer.vehicles || []).map((v) => ({
			id: v._id,
			make: v.make,
			model: v.model,
			year: v.year,
			color: v.color,
			plateNumber: v.plateNumber,
			bodyType: v.bodyType,
			type: v.type,
		}));

		return success(res, { vehicles });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/vehicles
 * Add a vehicle
 */
export const addVehicle = async (req, res) => {
	try {
		const { make, model, year, color, plateNumber, bodyType, type } = req.body;

		if (!make || !model) {
			return error(res, "make and model are required", 400);
		}

		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const vehicle = {
			make,
			model,
			year,
			color,
			plateNumber,
			bodyType,
			type,
		};

		customer.vehicles.push(vehicle);
		await customer.save();

		const addedVehicle = customer.vehicles[customer.vehicles.length - 1];

		return success(
			res,
			{
				vehicle: {
					id: addedVehicle._id,
					make: addedVehicle.make,
					model: addedVehicle.model,
					year: addedVehicle.year,
					color: addedVehicle.color,
					plateNumber: addedVehicle.plateNumber,
					bodyType: addedVehicle.bodyType,
					type: addedVehicle.type,
				},
			},
			"Vehicle added",
			201
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/mobile/vehicles/:id
 * Update a vehicle
 */
export const updateVehicle = async (req, res) => {
	try {
		const { id } = req.params;
		const { make, model, year, color, plateNumber, bodyType, type } = req.body;

		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const vehicle = customer.vehicles.id(id);
		if (!vehicle) {
			return error(res, "Vehicle not found", 404);
		}

		if (make !== undefined) vehicle.make = make;
		if (model !== undefined) vehicle.model = model;
		if (year !== undefined) vehicle.year = year;
		if (color !== undefined) vehicle.color = color;
		if (plateNumber !== undefined) vehicle.plateNumber = plateNumber;
		if (bodyType !== undefined) vehicle.bodyType = bodyType;
		if (type !== undefined) vehicle.type = type;

		await customer.save();

		return success(
			res,
			{
				vehicle: {
					id: vehicle._id,
					make: vehicle.make,
					model: vehicle.model,
					year: vehicle.year,
					color: vehicle.color,
					plateNumber: vehicle.plateNumber,
					bodyType: vehicle.bodyType,
					type: vehicle.type,
				},
			},
			"Vehicle updated"
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/mobile/vehicles/:id
 * Delete a vehicle
 */
export const deleteVehicle = async (req, res) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const vehicle = customer.vehicles.id(id);
		if (!vehicle) {
			return error(res, "Vehicle not found", 404);
		}

		vehicle.deleteOne();
		await customer.save();

		return success(res, {}, "Vehicle deleted");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── Payment Methods ────────────────────────────────────────────────────────

/**
 * GET /api/mobile/payment-methods
 * List payment methods
 */
export const getPaymentMethods = async (req, res) => {
	try {
		const customer = await Customer.findById(req.user.id).select("paymentMethods");
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const paymentMethods = (customer.paymentMethods || []).map((pm) => ({
			id: pm._id,
			type: pm.type,
			brand: pm.brand,
			last4: pm.last4,
			expiryDate: pm.expiryDate,
			isDefault: pm.isDefault,
		}));

		return success(res, { paymentMethods });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/payment-methods
 * Add payment method
 */
export const addPaymentMethod = async (req, res) => {
	try {
		const { type, brand, last4, expiryDate, stripePaymentMethodId, isDefault } = req.body;

		if (!type || !last4) {
			return error(res, "type and last4 are required", 400);
		}

		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		// If this is set as default, unset other defaults
		if (isDefault) {
			customer.paymentMethods.forEach((pm) => {
				pm.isDefault = false;
			});
		}

		// If this is the first payment method, make it default
		const makeDefault = isDefault || customer.paymentMethods.length === 0;

		const paymentMethod = {
			type,
			brand,
			last4,
			expiryDate,
			stripePaymentMethodId,
			isDefault: makeDefault,
		};

		customer.paymentMethods.push(paymentMethod);
		await customer.save();

		const added = customer.paymentMethods[customer.paymentMethods.length - 1];

		return success(
			res,
			{
				paymentMethod: {
					id: added._id,
					type: added.type,
					brand: added.brand,
					last4: added.last4,
					expiryDate: added.expiryDate,
					isDefault: added.isDefault,
				},
			},
			"Payment method added",
			201
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/mobile/payment-methods/:id
 * Remove payment method
 */
export const deletePaymentMethod = async (req, res) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const pm = customer.paymentMethods.id(id);
		if (!pm) {
			return error(res, "Payment method not found", 404);
		}

		const wasDefault = pm.isDefault;
		pm.deleteOne();

		// If deleted was default, make another one default
		if (wasDefault && customer.paymentMethods.length > 0) {
			customer.paymentMethods[0].isDefault = true;
		}

		await customer.save();

		return success(res, {}, "Payment method removed");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

// ─── Car Registry (Public) ──────────────────────────────────────────────────

/**
 * GET /api/mobile/cars/makes
 * Get all car makes
 */
export const getCarMakes = async (req, res) => {
	try {
		const makes = await Car.distinct("make");
		return success(res, { makes: makes.sort() });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/cars/models/:make
 * Get models for a make
 */
export const getCarModels = async (req, res) => {
	try {
		const { make } = req.params;
		const cars = await Car.find({ make }).select("model bodyType").sort({ model: 1 });

		const models = cars.map((c) => ({
			model: c.model,
			bodyType: c.bodyType,
		}));

		return success(res, { models });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/cars/body-types
 * Get all body types
 */
export const getCarBodyTypes = async (req, res) => {
	try {
		const bodyTypes = await Car.distinct("bodyType");
		return success(res, { bodyTypes: bodyTypes.sort() });
	} catch (err) {
		return error(res, err.message, 500);
	}
};
