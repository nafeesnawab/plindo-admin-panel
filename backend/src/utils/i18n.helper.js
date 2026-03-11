/**
 * Helper function to get translation from request
 * @param {Object} req - Express request object
 * @param {String} key - Translation key
 * @param {Object} options - Interpolation options
 * @returns {String} Translated string
 */
export const t = (req, key, options = {}) => {
	if (req.t) {
		return req.t(key, options);
	}
	return key;
};

/**
 * Get translation function bound to request
 * @param {Object} req - Express request object
 * @returns {Function} Translation function
 */
export const getT = (req) => {
	return (key, options = {}) => t(req, key, options);
};
