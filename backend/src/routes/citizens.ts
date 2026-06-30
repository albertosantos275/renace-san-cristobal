import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, requirePromoterOrAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

function calcScore(data: any): number {
  let score = 0
  if (data.voluntario) score += 20
  if (data.nivelApoyo === 'SIMPATIZANTE') score += 15
  if (data.nivelApoyo === 'APOYA') score += 25
  if (data.nivelApoyo === 'MUY_COMPROMETIDO') score += 30
  if (data.nivelApoyo === 'LIDER_COMUNITARIO') score += 40
  if (data.whatsappUpdates) score += 10
  if (data.problemaComunidad && data.problemaComunidad.trim().length > 10) score += 10
  return Math.min(score, 100)
}

// Public: register citizen
router.post('/public', async (req: any, res: Response) => {
  try {
    const {
      nombreCompleto, cedula, telefono, edad, sexo, sector, sectorGeoId,
      votaEnSanCristobal, whatsappUpdates, voluntario, nivelApoyo,
      prioridades, problemaComunidad, registradoPorNombre
    } = req.body

    if (!nombreCompleto || !cedula || !telefono) {
      return res.status(400).json({ error: 'Nombre, cédula y teléfono son requeridos' })
    }

    const existing = await prisma.citizen.findFirst({
      where: { OR: [{ cedula }, { telefono }] }
    })
    if (existing) {
      const field = existing.cedula === cedula ? 'cédula' : 'teléfono'
      return res.status(409).json({ error: `Ya existe un ciudadano registrado con esa ${field}` })
    }

    const score = calcScore({ voluntario, nivelApoyo, whatsappUpdates, problemaComunidad })

    const citizen = await prisma.citizen.create({
      data: {
        nombreCompleto: nombreCompleto.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        edad: edad ? parseInt(edad) : null,
        sexo: sexo || null,
        sector: sector || null,
        sectorGeoId: sectorGeoId ? parseInt(sectorGeoId) : null,
        votaEnSanCristobal: Boolean(votaEnSanCristobal),
        whatsappUpdates: Boolean(whatsappUpdates),
        voluntario: Boolean(voluntario),
        nivelApoyo: nivelApoyo || 'NEUTRAL',
        prioridades: JSON.stringify(prioridades || []),
        problemaComunidad: problemaComunidad?.trim() || null,
        scorePolit: score,
      }
    })

    await prisma.auditLog.create({
      data: { accion: 'ciudadano_creado', entidad: 'citizen', entidadId: String(citizen.id), detalle: `Registro público: ${nombreCompleto}` }
    })

    res.status(201).json({ success: true, id: citizen.id })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Cédula o teléfono ya registrado' })
    }
    res.status(500).json({ error: 'Error al registrar ciudadano' })
  }
})

// Protected: get all citizens (admin) or own (promoter)
router.get('/', authenticate, requirePromoterOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { search, sector, voluntario, nivelApoyo, promotor, periodo, page = '1', limit = '50' } = req.query as any
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: any = {}

    if (req.user!.rol === 'PROMOTER') {
      where.registradoPorId = req.user!.id
    }

    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search } },
        { cedula: { contains: search } },
        { telefono: { contains: search } },
      ]
    }
    if (sector) where.sector = sector
    if (voluntario === 'true') where.voluntario = true
    if (nivelApoyo) where.nivelApoyo = nivelApoyo
    if (promotor && req.user!.rol === 'ADMIN') where.registradoPorId = parseInt(promotor)

    if (periodo === 'hoy') {
      const today = new Date(); today.setHours(0,0,0,0)
      where.createdAt = { gte: today }
    } else if (periodo === 'semana') {
      const week = new Date(); week.setDate(week.getDate() - 7)
      where.createdAt = { gte: week }
    } else if (periodo === 'mes') {
      const month = new Date(); month.setDate(month.getDate() - 30)
      where.createdAt = { gte: month }
    }

    const [total, citizens] = await Promise.all([
      prisma.citizen.count({ where }),
      prisma.citizen.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          registradoPor: { select: { id: true, nombre: true } },
          _count: { select: { referidos: true } },
        }
      })
    ])

    res.json({ total, page: parseInt(page), citizens })
  } catch {
    res.status(500).json({ error: 'Error al obtener ciudadanos' })
  }
})

// Get single citizen
router.get('/:id', authenticate, requirePromoterOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const citizen = await prisma.citizen.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { registradoPor: { select: { id: true, nombre: true } } }
    })
    if (!citizen) return res.status(404).json({ error: 'Ciudadano no encontrado' })

    if (req.user!.rol === 'PROMOTER' && citizen.registradoPorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }

    res.json(citizen)
  } catch {
    res.status(500).json({ error: 'Error al obtener ciudadano' })
  }
})

// Create (authenticated)
router.post('/', authenticate, requirePromoterOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      nombreCompleto, cedula, telefono, edad, sexo, sector, sectorGeoId,
      votaEnSanCristobal, whatsappUpdates, voluntario, nivelApoyo,
      prioridades, problemaComunidad, referidoPorId
    } = req.body

    if (!nombreCompleto || !cedula || !telefono) {
      return res.status(400).json({ error: 'Nombre, cédula y teléfono son requeridos' })
    }

    const existing = await prisma.citizen.findFirst({
      where: { OR: [{ cedula }, { telefono }] }
    })
    if (existing) {
      const field = existing.cedula === cedula ? 'cédula' : 'teléfono'
      return res.status(409).json({ error: `Ya existe un ciudadano con esa ${field}` })
    }

    const score = calcScore({ voluntario, nivelApoyo, whatsappUpdates, problemaComunidad })

    const citizen = await prisma.citizen.create({
      data: {
        nombreCompleto: nombreCompleto.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        edad: edad ? parseInt(edad) : null,
        sexo: sexo || null,
        sector: sector || null,
        sectorGeoId: sectorGeoId ? parseInt(sectorGeoId) : null,
        votaEnSanCristobal: Boolean(votaEnSanCristobal),
        whatsappUpdates: Boolean(whatsappUpdates),
        voluntario: Boolean(voluntario),
        nivelApoyo: nivelApoyo || 'NEUTRAL',
        prioridades: JSON.stringify(prioridades || []),
        problemaComunidad: problemaComunidad?.trim() || null,
        scorePolit: score,
        registradoPorId: req.user!.id,
        referidoPorId: referidoPorId ? parseInt(referidoPorId) : null,
      }
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.id, accion: 'ciudadano_creado', entidad: 'citizen', entidadId: String(citizen.id) }
    })

    res.status(201).json(citizen)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cédula o teléfono ya registrado' })
    res.status(500).json({ error: 'Error al crear ciudadano' })
  }
})

// Update
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { prioridades, ...rest } = req.body
    const score = calcScore(req.body)
    const citizen = await prisma.citizen.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...rest,
        prioridades: prioridades ? JSON.stringify(prioridades) : undefined,
        scorePolit: score,
      }
    })
    await prisma.auditLog.create({
      data: { userId: req.user!.id, accion: 'ciudadano_editado', entidad: 'citizen', entidadId: String(citizen.id) }
    })
    res.json(citizen)
  } catch {
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

// Delete
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.citizen.delete({ where: { id: parseInt(req.params.id) } })
    await prisma.auditLog.create({
      data: { userId: req.user!.id, accion: 'ciudadano_eliminado', entidad: 'citizen', entidadId: req.params.id }
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Error al eliminar' })
  }
})

export default router
