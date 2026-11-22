import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'amigo-secreto-navidad-2026-secret-key-render';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'navidad2026';

export interface AuthRequest extends Request {
  isAdmin?: boolean;
}

// Middleware to protect admin routes
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Inicia sesión como administrador.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean };
    if (decoded?.isAdmin) {
      req.isAdmin = true;
      return next();
    }
  } catch {
    // invalid token
  }

  return res.status(401).json({ error: 'Token de sesión inválido o expirado.' });
}

// Check auth status
router.get('/me', (req: AuthRequest, res: Response) => {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.json({ isAdmin: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean };
    return res.json({ isAdmin: Boolean(decoded?.isAdmin) });
  } catch {
    return res.json({ isAdmin: false });
  }
});

// Admin login
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Por favor ingresa la contraseña' });
  }

  if (password.trim() !== ADMIN_PASSWORD.trim()) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });

  // Set HTTP-only cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json({
    success: true,
    token,
    message: 'Sesión iniciada con éxito',
  });
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('admin_token');
  return res.json({ success: true, message: 'Sesión cerrada' });
});

export default router;
