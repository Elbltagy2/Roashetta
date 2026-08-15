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
  // Checked before anything else on purpose. raw-body raises this with
  // status 400, so the generic 4xx branch below would swallow it, and the
  // console.error would print a stack trace for what is not a server fault:
  // the client hung up mid-upload (page reload, closed laptop, wifi drop).
  // Nothing was saved for that request.
  if ((err as { type?: string }).type === 'request.aborted') {
    const aborted = err as unknown as { expected?: number; received?: number };
    const detail = aborted.expected
      ? ` (${aborted.received ?? 0} of ${aborted.expected} bytes)`
      : '';
    console.warn(`Upload aborted by client${detail} — nothing was saved for that request.`);
    // Nothing to send: the socket is already gone.
    return res.status(499).end();
  }

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

  // Ownership failures ("Unauthorized access to patient") are a permission
  // problem, NOT an expired session. Returning 401 made the web app treat them
  // as a dead token and hard-redirect to /login, throwing away whatever the
  // doctor had open — including a prescription mid-save.
  if (err.message.includes('Unauthorized') || err.message.includes('Access denied')) {
    return res.status(403).json({ error: err.message });
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
