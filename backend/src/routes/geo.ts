import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { detectSectorForPoint } from '../lib/geo'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/sectors/detect-location  — GPS point → sector
router.post('/detect-location', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body
    if (!lat || !lng) return res.status(400).json({ error: 'lat y lng requeridos' })

    const sectors = await prisma.sector.findMany({
      where: { polygon: { not: null } },
      select: { id: true, nombre: true, centerLat: true, centerLng: true, polygon: true }
    })

    const found = detectSectorForPoint(parseFloat(lat), parseFloat(lng), sectors)
    res.json({ sector: found ?? null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error en detección de sector' })
  }
})

// GET /api/map/sector-stats  — heatmap data for the map page
router.get('/sector-stats', async (_req, res: Response) => {
  try {
    const sectors = await prisma.sector.findMany()

    const stats = await Promise.all(
      sectors.map(async (s) => {
        const [total, volunteers] = await Promise.all([
          prisma.citizen.count({ where: { sectorGeoId: s.id } }),
          prisma.citizen.count({ where: { sectorGeoId: s.id, voluntario: true } }),
        ])

        const week = new Date(); week.setDate(week.getDate() - 7)
        const prevWeek = new Date(); prevWeek.setDate(prevWeek.getDate() - 14)
        const [thisWeek, lastWeek] = await Promise.all([
          prisma.citizen.count({ where: { sectorGeoId: s.id, createdAt: { gte: week } } }),
          prisma.citizen.count({ where: { sectorGeoId: s.id, createdAt: { gte: prevWeek, lt: week } } }),
        ])

        const weeklyGrowthPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0

        // Top priority
        const citizens = await prisma.citizen.findMany({
          where: { sectorGeoId: s.id },
          select: { prioridades: true, nivelApoyo: true, scorePolit: true }
        })
        const prioCount: Record<string, number> = {}
        citizens.forEach(c => {
          try { JSON.parse(c.prioridades || '[]').forEach((p: string) => { prioCount[p] = (prioCount[p] || 0) + 1 }) } catch {}
        })
        const topPriority = Object.entries(prioCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        const supportScore = citizens.length > 0
          ? Math.round(citizens.reduce((s, c) => s + c.scorePolit, 0) / citizens.length)
          : 0

        return {
          id: s.id,
          nombre: s.nombre,
          zone: s.zone,
          municipality: s.municipality,
          centerLat: s.centerLat,
          centerLng: s.centerLng,
          polygon: s.polygon,
          totalCitizens: total,
          totalVolunteers: volunteers,
          weeklyGrowth: thisWeek,
          weeklyGrowthPct,
          topPriority,
          supportScore,
        }
      })
    )

    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener estadísticas del mapa' })
  }
})

// GET /api/map/sector/:id  — deep sector intelligence
router.get('/sector/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const sectorId = parseInt(req.params.id)
    const sector = await prisma.sector.findUnique({ where: { id: sectorId } })
    if (!sector) return res.status(404).json({ error: 'Sector no encontrado' })

    const citizens = await prisma.citizen.findMany({
      where: { sectorGeoId: sectorId },
      select: { prioridades: true, nivelApoyo: true, scorePolit: true, voluntario: true, problemaComunidad: true, createdAt: true }
    })

    const week = new Date(); week.setDate(week.getDate() - 7)
    const prioCount: Record<string, number> = {}
    const nivelCount: Record<string, number> = {}
    const problemas: string[] = []
    let weeklyNew = 0

    citizens.forEach(c => {
      try { JSON.parse(c.prioridades || '[]').forEach((p: string) => { prioCount[p] = (prioCount[p] || 0) + 1 }) } catch {}
      nivelCount[c.nivelApoyo] = (nivelCount[c.nivelApoyo] || 0) + 1
      if (c.problemaComunidad) problemas.push(c.problemaComunidad)
      if (new Date(c.createdAt) >= week) weeklyNew++
    })

    const prioridades = Object.entries(prioCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, votos]) => ({ nombre, votos }))
    const scorePromedio = citizens.length > 0 ? Math.round(citizens.reduce((s, c) => s + c.scorePolit, 0) / citizens.length) : 0

    // Registration events for this sector
    const events = await prisma.registrationEvent.count({ where: { sectorId } })

    res.json({
      sector,
      total: citizens.length,
      voluntarios: citizens.filter(c => c.voluntario).length,
      weeklyNew,
      scorePromedio,
      nivelApoyo: nivelCount,
      prioridades,
      problemasRecientes: problemas.slice(-8),
      eventosRegistro: events,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener inteligencia del sector' })
  }
})

// POST /api/citizen-locations  — save GPS location for a citizen
router.post('/citizen-locations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { citizenId, sectorId, latitude, longitude, locationSource, accuracyMeters, addressText } = req.body
    if (!citizenId) return res.status(400).json({ error: 'citizenId requerido' })

    const loc = await prisma.citizenLocation.upsert({
      where: { citizenId },
      update: { sectorId, latitude, longitude, locationSource, accuracyMeters, addressText },
      create: { citizenId, sectorId, latitude, longitude, locationSource: locationSource ?? 'manual_sector', accuracyMeters, addressText }
    })
    res.json(loc)
  } catch {
    res.status(500).json({ error: 'Error al guardar ubicación' })
  }
})

// POST /api/registration-events
router.post('/registration-events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { citizenId, sectorId, registrationLat, registrationLng, registrationMethod } = req.body
    if (!citizenId) return res.status(400).json({ error: 'citizenId requerido' })

    const event = await prisma.registrationEvent.create({
      data: {
        citizenId,
        promoterId: req.user!.id,
        sectorId,
        registrationLat,
        registrationLng,
        registrationMethod: registrationMethod ?? 'web_form',
      }
    })
    res.status(201).json(event)
  } catch {
    res.status(500).json({ error: 'Error al crear evento de registro' })
  }
})

export default router
