import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Handle known error messages
  if (err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) {
    return res.status(401).json({ error: err.message });
  }

  if (err.message.includes('already exists') || err.message.includes('already registered')) {
    return res.status(409).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
};
