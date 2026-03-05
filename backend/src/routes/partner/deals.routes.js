import express from "express";
import PartnerDeal from "../../models/PartnerDeal.model.js";
import { error, success } from "../../utils/response.js";

const router = express.Router();

// GET /api/partner/deals
router.get("/", async (req, res) => {
	try {
		const deals = await PartnerDeal.find({ partnerId: req.user.id }).sort({ createdAt: -1 });
		return success(res, deals);
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// POST /api/partner/deals
router.post("/", async (req, res) => {
	try {
		const { title, description, services, originalPrice, discountedPrice, validUntil, isMonthlyPackage } = req.body;
		if (!title || !originalPrice || !discountedPrice) {
			return error(res, "title, originalPrice, and discountedPrice are required", 400);
		}
		const deal = await PartnerDeal.create({
			partnerId: req.user.id,
			title,
			description,
			services: services || [],
			originalPrice,
			discountedPrice,
			validUntil,
			isMonthlyPackage: isMonthlyPackage || false,
		});
		return success(res, deal, 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// PUT /api/partner/deals/:id
router.put("/:id", async (req, res) => {
	try {
		const deal = await PartnerDeal.findOne({ _id: req.params.id, partnerId: req.user.id });
		if (!deal) return error(res, "Deal not found", 404);
		Object.assign(deal, req.body);
		await deal.save();
		return success(res, deal);
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// DELETE /api/partner/deals/:id
router.delete("/:id", async (req, res) => {
	try {
		const deal = await PartnerDeal.findOneAndDelete({ _id: req.params.id, partnerId: req.user.id });
		if (!deal) return error(res, "Deal not found", 404);
		return success(res, { message: "Deal deleted" });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

export default router;
