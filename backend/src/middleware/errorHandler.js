export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
