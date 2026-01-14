import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AssistantPermissions } from '../../domain/entities/Assistant';

export type UserRole = 'doctor' | 'assistant';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  doctorId: string; // For doctors, this is their own ID. For assistants, this is their doctor's ID.
  permissions?: AssistantPermissions;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  doctorId?: string; // Convenience property - always the doctor's ID
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id?: string;
      doctorId?: string;
      email: string;
      name?: string;
      role?: UserRole;
      permissions?: AssistantPermissions;
    };

    // Handle both old (doctor-only) tokens and new (role-based) tokens
    const role: UserRole = decoded.role || 'doctor';
    const doctorId = role === 'doctor' ? (decoded.doctorId || decoded.id) : decoded.doctorId;

    if (!doctorId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: decoded.id || doctorId,
      email: decoded.email,
      name: decoded.name,
      role,
      doctorId,
      permissions: decoded.permissions,
    };

    // Set doctorId for backwards compatibility
    req.doctorId = doctorId;

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to require doctor role
export const doctorOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({ error: 'Access denied. Doctor role required.' });
  }
  next();
};

// Middleware to check specific permissions
export const requirePermission = (permission: keyof AssistantPermissions) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Doctors have all permissions
    if (req.user?.role === 'doctor') {
      return next();
    }

    // Check assistant permission
    if (req.user?.permissions && req.user.permissions[permission]) {
      return next();
    }

    return res.status(403).json({ error: `Access denied. Missing permission: ${permission}` });
  };
};
