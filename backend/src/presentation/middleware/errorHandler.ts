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

  // Respect status codes set by framework errors (e.g. body-parser's 413
  // "request entity too large") instead of masking them as a generic 500.
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { statusCode?: number }).statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message });
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

  // Local single-tenant desktop app: surface the real reason so operators can
  // see WHY a save failed (e.g. "SQLITE_FULL: database or disk is full",
  // "disk I/O error", a checkpoint EBUSY) instead of a useless generic 500.
  return res.status(500).json({
    error: 'Internal server error',
    detail: err.message,
    code: (err as { code?: string }).code,
  });
};
