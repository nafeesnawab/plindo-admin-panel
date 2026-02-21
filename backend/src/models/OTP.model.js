import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
	{
		identifier: {
			type: String,
			required: true,
			index: true,
		},
		identifierType: {
			type: String,
			enum: ["email", "phone"],
			required: true,
		},
		code: {
			type: String,
			required: true,
		},
		purpose: {
			type: String,
			enum: ["signup", "reset_password", "verify_phone", "verify_email"],
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
		verified: {
			type: Boolean,
			default: false,
		},
		verificationToken: {
			type: String,
			index: true,
		},
		attempts: {
			type: Number,
			default: 0,
		},
		maxAttempts: {
			type: Number,
			default: 5,
		},
	},
	{
		timestamps: true,
	}
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.statics.generateCode = function () {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

otpSchema.statics.generateVerificationToken = function () {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15) +
		Date.now().toString(36)
	);
};

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
