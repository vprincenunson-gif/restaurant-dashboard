/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'A record with this value already exists.',
          field: err.meta?.target?.[0],
        });
      case 'P2025':
        return res.status(404).json({ error: 'Record not found.' });
      case 'P2003':
        return res.status(400).json({ error: 'Referenced record does not exist.' });
      default:
        return res.status(400).json({ error: 'Database error.', code: err.code });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(status).json({ error: message, stack: err.stack });
  }

  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : message,
  });
};

module.exports = errorHandler;
