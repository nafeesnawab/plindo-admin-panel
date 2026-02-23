import { error, success } from "../../utils/response.js";

/**
 * Upload single or multiple files for mobile customers
 * POST /api/mobile/upload
 * Supports both single file (field: 'file') and multiple files (field: 'files')
 */
export const uploadFiles = async (req, res) => {
	try {
		if (req.files && req.files.length > 0) {
			const files = req.files.map((file) => ({
				url: `/uploads/${file.filename}`,
				filename: file.filename,
				originalName: file.originalname,
				size: file.size,
				mimetype: file.mimetype,
			}));

			return success(res, { files }, "Files uploaded successfully");
		} else if (req.file) {
			const fileUrl = `/uploads/${req.file.filename}`;

			return success(
				res,
				{
					url: fileUrl,
					filename: req.file.filename,
					originalName: req.file.originalname,
					size: req.file.size,
					mimetype: req.file.mimetype,
				},
				"File uploaded successfully",
			);
		} else {
			return error(res, "No file uploaded", 400);
		}
	} catch (err) {
		return error(res, err.message, 500);
	}
};
