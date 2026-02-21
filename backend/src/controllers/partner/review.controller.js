import Review from "../../models/Review.model.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/reviews
 */
export const getReviews = async (req, res) => {
	try {
		const filter = { partnerId: req.user.partnerId };
		if (req.query.rating && req.query.rating !== "all") {
			filter.rating = parseInt(req.query.rating);
		}
		if (req.query.search) {
			filter.$or = [
				{ customerName: { $regex: req.query.search, $options: "i" } },
				{ comment: { $regex: req.query.search, $options: "i" } },
			];
		}

		const docs = await Review.find(filter).sort({ createdAt: -1 });
		const reviews = docs.map((r) => ({
			id: r._id,
			customerId: r.customerId,
			customerName: r.customerName,
			isAnonymous: r.isAnonymous || false,
			rating: r.rating,
			reviewText: r.reviewText,
			date: r.createdAt.toISOString().split("T")[0],
			bookingId: r.bookingId,
			service: r.service || "",
			partnerResponse: r.partnerResponse || undefined,
		}));

		return success(res, { reviews });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/reviews/:id/respond
 */
export const respondToReview = async (req, res) => {
	try {
		const { text } = req.body;
		const review = await Review.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			{
				partnerResponse: { text, date: new Date().toISOString().split("T")[0] },
			},
			{ new: true },
		);
		if (!review) return error(res, "Review not found", 404);

		return success(
			res,
			{
				review: {
					id: review._id,
					partnerResponse: review.partnerResponse,
				},
			},
			"Response submitted successfully",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/partner/reviews/:id/respond
 */
export const deleteResponse = async (req, res) => {
	try {
		const review = await Review.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			{ $unset: { partnerResponse: 1 } },
			{ new: true },
		);
		if (!review) return error(res, "Review not found", 404);
		return success(res, {}, "Response deleted successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
