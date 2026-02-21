import multer from 'multer';

export const errorHandler = (err, req, res, _next) => {
	console.error(err.stack);

	// Multer errors (file too large, unexpected field, etc.)
	if (err instanceof multer.MulterError) {
		return res.status(400).json({
			status: -1,
			message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max size is 10MB.' : err.message,
		});
	}

	const statusCode = err.statusCode || 500;
	const message = err.message || 'Internal Server Error';

	res.status(statusCode).json({
		status: -1,
		message,
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	});
};
