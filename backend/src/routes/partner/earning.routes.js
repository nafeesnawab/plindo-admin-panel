import express from "express";
import {
	getChart,
	getOverview,
	getPayouts,
	getTransactions,
} from "../../controllers/partner/earning.controller.js";

const router = express.Router();

router.get("/overview", getOverview);
router.get("/transactions", getTransactions);
router.get("/payouts", getPayouts);
router.get("/chart", getChart);

export default router;
