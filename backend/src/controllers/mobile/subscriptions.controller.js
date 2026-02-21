import Customer from "../../models/Customer.model.js";
import Settings from "../../models/Settings.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/mobile/subscriptions/plans
 * Get available subscription plans
 */
export const getSubscriptionPlans = async (req, res) => {
	try {
		const settings = await Settings.getSettings();
		const plans = settings?.subscriptionPlans;

		const defaultPlans = [
			{
				id: "plan_basic",
				tier: "basic",
				name: "Basic",
				price: plans?.basic?.price || 15,
				currency: "GBP",
				washesIncluded: plans?.basic?.washesIncluded || 3,
				features: plans?.basic?.features || [
					"Access to nearby car wash locations",
					"Standard booking slots",
					"In-app booking & status tracking",
					"Basic customer support",
				],
				enabled: plans?.basic?.enabled ?? true,
			},
			{
				id: "plan_premium",
				tier: "premium",
				name: "Premium",
				price: plans?.premium?.price || 28,
				currency: "GBP",
				washesIncluded: plans?.premium?.washesIncluded || 6,
				features: plans?.premium?.features || [
					"Priority booking & peak-time slots",
					"Pick-up & delivery option",
					"Discounted add-on services (10% off)",
					"Premium support",
					"Exclusive partner offers",
				],
				enabled: plans?.premium?.enabled ?? true,
			},
		];

		return success(res, { plans: defaultPlans.filter((p) => p.enabled) });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/mobile/subscriptions/current
 * Get customer's current subscription
 */
export const getCurrentSubscription = async (req, res) => {
	try {
		const customer = await Customer.findById(req.user.id).select(
			"subscriptionTier subscriptionStartDate subscriptionEndDate subscriptionAutoRenew washesRemaining"
		);

		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		const isActive =
			customer.subscriptionTier !== "none" &&
			customer.subscriptionEndDate &&
			new Date(customer.subscriptionEndDate) > new Date();

		return success(res, {
			subscription: {
				tier: customer.subscriptionTier,
				isActive,
				startDate: customer.subscriptionStartDate,
				endDate: customer.subscriptionEndDate,
				autoRenew: customer.subscriptionAutoRenew,
				washesRemaining: customer.washesRemaining || 0,
			},
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/subscriptions/subscribe
 * Subscribe to a plan
 */
export const subscribe = async (req, res) => {
	try {
		const { tier, paymentMethodId } = req.body;
		const customerId = req.user.id;

		if (!tier || !["basic", "premium"].includes(tier)) {
			return error(res, "tier must be 'basic' or 'premium'", 400);
		}

		const customer = await Customer.findById(customerId);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		// Check if already subscribed
		if (
			customer.subscriptionTier !== "none" &&
			customer.subscriptionEndDate &&
			new Date(customer.subscriptionEndDate) > new Date()
		) {
			return error(res, "You already have an active subscription", 400);
		}

		const settings = await Settings.getSettings();
		const planConfig = settings?.subscriptionPlans?.[tier];

		// TODO: Process payment with Stripe using paymentMethodId
		// For now, we'll just update the subscription

		const startDate = new Date();
		const endDate = new Date();
		endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

		customer.subscriptionTier = tier;
		customer.subscriptionStartDate = startDate;
		customer.subscriptionEndDate = endDate;
		customer.subscriptionAutoRenew = true;
		customer.washesRemaining = tier === "premium"
			? (planConfig?.washesIncluded || 6)
			: (planConfig?.washesIncluded || 3);

		await customer.save();

		return success(
			res,
			{
				subscription: {
					tier: customer.subscriptionTier,
					isActive: true,
					startDate: customer.subscriptionStartDate,
					endDate: customer.subscriptionEndDate,
					autoRenew: customer.subscriptionAutoRenew,
					washesRemaining: customer.washesRemaining,
				},
			},
			"Subscription activated successfully"
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/mobile/subscriptions/cancel
 * Cancel subscription auto-renewal
 */
export const cancelSubscription = async (req, res) => {
	try {
		const customerId = req.user.id;

		const customer = await Customer.findById(customerId);
		if (!customer) {
			return error(res, "Customer not found", 404);
		}

		if (customer.subscriptionTier === "none") {
			return error(res, "No active subscription to cancel", 400);
		}

		customer.subscriptionAutoRenew = false;
		await customer.save();

		return success(
			res,
			{
				subscription: {
					tier: customer.subscriptionTier,
					endDate: customer.subscriptionEndDate,
					autoRenew: false,
					message: "Your subscription will end on the expiry date",
				},
			},
			"Auto-renewal cancelled"
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};
