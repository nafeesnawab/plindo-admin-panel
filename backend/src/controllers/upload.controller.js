import { error, success } from "../utils/response.js";

export const uploadFile = async (req, res) => {
	try {
		if (!req.file) {
			return error(res, "No file uploaded", 400);
		}

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
	} catch (err) {
		return error(res, err.message, 500);
	}
};

export const uploadMultipleFiles = async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return error(res, "No files uploaded", 400);
		}

		const files = req.files.map((file) => ({
			url: `/uploads/${file.filename}`,
			filename: file.filename,
			originalName: file.originalname,
			size: file.size,
			mimetype: file.mimetype,
		}));

		return success(res, { files }, "Files uploaded successfully");
	} catch (err) {
		return error(res, err.message, 500);
	}
};
