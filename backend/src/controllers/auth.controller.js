import jwt from "jsonwebtoken";
import Partner from "../models/Partner.model.js";
import PartnerAvailability from "../models/PartnerAvailability.model.js";
import PartnerCapacity from "../models/PartnerCapacity.model.js";
import User from "../models/User.model.js";
import { error, success } from "../utils/response.js";

const generateTokens = (id, role) => {
	const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	});
	const refreshToken = jwt.sign(
		{ id, role },
		process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
		},
	);
	return { accessToken, refreshToken };
};

/**
 * POST /api/auth/unified-signin
 * Unified sign-in for both admin and partner accounts.
 * Tries admin first, then partner.
 */
export const unifiedSignIn = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return error(res, "Please provide email and password", 400);
		}

		// Try admin user first
		const user = await User.findOne({ email }).select("+password");
		if (user) {
			if (!(await user.comparePassword(password))) {
				return error(res, "Invalid credentials", 401);
			}
			if (!user.isActive) {
				return error(res, "Your account has been deactivated", 401);
			}

			const tokens = generateTokens(user._id, "admin");

			return success(res, {
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
					avatar: user.avatar,
					roles: [{ id: "1", name: "Admin", code: "admin" }],
					permissions: [],
				},
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				role: "admin",
			});
		}

		// Try partner
		const partner = await Partner.findOne({ email }).select("+password");
		if (partner) {
			if (!(await partner.comparePassword(password))) {
				return error(res, "Invalid credentials", 401);
			}

			const tokens = generateTokens(partner._id, "partner");

			return success(res, {
				partner: {
					id: partner._id,
					businessName: partner.businessName,
					email: partner.email,
					status: partner.status,
					avatar: partner.avatar || partner.logo,
				},
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				role: "partner",
			});
		}

		return error(res, "Invalid credentials", 401);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/auth/register
 * Register a new admin user (admin-only action).
 */
export const register = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const userExists = await User.findOne({ $or: [{ email }, { username }] });
		if (userExists) {
			return error(res, "User already exists with this email or username", 400);
		}

		const user = await User.create({ username, email, password });
		const tokens = generateTokens(user._id, user.role);

		return success(
			res,
			{
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
					role: user.role,
					avatar: user.avatar,
				},
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			},
			"User registered successfully",
			201,
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/auth/partner/register
 * Register a new partner application (multipart/form-data).
 */
export const registerPartner = async (req, res) => {
	try {
		// Parse JSON fields sent as FormData strings
		const businessInfo = JSON.parse(req.body.businessInfo || "{}");
		const businessDetails = JSON.parse(req.body.businessDetails || "{}");
		const driversData = JSON.parse(req.body.drivers || "[]");
		const schedule = JSON.parse(req.body.schedule || "[]");
		const capacityByCategory = JSON.parse(req.body.capacityByCategory || "{}");
		const bufferTime = JSON.parse(req.body.bufferTime || "15");

		const {
			email,
			businessName,
			businessLicenseNumber,
			contactPersonName,
			phone,
			address,
			latitude,
			longitude,
			password,
		} = businessInfo;
		const { description, serviceRadius } = businessDetails;

		if (!email || !businessName) {
			return error(res, "Email and business name are required", 400);
		}

		if (!password || password.length < 8) {
			return error(res, "Password must be at least 8 characters", 400);
		}

		const existing = await Partner.findOne({ email });
		if (existing) {
			return error(
				res,
				"A partner application with this email already exists",
				400,
			);
		}

		// Helper to get uploaded file URL by field name
		const files = req.files || [];
		const getFileUrl = (fieldname) => {
			const file = files.find((f) => f.fieldname === fieldname);
			return file ? `/uploads/${file.filename}` : null;
		};

		// Work photos
		const workPhotos = [];
		for (let i = 0; files.find((f) => f.fieldname === `workPhoto_${i}`); i++) {
			workPhotos.push(
				`/uploads/${files.find((f) => f.fieldname === `workPhoto_${i}`).filename}`,
			);
		}

		// Drivers with document URLs
		const drivers = driversData.map((d, index) => {
			const licenseFile = files.find(
				(f) => f.fieldname === `driverLicense_${index}`,
			);
			const insuranceFile = files.find(
				(f) => f.fieldname === `driverInsurance_${index}`,
			);
			return {
				fullName: d.fullName,
				contactNumber: d.contactNumber,
				...(licenseFile && {
					driverLicenseUrl: `/uploads/${licenseFile.filename}`,
				}),
				...(insuranceFile && {
					driverInsuranceUrl: `/uploads/${insuranceFile.filename}`,
				}),
			};
		});

		const partner = await Partner.create({
			email,
			password,
			businessName,
			businessLicenseNumber,
			contactPersonName,
			phone,
			address,
			latitude: latitude || undefined,
			longitude: longitude || undefined,
			description,
			serviceRadius: serviceRadius || 10,
			businessRegistrationUrl: getFileUrl("businessRegistration"),
			businessInsuranceUrl: getFileUrl("businessInsurance"),
			motorTradeInsuranceUrl: getFileUrl("motorTradeInsurance"),
			logo: getFileUrl("logo"),
			coverPhoto: getFileUrl("coverPhoto"),
			workPhotos,
			drivers,
			status: "pending",
			appliedAt: new Date(),
		});

		// Create PartnerAvailability with schedule data
		await PartnerAvailability.create({
			partnerId: partner._id,
			schedule,
			bufferTimeMinutes: bufferTime,
		});

		// Create PartnerCapacity with capacity data
		await PartnerCapacity.create({
			partnerId: partner._id,
			capacityByCategory,
			bufferTimeMinutes: bufferTime,
			bays: [], // Initially empty, can be managed later
		});

		return success(
			res,
			{
				application: {
					id: partner._id,
					businessName: partner.businessName,
					email: partner.email,
					status: partner.status,
					submittedAt: partner.appliedAt,
				},
			},
			"Partner application submitted successfully",
			201,
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/auth/partner/application-status?email=
 */
export const getApplicationStatus = async (req, res) => {
	try {
		const { email } = req.query;
		if (!email) {
			return error(res, "Email is required", 400);
		}

		const partner = await Partner.findOne({ email }).select(
			"businessName email status rejectionReason appliedAt approvedAt",
		);
		if (!partner) {
			return error(res, "No application found with this email", 404);
		}

		return success(res, {
			application: {
				id: partner._id,
				businessName: partner.businessName,
				email: partner.email,
				status: partner.status,
				rejectionReason: partner.rejectionReason,
				submittedAt: partner.appliedAt,
				reviewedAt: partner.approvedAt,
			},
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/auth/partner/check-email?email=
 */
export const checkEmail = async (req, res) => {
	try {
		const { email } = req.query;
		if (!email) {
			return error(res, "Email is required", 400);
		}

		const exists = await Partner.findOne({ email });
		return success(res, { available: !exists });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
	try {
		const { refreshToken: token } = req.body;
		if (!token) {
			return error(res, "Refresh token is required", 400);
		}

		const decoded = jwt.verify(
			token,
			process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
		);
		const tokens = generateTokens(decoded.id, decoded.role);

		return success(res, {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
	} catch (err) {
		return error(res, "Invalid refresh token", 401);
	}
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
	try {
		if (req.user.role === "partner") {
			const partner = await Partner.findById(req.user.id);
			if (!partner) {
				return error(res, "Partner not found", 404);
			}
			return success(res, {
				partner: {
					id: partner._id,
					businessName: partner.businessName,
					email: partner.email,
					status: partner.status,
					avatar: partner.avatar || partner.logo,
				},
				role: "partner",
			});
		}

		const user = await User.findById(req.user.id);
		if (!user) {
			return error(res, "User not found", 404);
		}

		return success(res, {
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				role: user.role,
				avatar: user.avatar,
			},
			role: "admin",
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};
