import FAQ from "../models/FAQ.model.js";
import LegalContent from "../models/LegalContent.model.js";
import { error, success } from "../utils/response.js";

const getOrCreateContent = async (type) => {
	let doc = await LegalContent.findOne({ type });
	if (!doc) {
		doc = await LegalContent.create({
			type,
			content: "",
			version: "1.0",
			isActive: true,
			publishedBy: "system",
		});
	}
	return doc;
};

const formatVersion = (doc) => ({
	id: doc._id,
	version: doc.version,
	content: doc.content,
	publishedAt: doc.updatedAt,
	publishedBy: doc.publishedBy || "admin",
	isActive: doc.isActive,
});

/**
 * GET /api/legal/terms
 */
export const getTerms = async (req, res) => {
	try {
		const doc = await getOrCreateContent("terms");
		return success(res, formatVersion(doc));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/legal/terms/history
 */
export const getTermsHistory = async (req, res) => {
	try {
		const docs = await LegalContent.find({ type: "terms" }).sort({
			updatedAt: -1,
		});
		return success(res, docs.map(formatVersion));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/legal/terms
 */
export const updateTerms = async (req, res) => {
	try {
		const { content } = req.body;
		const doc = await LegalContent.findOneAndUpdate(
			{ type: "terms" },
			{ content, publishedBy: req.user.email || "admin", isActive: true },
			{ new: true, upsert: true },
		);
		return success(res, formatVersion(doc), "Terms updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/legal/privacy
 */
export const getPrivacy = async (req, res) => {
	try {
		const doc = await getOrCreateContent("privacy");
		return success(res, formatVersion(doc));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/legal/privacy/history
 */
export const getPrivacyHistory = async (req, res) => {
	try {
		const docs = await LegalContent.find({ type: "privacy" }).sort({
			updatedAt: -1,
		});
		return success(res, docs.map(formatVersion));
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/legal/privacy
 */
export const updatePrivacy = async (req, res) => {
	try {
		const { content } = req.body;
		const doc = await LegalContent.findOneAndUpdate(
			{ type: "privacy" },
			{ content, publishedBy: req.user.email || "admin", isActive: true },
			{ new: true, upsert: true },
		);
		return success(res, formatVersion(doc), "Privacy policy updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/legal/refund
 */
export const getRefund = async (req, res) => {
	try {
		const doc = await getOrCreateContent("refund");
		return success(res, {
			id: doc._id,
			content: doc.content,
			updatedAt: doc.updatedAt,
			updatedBy: doc.publishedBy || "admin",
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/legal/refund
 */
export const updateRefund = async (req, res) => {
	try {
		const { content } = req.body;
		const doc = await LegalContent.findOneAndUpdate(
			{ type: "refund" },
			{ content, publishedBy: req.user.email || "admin" },
			{ new: true, upsert: true },
		);
		return success(
			res,
			{
				id: doc._id,
				content: doc.content,
				updatedAt: doc.updatedAt,
				updatedBy: doc.publishedBy,
			},
			"Refund policy updated",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/legal/about
 */
export const getAbout = async (req, res) => {
	try {
		const doc = await getOrCreateContent("about");
		let data = {};
		try {
			data = JSON.parse(doc.content || "{}");
		} catch {
			data = {};
		}
		return success(res, {
			id: doc._id,
			companyName: data.companyName || "Plindo",
			tagline: data.tagline || "",
			description: data.description || "",
			email: data.email || "",
			phone: data.phone || "",
			address: data.address || "",
			socialLinks: data.socialLinks || {
				facebook: "",
				twitter: "",
				instagram: "",
				linkedin: "",
			},
			updatedAt: doc.updatedAt,
		});
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/legal/about
 */
export const updateAbout = async (req, res) => {
	try {
		const doc = await LegalContent.findOneAndUpdate(
			{ type: "about" },
			{
				content: JSON.stringify(req.body),
				publishedBy: req.user.email || "admin",
			},
			{ new: true, upsert: true },
		);
		let data = {};
		try {
			data = JSON.parse(doc.content || "{}");
		} catch {
			data = {};
		}
		return success(
			res,
			{ id: doc._id, ...data, updatedAt: doc.updatedAt },
			"About us updated",
		);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * GET /api/legal/faqs
 */
export const getFAQs = async (req, res) => {
	try {
		const filter = {};
		if (req.query.category) filter.category = req.query.category;
		if (req.query.activeOnly === "true") filter.isActive = true;
		const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: 1 });
		const categories = [
			...new Set(faqs.map((f) => f.category).filter(Boolean)),
		];
		return success(res, { faqs, categories });
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * POST /api/legal/faqs
 */
export const createFAQ = async (req, res) => {
	try {
		const { question, answer, category } = req.body;
		const count = await FAQ.countDocuments();
		const faq = await FAQ.create({
			question,
			answer,
			category,
			order: count + 1,
			isActive: true,
		});
		return success(res, faq, "FAQ created", 201);
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/legal/faqs/:id
 */
export const updateFAQ = async (req, res) => {
	try {
		const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		if (!faq) return error(res, "FAQ not found", 404);
		return success(res, faq, "FAQ updated");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * DELETE /api/legal/faqs/:id
 */
export const deleteFAQ = async (req, res) => {
	try {
		const faq = await FAQ.findByIdAndDelete(req.params.id);
		if (!faq) return error(res, "FAQ not found", 404);
		return success(res, {}, "FAQ deleted");
	} catch (err) {
		return error(res, err.message, 500);
	}
};

/**
 * PUT /api/legal/faqs/reorder
 */
export const reorderFAQs = async (req, res) => {
	try {
		const { ids } = req.body;
		await Promise.all(
			ids.map((id, index) => FAQ.findByIdAndUpdate(id, { order: index + 1 })),
		);
		return success(res, {}, "FAQs reordered");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
