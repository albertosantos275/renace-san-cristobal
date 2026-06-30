import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/sectors  — full list with citizen count
router.get('/', async (_req, res: Response) => {
  try {
    const sectors = await prisma.sector.findMany({ orderBy: { nombre: 'asc' } })
    const withCount = await Promise.all(
      sectors.map(async (s) => {
        const count = await prisma.citizen.count({ where: { sectorGeoId: s.id } })
        return { ...s, ciudadanos: count }
      })
    )
    res.json(withCount)
  } catch {
    res.status(500).json({ error: 'Error al obtener sectores' })
  }
})

// GET /api/sectors/search?q=  — autocomplete search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json([])

    const sectors = await prisma.sector.findMany({
      where: { nombre: { contains: q } },
      orderBy: { nombre: 'asc' },
      take: 8,
      select: { id: true, nombre: true, zone: true, centerLat: true, centerLng: true }
    })
    res.json(sectors)
  } catch {
    res.status(500).json({ error: 'Error en búsqueda' })
  }
})

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre } = req.body
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })
    const sector = await prisma.sector.create({ data: { nombre: nombre.trim() } })
    res.status(201).json(sector)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Sector ya existe' })
    res.status(500).json({ error: 'Error al crear sector' })
  }
})

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre } = req.body
    const sector = await prisma.sector.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre: nombre.trim() }
    })
    res.json(sector)
  } catch {
    res.status(500).json({ error: 'Error al actualizar sector' })
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.sector.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Error al eliminar sector' })
  }
})

export default router
