import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
	{
		id: { type: String, required: true },
		name: { type: String, required: true },
		subject: { type: String },
		body: { type: String },
		isActive: { type: Boolean, default: true },
	},
	{ _id: false },
);

const settingsSchema = new mongoose.Schema(
	{
		// Singleton key
		key: { type: String, default: "platform_settings", unique: true },

		// Commission settings
		commission: {
			customerCommission: { type: Number, default: 5 },
			partnerCommission: { type: Number, default: 10 },
			minimumPayout: { type: Number, default: 50 },
			payoutSchedule: { type: String, default: "weekly" },
		},

		// Booking rules
		bookingRules: {
			minAdvanceBookingHours: { type: Number, default: 2 },
			maxAdvanceBookingDays: { type: Number, default: 14 },
			cancellationWindowHours: { type: Number, default: 24 },
			autoConfirm: { type: Boolean, default: true },
			allowRescheduling: { type: Boolean, default: true },
			maxReschedules: { type: Number, default: 2 },
		},

		// Subscription plans
		subscriptionPlans: {
			basic: {
				price: { type: Number, default: 15 },
				washesIncluded: { type: Number, default: 0 },
				enabled: { type: Boolean, default: false },
				features: {
					type: [String],
					default: [
						"Access to nearby car wash locations",
						"Standard booking slots",
						"In-app booking & status tracking",
						"Basic customer support",
					],
				},
			},
			premium: {
				price: { type: Number, default: 28 },
				washesIncluded: { type: Number, default: 4 },
				enabled: { type: Boolean, default: false },
				features: {
					type: [String],
					default: [
						"Priority booking & peak-time slots",
						"Pick-up & delivery option",
						"Discounted add-on services",
						"Premium support",
						"Exclusive partner offers",
					],
				},
			},
		},

		// Payment settings
		payment: {
			stripeConnected: { type: Boolean, default: false },
			paymentMethods: { type: [String], default: ["card"] },
			payoutSchedule: { type: String, default: "weekly" },
			minimumPayout: { type: Number, default: 50 },
			currency: { type: String, default: "GBP" },
		},

		// Notification settings
		notifications: {
			bookingConfirmation: { type: Boolean, default: true },
			bookingReminder: { type: Boolean, default: true },
			bookingCancellation: { type: Boolean, default: true },
			paymentSuccess: { type: Boolean, default: true },
			paymentFailed: { type: Boolean, default: true },
			promotions: { type: Boolean, default: true },
			systemUpdates: { type: Boolean, default: true },
		},

		// Notification templates
		notificationTemplates: [notificationTemplateSchema],
	},
	{
		timestamps: true,
	},
);

/**
 * Get platform settings (singleton).
 * Creates default settings if none exist.
 */
settingsSchema.statics.getSettings = async function () {
	let settings = await this.findOne({ key: "platform_settings" });
	if (!settings) {
		settings = await this.create({ key: "platform_settings" });
	}
	return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
