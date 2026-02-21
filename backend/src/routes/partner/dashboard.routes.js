import express from "express";
import { getPartnerDashboard } from "../../controllers/partner/dashboard.controller.js";

const router = express.Router();

router.get("/", getPartnerDashboard);

export default router;
