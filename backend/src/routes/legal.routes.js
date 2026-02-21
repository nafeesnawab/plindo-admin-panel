import express from "express";
import {
	createFAQ,
	deleteFAQ,
	getAbout,
	getFAQs,
	getPrivacy,
	getPrivacyHistory,
	getRefund,
	getTerms,
	getTermsHistory,
	reorderFAQs,
	updateAbout,
	updateFAQ,
	updatePrivacy,
	updateRefund,
	updateTerms,
} from "../controllers/legal.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/terms/history", getTermsHistory);
router.get("/terms", getTerms);
router.put("/terms", updateTerms);
router.get("/privacy/history", getPrivacyHistory);
router.get("/privacy", getPrivacy);
router.put("/privacy", updatePrivacy);
router.get("/refund", getRefund);
router.put("/refund", updateRefund);
router.get("/about", getAbout);
router.put("/about", updateAbout);
router.get("/faqs", getFAQs);
router.post("/faqs", createFAQ);
router.put("/faqs/reorder", reorderFAQs);
router.put("/faqs/:id", updateFAQ);
router.delete("/faqs/:id", deleteFAQ);

export default router;
