import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Partner from "../../models/Partner.model.js";
import { error, success } from "../../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
	destination: path.join(__dirname, "../../../..", process.env.UPLOAD_DIR || "uploads"),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		cb(null, `${Date.now()}-portfolio${ext}`);
	},
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// POST /api/partner/portfolio — upload image
router.post("/", upload.single("image"), async (req, res) => {
	try {
		const partner = await Partner.findById(req.user.id);
		if (!partner) return error(res, "Partner not found", 404);
		if ((partner.portfolioImages || []).length >= 10) return error(res, "Maximum 10 portfolio images allowed", 400);
		if (!req.file) return error(res, "No image uploaded", 400);

		const imageUrl = `/uploads/${req.file.filename}`;
		partner.portfolioImages = [...(partner.portfolioImages || []), imageUrl];
		await partner.save();

		return success(res, { portfolioImages: partner.portfolioImages });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// DELETE /api/partner/portfolio/:index — remove by index
router.delete("/:index", async (req, res) => {
	try {
		const partner = await Partner.findById(req.user.id);
		if (!partner) return error(res, "Partner not found", 404);
		const idx = parseInt(req.params.index);
		if (isNaN(idx) || idx < 0 || idx >= (partner.portfolioImages || []).length) {
			return error(res, "Invalid index", 400);
		}
		partner.portfolioImages.splice(idx, 1);
		await partner.save();
		return success(res, { portfolioImages: partner.portfolioImages });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

// PUT /api/partner/portfolio/reorder — save new order
router.put("/reorder", async (req, res) => {
	try {
		const { images } = req.body;
		if (!Array.isArray(images)) return error(res, "images must be an array", 400);
		const partner = await Partner.findById(req.user.id);
		if (!partner) return error(res, "Partner not found", 404);
		partner.portfolioImages = images.slice(0, 10);
		await partner.save();
		return success(res, { portfolioImages: partner.portfolioImages });
	} catch (err) {
		return error(res, err.message, 500);
	}
});

export default router;
