import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Sectores se guarda como JSON array string (igual que Citizen.prioridades)
function parseSectores(raw: string | null | undefined): string[] {
  try { const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function serializeSectores(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value.filter(s => typeof s === 'string' && s.trim()) : [])
}

router.get('/', authenticate, requireAdmin, async (_req, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true, email: true, rol: true, sectores: true, metaCiudadanos: true, activo: true, createdAt: true },
      orderBy: { nombre: 'asc' }
    })

    const withStats = await Promise.all(
      users.map(async (u) => {
        const total = await prisma.citizen.count({ where: { registradoPorId: u.id } })
        const today = new Date(); today.setHours(0,0,0,0)
        const hoy = await prisma.citizen.count({ where: { registradoPorId: u.id, createdAt: { gte: today } } })
        const week = new Date(); week.setDate(week.getDate() - 7)
        const semana = await prisma.citizen.count({ where: { registradoPorId: u.id, createdAt: { gte: week } } })
        const ultimo = await prisma.citizen.findFirst({
          where: { registradoPorId: u.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true }
        })
        return { ...u, sectores: parseSectores(u.sectores), totalRegistros: total, registrosHoy: hoy, registrosSemana: semana, ultimoRegistro: ultimo?.createdAt }
      })
    )
    res.json(withStats)
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password, rol, sectores, metaCiudadanos } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        nombre, email: email.toLowerCase().trim(), passwordHash,
        rol: rol || 'PROMOTER', sectores: serializeSectores(sectores),
        metaCiudadanos: Number.isFinite(Number(metaCiudadanos)) ? Math.max(0, Math.trunc(Number(metaCiudadanos))) : 0,
      },
      select: { id: true, nombre: true, email: true, rol: true, sectores: true, metaCiudadanos: true, createdAt: true }
    })
    res.status(201).json({ ...user, sectores: parseSectores(user.sectores) })
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email ya registrado' })
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password, rol, sectores, activo, metaCiudadanos } = req.body
    const data: any = { nombre, rol, activo }
    if (email) data.email = email.toLowerCase().trim()
    if (password) data.passwordHash = await bcrypt.hash(password, 10)
    if (sectores !== undefined) data.sectores = serializeSectores(sectores)
    if (metaCiudadanos !== undefined) data.metaCiudadanos = Number.isFinite(Number(metaCiudadanos)) ? Math.max(0, Math.trunc(Number(metaCiudadanos))) : 0

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, nombre: true, email: true, rol: true, sectores: true, metaCiudadanos: true, activo: true }
    })
    res.json({ ...user, sectores: parseSectores(user.sectores) })
  } catch {
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false }
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})

export default router
