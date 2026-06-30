import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: number; email: string; rol: string; nombre: string }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthRequest['user']
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
  }
  next()
}

export function requirePromoterOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!['ADMIN', 'PROMOTER'].includes(req.user?.rol || '')) {
    return res.status(403).json({ error: 'Acceso denegado.' })
  }
  next()
}
