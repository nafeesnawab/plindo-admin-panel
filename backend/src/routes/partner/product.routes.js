import express from "express";
import {
	cancelProductOrder,
	createProduct,
	deleteProduct,
	getProductById,
	getProductOrderById,
	getProductOrders,
	getProducts,
	toggleAvailability,
	updateOrderStatus,
	updateProduct,
	updateStock,
} from "../../controllers/partner/product.controller.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", createProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/stock", updateStock);
router.patch("/:id/toggle", toggleAvailability);

export { cancelProductOrder, getProductOrderById, getProductOrders, updateOrderStatus };
export default router;
