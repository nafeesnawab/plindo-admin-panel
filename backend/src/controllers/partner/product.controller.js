import Product from "../../models/Product.model.js";
import ProductOrder from "../../models/ProductOrder.model.js";
import { paginate, paginatedResponse } from "../../utils/pagination.js";
import { error, success } from "../../utils/response.js";

/**
 * GET /api/partner/products
 */
export const getProducts = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { partnerId: req.user.partnerId };
		if (req.query.search) {
			filter.$or = [
				{ name: { $regex: req.query.search, $options: "i" } },
				{ category: { $regex: req.query.search, $options: "i" } },
			];
		}
		if (req.query.category) filter.category = req.query.category;
		if (req.query.status) filter.status = req.query.status;

		const [items, total] = await Promise.all([
			Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Product.countDocuments(filter),
		]);

		return success(res, paginatedResponse(items, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/products
 */
export const createProduct = async (req, res) => {
	try {
		const product = await Product.create({
			...req.body,
			partnerId: req.user.partnerId,
		});
		return success(res, { product }, "Product created", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/products/:id
 */
export const getProductById = async (req, res) => {
	try {
		const product = await Product.findOne({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!product) return error(res, "Product not found", 404);
		return success(res, { product });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/partner/products/:id
 */
export const updateProduct = async (req, res) => {
	try {
		const product = await Product.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			req.body,
			{ new: true },
		);
		if (!product) return error(res, "Product not found", 404);
		return success(res, { product }, "Product updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/partner/products/:id
 */
export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findOneAndDelete({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!product) return error(res, "Product not found", 404);
		return success(res, {}, "Product deleted");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PATCH /api/partner/products/:id/stock
 */
export const updateStock = async (req, res) => {
	try {
		const product = await Product.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			{ stock: req.body.stock },
			{ new: true },
		);
		if (!product) return error(res, "Product not found", 404);
		return success(res, { product }, "Stock updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PATCH /api/partner/products/:id/toggle
 */
export const toggleAvailability = async (req, res) => {
	try {
		const product = await Product.findOne({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!product) return error(res, "Product not found", 404);
		product.status =
			product.status === "available" ? "unavailable" : "available";
		await product.save();
		return success(
			res,
			{ product },
			`Product ${product.status === "available" ? "enabled" : "disabled"}`,
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/product-orders
 */
export const getProductOrders = async (req, res) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const filter = { partnerId: req.user.partnerId };
		if (req.query.status) filter.status = req.query.status;

		const [items, total] = await Promise.all([
			ProductOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			ProductOrder.countDocuments(filter),
		]);

		return success(res, paginatedResponse(items, total, page, limit));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/partner/product-orders/:id
 */
export const getProductOrderById = async (req, res) => {
	try {
		const order = await ProductOrder.findOne({
			_id: req.params.id,
			partnerId: req.user.partnerId,
		});
		if (!order) return error(res, "Order not found", 404);
		return success(res, { order });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PATCH /api/partner/product-orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
	try {
		const order = await ProductOrder.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			{ status: req.body.status },
			{ new: true },
		);
		if (!order) return error(res, "Order not found", 404);
		return success(res, { order }, "Order status updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/partner/product-orders/:id/cancel
 */
export const cancelProductOrder = async (req, res) => {
	try {
		const order = await ProductOrder.findOneAndUpdate(
			{ _id: req.params.id, partnerId: req.user.partnerId },
			{
				status: "cancelled",
				cancelledAt: new Date(),
				cancellationReason: req.body.reason,
			},
			{ new: true },
		);
		if (!order) return error(res, "Order not found", 404);
		return success(res, { order }, "Order cancelled");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
