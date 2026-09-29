import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.JWT_SECRET || 'inventario_aio_super_secret_jwt_key_2026_xyz';

// --- Contraseñas con bcryptjs (schemaV2.sql: app_usuarios.password_hash) ---
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!password || !storedHash) return false;
    // Compatibilidad: si algún hash legacy pbkdf2 "salt:hash" existe, rechazarlo
    // de forma segura (los seeds nuevos ya usan bcrypt).
    if (!storedHash.startsWith('$2')) {
      return false;
    }
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

export interface TokenPayload {
  userId: number;
  username: string;
  rol: string;
  exp?: number;
}

export function createToken(payload: { userId: number; username: string; rol: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const parsedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (parsedBody.exp && parsedBody.exp < Date.now()) return null;
    return parsedBody;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sesión expirada o token inválido. Inicie sesión nuevamente.' });
  }

  req.user = payload;
  next();
}

export function optionalToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso restringido. Su rol (${req.user.rol}) no tiene permisos para realizar esta acción. Roles requeridos: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
