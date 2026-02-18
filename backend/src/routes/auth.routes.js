import express from "express";
import {
	checkEmail,
	getApplicationStatus,
	getMe,
	refreshToken,
	register,
	registerPartner,
	unifiedSignIn,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/unified-signin", unifiedSignIn);
router.post("/register", register);
router.post("/partner/register", registerPartner);
router.get("/partner/application-status", getApplicationStatus);
router.get("/partner/check-email", checkEmail);
router.post("/refresh-token", refreshToken);

// Protected routes
router.get("/me", protect, getMe);

export default router;
