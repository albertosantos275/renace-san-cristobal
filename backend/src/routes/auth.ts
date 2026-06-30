import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    await prisma.auditLog.create({
      data: { userId: user.id, accion: 'login', entidad: 'user', entidadId: String(user.id) }
    })

    res.json({
      token,
      user: {
        id: user.id, nombre: user.nombre, email: user.email, rol: user.rol,
        sectores: (() => { try { const v = JSON.parse(user.sectores || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } })(),
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, nombre: true, email: true, rol: true, sectores: true, createdAt: true }
    })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    let sectores: string[] = []
    try { const v = JSON.parse(user.sectores || '[]'); sectores = Array.isArray(v) ? v : [] } catch {}
    res.json({ ...user, sectores })
  } catch {
    res.status(500).json({ error: 'Error interno' })
  }
})

export default router
