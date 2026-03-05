import express from "express";
import { protect, authorize } from "../../middleware/auth.middleware.js";
import RefundRequest from "../../models/RefundRequest.model.js";
import { success, error } from "../../utils/response.js";

const router = express.Router();
router.use(protect, authorize("admin"));

// GET /api/admin/refund-requests
router.get("/", async (req, res) => {
	try {
		const { status, from, to, page = 1, limit = 20 } = req.query;
		const filter = {};
		if (status) filter.status = status;
		if (from || to) {
			filter.createdAt = {};
			if (from) filter.createdAt.$gte = new Date(from);
			if (to) filter.createdAt.$lte = new Date(to);
		}

		const total = await RefundRequest.countDocuments(filter);
		const requests = await RefundRequest.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(Number(limit));

		const pendingCount = await RefundRequest.countDocuments({ status: "pending_review" });

		return success(res, {
			requests,
			total,
			pendingCount,
			page: Number(page),
			totalPages: Math.ceil(total / limit),
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// POST /api/admin/refund-requests/:id/approve
router.post("/:id/approve", async (req, res) => {
	try {
		const request = await RefundRequest.findById(req.params.id);
		if (!request) return error(res, "Refund request not found", 404);
		if (request.status !== "pending_review") return error(res, "Request already reviewed", 400);

		request.status = "approved";
		request.reviewedBy = req.user?.username || "Admin";
		request.reviewedAt = new Date();
		request.reviewNote = req.body.note || "";
		await request.save();

		return success(res, { message: "Refund approved", request });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// POST /api/admin/refund-requests/:id/reject
router.post("/:id/reject", async (req, res) => {
	try {
		const request = await RefundRequest.findById(req.params.id);
		if (!request) return error(res, "Refund request not found", 404);
		if (request.status !== "pending_review") return error(res, "Request already reviewed", 400);

		request.status = "rejected";
		request.reviewedBy = req.user?.username || "Admin";
		request.reviewedAt = new Date();
		request.reviewNote = req.body.note || "";
		await request.save();

		return success(res, { message: "Refund rejected", request });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

export default router;
