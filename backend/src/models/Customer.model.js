import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
	{
		make: { type: String },
		model: { type: String },
		year: { type: Number },
		color: { type: String },
		plateNumber: { type: String },
		bodyType: { type: String },
		type: {
			type: String,
			enum: [
				"compact",
				"sedan",
				"suv",
				"van",
				"luxury",
				"hatchback",
				"coupe",
				"convertible",
				"pickup",
				"mpv",
				"wagon",
				"crossover",
			],
		},
	},
	{ _id: true },
);

const paymentMethodSchema = new mongoose.Schema(
	{
		type: { type: String },
		brand: { type: String },
		last4: { type: String },
		expiryDate: { type: String },
		isDefault: { type: Boolean, default: false },
		stripePaymentMethodId: { type: String },
	},
	{ _id: true },
);

const customerSchema = new mongoose.Schema(
	{
		name: { type: String, trim: true },
		email: { type: String, sparse: true, lowercase: true, trim: true },
		phone: { type: String, sparse: true, trim: true },
		password: {
			type: String,
			minlength: [6, "Password must be at least 6 characters"],
			select: false,
		},
		avatar: { type: String },
		location: { type: String, trim: true },
		language: { type: String, default: "en" },

		// Auth flags
		emailVerified: { type: Boolean, default: false },
		phoneVerified: { type: Boolean, default: false },
		isProfileComplete: { type: Boolean, default: false },

		status: {
			type: String,
			enum: ["active", "suspended", "pending"],
			default: "active",
			index: true,
		},
		suspensionReason: { type: String },
		suspendedAt: { type: Date },

		vehicles: [vehicleSchema],
		paymentMethods: [paymentMethodSchema],

		// Subscription
		subscriptionTier: {
			type: String,
			enum: ["none", "basic", "premium"],
			default: "none",
		},
		subscriptionStartDate: { type: Date },
		subscriptionEndDate: { type: Date },
		subscriptionAutoRenew: { type: Boolean, default: false },
		washesRemaining: { type: Number, default: 0 },

		// Stats
		totalBookings: { type: Number, default: 0 },
		totalSpent: { type: Number, default: 0 },

		// Push notifications
		fcmToken: { type: String },
		notificationPreferences: {
			bookingUpdates: { type: Boolean, default: true },
			promotions: { type: Boolean, default: true },
			messages: { type: Boolean, default: true },
		},
	},
	{
		timestamps: true,
	},
);

customerSchema.index({ email: 1 }, { sparse: true });
customerSchema.index({ phone: 1 }, { sparse: true });
customerSchema.index({ status: 1 });
customerSchema.index({ name: "text", email: "text" });

customerSchema.pre("save", async function (next) {
	if (!this.isModified("password") || !this.password) {
		return next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

customerSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
