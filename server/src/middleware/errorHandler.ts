import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Express Error Handler caught exception:', err);

  if (err.message && err.message.startsWith('INVALID_')) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: err.message
    });
  }

  // Prevent leaking internal stack traces or connection strings in production responses
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected database or server error occurred. Please check server logs.'
  });
}
