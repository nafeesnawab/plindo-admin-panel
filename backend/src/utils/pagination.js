/**
 * Parse pagination params from query string.
 * Returns { page, limit, skip } for use with Mongoose .skip().limit()
 */
export const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build paginated response matching frontend format:
 * { items: [...], total, page, limit, totalPages }
 */
export const paginatedResponse = (items, total, page, limit) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
