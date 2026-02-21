import express from "express";
import {
	deleteResponse,
	getReviews,
	respondToReview,
} from "../../controllers/partner/review.controller.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/:id/respond", respondToReview);
router.delete("/:id/respond", deleteResponse);

export default router;
