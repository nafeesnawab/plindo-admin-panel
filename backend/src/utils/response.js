/**
 * Standard success response matching frontend format:
 * { status: 0, message: "", data: { ... } }
 */
export const success = (res, data = {}, message = '', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 0,
    message,
    data,
  });
};

/**
 * Standard error response matching frontend format:
 * { status: <errorCode>, message: "..." }
 */
export const error = (res, message = 'Internal Server Error', statusCode = 500, errorCode = -1) => {
  return res.status(statusCode).json({
    status: errorCode,
    message,
  });
};
