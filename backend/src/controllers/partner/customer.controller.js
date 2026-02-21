import Booking from "../../models/Booking.model.js";
import Customer from "../../models/Customer.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/customers
 * Returns customers who have at least one booking with this partner.
 */
export const getPartnerCustomers = async (req, res) => {
	try {
		const partnerId = req.user.partnerId;

		// Get unique customer IDs from this partner's bookings
		const customerIds = await Booking.distinct("customerId", { partnerId });

		if (customerIds.length === 0) {
			return success(res, { customers: [], total: 0 });
		}

		const filter = { _id: { $in: customerIds } };

		if (req.query.search) {
			const re = { $regex: req.query.search, $options: "i" };
			filter.$or = [{ name: re }, { email: re }, { phone: re }];
		}
		if (req.query.status && req.query.status !== "all") {
			filter.status = req.query.status;
		}

		const customers = await Customer.find(filter).sort({ createdAt: -1 });

		// Attach booking stats per customer for this partner
		const bookingStats = await Booking.aggregate([
			{ $match: { partnerId, customerId: { $in: customerIds } } },
			{ $group: { _id: "$customerId", count: { $sum: 1 }, totalSpent: { $sum: "$pricing.finalPrice" } } },
		]);
		const statsMap = Object.fromEntries(bookingStats.map((b) => [b._id.toString(), b]));

		const formatted = customers.map((c) => ({
			id: c._id,
			name: c.name,
			email: c.email,
			phone: c.phone,
			status: c.status,
			registeredAt: c.createdAt,
			totalBookings: statsMap[c._id.toString()]?.count ?? 0,
			totalSpent: statsMap[c._id.toString()]?.totalSpent ?? 0,
			vehicles: c.vehicles ?? [],
			subscription: c.subscription ?? { active: false },
		}));

		return success(res, { customers: formatted, total: formatted.length });
	} catch (err) {
		return error(res, err.message, 500);
	}
};
