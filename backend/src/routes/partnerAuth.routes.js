import express from "express";
import {
	checkEmail,
	getApplicationStatus,
	registerPartner,
	unifiedSignIn,
} from "../controllers/auth.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// POST /api/partner/register  (multipart/form-data with files)
router.post("/register", upload.any(), registerPartner);

// POST /api/partner/login
router.post("/login", unifiedSignIn);

// GET /api/partner/application-status?email=
router.get("/application-status", getApplicationStatus);

// GET /api/partner/check-email?email=
router.get("/check-email", checkEmail);

export default router;
