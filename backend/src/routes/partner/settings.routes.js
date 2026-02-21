import express from "express";
import {
	changePassword,
	getSettings,
	updateSettings,
} from "../../controllers/partner/settings.controller.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/", updateSettings);
router.post("/password", changePassword);

export default router;
