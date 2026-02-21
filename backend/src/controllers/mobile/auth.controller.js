import jwt from "jsonwebtoken";
import Customer from "../../models/Customer.model.js";
import OTP from "../../models/OTP.model.js";
import { sendOtpEmail } from "../../utils/email.js";
import { error, success } from "../../utils/response.js";

const generateTokens = (id) => {
	const accessToken = jwt.sign(
		{ id, role: "customer" },
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRE || "7d",
		},
	);
	const refreshToken = jwt.sign(
		{ id, role: "customer" },
		process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d" },
	);
	return { accessToken, refreshToken };
};

const formatCustomer = (c) => ({
	id: c._id,
	name: c.name || "",
	email: c.email || "",
	phone: c.phone || "",
	avatar: c.avatar || "",
	language: c.language || "en",
	emailVerified: c.emailVerified || false,
	phoneVerified: c.phoneVerified || false,
	isProfileComplete: c.isProfileComplete || false,
	subscriptionTier: c.subscriptionTier || "none",
	vehiclesCount: c.vehicles?.length || 0,
});

/**
 * POST /api/mobile/auth/send-otp
 * Send OTP to email or phone
 */
export const sendOtp = async (req, res) => {
	try {
		const { type, value, purpose } = req.body;

		if (!type || !value || !purpose) {
			return error(res, "type, value, and purpose are required", 400);
		}

		if (!["email", "phone"].includes(type)) {
			return error(res, "type must be 'email' or 'phone'", 400);
		}

		if (!["signup", "reset_password"].includes(purpose)) {
			return error(res, "purpose must be 'signup' or 'reset_password'", 400);
		}

		const identifier = value.toLowerCase().trim();

		// Check if customer exists for signup vs reset_password
		const existingCustomer = await Customer.findOne(
			type === "email" ? { email: identifier } : { phone: identifier },
		);

		if (purpose === "signup" && existingCustomer) {
			return error(res, `An account with this ${type} already exists`, 400);
		}

		if (purpose === "reset_password" && !existingCustomer) {
			return error(res, `No account found with this ${type}`, 404);
		}

		// Check rate limiting - only allow resend after 60 seconds
		const recentOtp = await OTP.findOne({
			identifier,
			purpose,
			createdAt: { $gte: new Date(Date.now() - 60000) },
		});

		if (recentOtp) {
			const waitTime = Math.ceil(
				(60000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000,
			);
			return error(
				res,
				`Please wait ${waitTime} seconds before requesting a new OTP`,
				429,
			);
		}

		// Generate OTP
		const code = OTP.generateCode();
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

		// Delete any existing OTPs for this identifier and purpose
		await OTP.deleteMany({ identifier, purpose });

		// Create new OTP
		const otp = await OTP.create({
			identifier,
			identifierType: type,
			code,
			purpose,
			expiresAt,
		});

		if (type === "email") {
			try {
				await sendOtpEmail({ to: identifier, code, purpose });
			} catch (emailErr) {
				console.error(
					`[OTP] Failed to send email to ${identifier}:`,
					emailErr.message,
				);
			}
		} else {
			console.log(`[SMS OTP] ${identifier}: ${code}`);
		}

		return success(
			res,
			{
				otpId: otp._id,
				expiresIn: 300,
				canResendAfter: 60,
			},
			"OTP sent successfully",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/auth/verify-otp
 * Verify OTP and return verification token
 */
export const verifyOtp = async (req, res) => {
	try {
		const { otpId, code } = req.body;

		if (!otpId || !code) {
			return error(res, "otpId and code are required", 400);
		}

		const otp = await OTP.findById(otpId);

		if (!otp) {
			return error(res, "Invalid or expired OTP", 400);
		}

		if (otp.expiresAt < new Date()) {
			await OTP.findByIdAndDelete(otpId);
			return error(res, "OTP has expired", 400);
		}

		if (otp.attempts >= otp.maxAttempts) {
			await OTP.findByIdAndDelete(otpId);
			return error(
				res,
				"Maximum attempts exceeded. Please request a new OTP",
				400,
			);
		}

		if (otp.code !== code) {
			otp.attempts += 1;
			await otp.save();
			return error(
				res,
				`Invalid OTP. ${otp.maxAttempts - otp.attempts} attempts remaining`,
				400,
			);
		}

		// OTP verified - generate verification token
		const verificationToken = OTP.generateVerificationToken();
		otp.verified = true;
		otp.verificationToken = verificationToken;
		otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes to complete signup/reset
		await otp.save();

		return success(
			res,
			{
				verificationToken,
				expiresIn: 600,
				purpose: otp.purpose,
				identifier: otp.identifier,
				identifierType: otp.identifierType,
			},
			"OTP verified successfully",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/auth/signup
 * Complete signup after OTP verification
 */
export const signup = async (req, res) => {
	try {
		const { verificationToken, password, email, phone } = req.body;

		if (!verificationToken || !password) {
			return error(res, "verificationToken and password are required", 400);
		}

		if (!email && !phone) {
			return error(res, "email or phone is required", 400);
		}

		if (password.length < 6) {
			return error(res, "Password must be at least 6 characters", 400);
		}

		// Find and validate verification token
		const otp = await OTP.findOne({
			verificationToken,
			verified: true,
			purpose: "signup",
		});

		if (!otp) {
			return error(res, "Invalid or expired verification token", 400);
		}

		if (otp.expiresAt < new Date()) {
			await OTP.findByIdAndDelete(otp._id);
			return error(
				res,
				"Verification token has expired. Please start over",
				400,
			);
		}

		// Confirm the submitted identifier matches what was OTP-verified
		const submittedIdentifier = (email || phone).toLowerCase().trim();
		if (submittedIdentifier !== otp.identifier) {
			return error(res, "Identifier does not match the verified OTP", 400);
		}

		// Check if account already exists
		const existingCustomer = await Customer.findOne(
			otp.identifierType === "email"
				? { email: otp.identifier }
				: { phone: otp.identifier },
		);

		if (existingCustomer) {
			return error(res, "An account with this identifier already exists", 400);
		}

		// Create customer — profile info (name, language, etc.) collected later via profile update
		const customerData = {
			password,
			status: "active",
		};

		if (otp.identifierType === "email") {
			customerData.email = otp.identifier;
			customerData.emailVerified = true;
		} else {
			customerData.phone = otp.identifier;
			customerData.phoneVerified = true;
		}

		const customer = await Customer.create(customerData);

		// Delete used OTP
		await OTP.findByIdAndDelete(otp._id);

		// Generate tokens
		const tokens = generateTokens(customer._id);

		return success(
			res,
			{
				customer: formatCustomer(customer),
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			},
			"Account created successfully",
			201,
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/auth/signin
 * Sign in with email/phone and password
 */
export const signin = async (req, res) => {
	try {
		const { identifier, password } = req.body;

		if (!identifier || !password) {
			return error(res, "identifier and password are required", 400);
		}

		const normalizedIdentifier = identifier.toLowerCase().trim();

		// Find customer by email or phone
		const customer = await Customer.findOne({
			$or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
		}).select("+password");

		if (!customer) {
			return error(res, "Invalid credentials", 401);
		}

		if (!customer.password) {
			return error(res, "Please reset your password to continue", 401);
		}

		const isMatch = await customer.comparePassword(password);
		if (!isMatch) {
			return error(res, "Invalid credentials", 401);
		}

		if (customer.status === "suspended") {
			return error(res, "Your account has been suspended", 401);
		}

		// Generate tokens
		const tokens = generateTokens(customer._id);

		return success(res, {
			customer: formatCustomer(customer),
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/auth/forgot-password
 * Request password reset OTP
 */
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return error(res, "Email is required", 400);
		}

		// Reuse send-otp logic
		req.body = {
			type: "email",
			value: email,
			purpose: "reset_password",
		};

		return sendOtp(req, res);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/auth/reset-password
 * Reset password with verification token
 */
export const resetPassword = async (req, res) => {
	try {
		const { verificationToken, newPassword } = req.body;

		if (!verificationToken || !newPassword) {
			return error(res, "verificationToken and newPassword are required", 400);
		}

		if (newPassword.length < 6) {
			return error(res, "Password must be at least 6 characters", 400);
		}

		// Find and validate verification token
		const otp = await OTP.findOne({
			verificationToken,
			verified: true,
			purpose: "reset_password",
		});

		if (!otp) {
			return error(res, "Invalid or expired verification token", 400);
		}

		if (otp.expiresAt < new Date()) {
			await OTP.findByIdAndDelete(otp._id);
			return error(
				res,
				"Verification token has expired. Please start over",
				400,
			);
		}

		// Find customer
		const customer = await Customer.findOne(
			otp.identifierType === "email"
				? { email: otp.identifier }
				: { phone: otp.identifier },
		);

		if (!customer) {
			return error(res, "Account not found", 404);
		}

		// Update password
		customer.password = newPassword;
		await customer.save();

		// Delete used OTP
		await OTP.findByIdAndDelete(otp._id);

		return success(res, {}, "Password reset successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/auth/refresh-token
 * Refresh access token
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

		if (decoded.role !== "customer") {
			return error(res, "Invalid token type", 401);
		}

		const customer = await Customer.findById(decoded.id);
		if (!customer) {
			return error(res, "Customer not found", 401);
		}

		if (customer.status === "suspended") {
			return error(res, "Your account has been suspended", 401);
		}

		const tokens = generateTokens(customer._id);

		return success(res, {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
	} catch {
		return error(res, "Invalid refresh token", 401);
	}
};

/**
 * GET /api/mobile/auth/me
 * Get current customer profile
 */
export const getMe = async (req, res) => {
	try {
		const customer = await Customer.findById(req.user.id);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		return success(res, {
			customer: formatCustomer(customer),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};
