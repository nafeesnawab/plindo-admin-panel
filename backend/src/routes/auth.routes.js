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

// Unified sign-in (primary)
router.post("/unified-signin", unifiedSignIn);

// Legacy admin routes (from userService.ts)
router.post("/signin", unifiedSignIn);
router.post("/signup", register);
router.get("/logout", (req, res) =>
	res.json({ status: 0, message: "Logged out successfully", data: {} }),
);
router.post("/refresh", refreshToken);
router.post("/refresh-token", refreshToken);

// Admin register
router.post("/register", register);

// Partner auth (legacy paths under /auth — keep for backward compat)
router.post("/partner/register", registerPartner);
router.get("/partner/application-status", getApplicationStatus);
router.get("/partner/check-email", checkEmail);

// Protected routes
router.get("/me", protect, getMe);

export default router;
