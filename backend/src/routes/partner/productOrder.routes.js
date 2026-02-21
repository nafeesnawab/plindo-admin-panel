import express from "express";
import {
	cancelProductOrder,
	getProductOrderById,
	getProductOrders,
	updateOrderStatus,
} from "../../controllers/partner/product.controller.js";

const router = express.Router();

router.get("/", getProductOrders);
router.get("/:id", getProductOrderById);
router.patch("/:id/status", updateOrderStatus);
router.post("/:id/cancel", cancelProductOrder);

export default router;
