import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Public stats
router.get('/public', async (_req, res: Response) => {
  try {
    const total = await prisma.citizen.count()

    const config = await prisma.config.findMany({
      where: { clave: { in: ['meta_ciudadana', 'slogan', 'registro_publico_activo'] } }
    })
    const configMap = Object.fromEntries(config.map(c => [c.clave, c.valor]))

    // Prioridades top
    const allCitizens = await prisma.citizen.findMany({ select: { prioridades: true } })
    const prioCount: Record<string, number> = {}
    allCitizens.forEach(c => {
      try {
        const ps = JSON.parse(c.prioridades || '[]') as string[]
        ps.forEach(p => { prioCount[p] = (prioCount[p] || 0) + 1 })
      } catch {}
    })
    const prioridades = Object.entries(prioCount)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Sectores top via groupBy
    const sectorGroups = await prisma.citizen.groupBy({
      by: ['sector'],
      _count: { id: true },
      where: { sector: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })
    const sectoresTop = sectorGroups.map(s => ({ sector: s.sector!, count: s._count.id }))

    // Comentarios recientes
    const comentarios = await prisma.citizen.findMany({
      where: { problemaComunidad: { not: null } },
      select: { nombreCompleto: true, sector: true, problemaComunidad: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json({
      total,
      meta: parseInt(configMap['meta_ciudadana'] || '50000'),
      slogan: configMap['slogan'] || 'Construyamos juntos el San Cristóbal que merecemos.',
      registroPublicoActivo: configMap['registro_publico_activo'] !== 'false',
      prioridades,
      sectoresTop,
      comentariosRecientes: comentarios
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// Admin full stats
router.get('/admin', authenticate, requireAdmin, async (_req, res: Response) => {
  try {
    const total = await prisma.citizen.count()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const week = new Date(); week.setDate(week.getDate() - 7)
    const month = new Date(); month.setDate(month.getDate() - 30)

    const [hoy, semana, mes, voluntarios, promotores] = await Promise.all([
      prisma.citizen.count({ where: { createdAt: { gte: today } } }),
      prisma.citizen.count({ where: { createdAt: { gte: week } } }),
      prisma.citizen.count({ where: { createdAt: { gte: month } } }),
      prisma.citizen.count({ where: { voluntario: true } }),
      prisma.user.count({ where: { rol: 'PROMOTER', activo: true } }),
    ])

    // Daily growth: fetch recent citizens and group by date in JS
    const recentCitizens = await prisma.citizen.findMany({
      where: { createdAt: { gte: month } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    })
    const dailyMap: Record<string, number> = {}
    recentCitizens.forEach(c => {
      const date = c.createdAt.toISOString().slice(0, 10)
      dailyMap[date] = (dailyMap[date] || 0) + 1
    })
    const dailyGrowth = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    // By sector via groupBy
    const sectorGroups = await prisma.citizen.groupBy({
      by: ['sector'],
      _count: { id: true },
      where: { sector: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    })
    const porSector = sectorGroups.map(s => ({ sector: s.sector!, count: s._count.id }))

    // By nivel de apoyo via groupBy
    const nivelGroups = await prisma.citizen.groupBy({
      by: ['nivelApoyo'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })
    const porNivel = nivelGroups.map(n => ({ nivelApoyo: n.nivelApoyo, count: n._count.id }))

    // Top promotores
    const promoterUsers = await prisma.user.findMany({
      where: { rol: 'PROMOTER' },
      select: { id: true, nombre: true }
    })
    const topPromotores = await Promise.all(
      promoterUsers.map(async u => {
        const count = await prisma.citizen.count({ where: { registradoPorId: u.id } })
        return { id: u.id, nombre: u.nombre, count }
      })
    )
    topPromotores.sort((a, b) => b.count - a.count)

    // Prioridades
    const allCitizens = await prisma.citizen.findMany({ select: { prioridades: true } })
    const prioCount: Record<string, number> = {}
    allCitizens.forEach(c => {
      try {
        const ps = JSON.parse(c.prioridades || '[]') as string[]
        ps.forEach(p => { prioCount[p] = (prioCount[p] || 0) + 1 })
      } catch {}
    })
    const prioridades = Object.entries(prioCount)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count)

    const config = await prisma.config.findUnique({ where: { clave: 'meta_ciudadana' } })
    const meta = parseInt(config?.valor || '50000')

    res.json({
      total, hoy, semana, mes, voluntarios, promotores,
      meta, porcentajeMeta: Math.min(Math.round((total / meta) * 100), 100),
      dailyGrowth,
      porSector,
      porNivel,
      topPromotores,
      prioridades
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener estadísticas admin' })
  }
})

// Sector intelligence
router.get('/sector/:nombre', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre } = req.params
    const citizens = await prisma.citizen.findMany({
      where: { sector: nombre }
    })

    const total = citizens.length
    const voluntarios = citizens.filter(c => c.voluntario).length
    const prioCount: Record<string, number> = {}
    const nivelCount: Record<string, number> = {}
    const problemas: string[] = []

    citizens.forEach(c => {
      try {
        const ps = JSON.parse(c.prioridades || '[]') as string[]
        ps.forEach(p => { prioCount[p] = (prioCount[p] || 0) + 1 })
      } catch {}
      nivelCount[c.nivelApoyo] = (nivelCount[c.nivelApoyo] || 0) + 1
      if (c.problemaComunidad) problemas.push(c.problemaComunidad)
    })

    const prioridadTop = Object.entries(prioCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

    res.json({
      sector: nombre, total, voluntarios,
      nivelApoyo: nivelCount,
      prioridadTop,
      problemasRecientes: problemas.slice(-10),
      scorePromedio: total > 0 ? Math.round(citizens.reduce((s, c) => s + c.scorePolit, 0) / total) : 0
    })
  } catch {
    res.status(500).json({ error: 'Error al obtener inteligencia de sector' })
  }
})

// Lineage tree: Promotor → Voluntarios → Ciudadanos referidos
router.get('/lineage', authenticate, requireAdmin, async (_req, res: Response) => {
  try {
    const promoters = await prisma.user.findMany({
      where: { rol: 'PROMOTER' },
      select: { id: true, nombre: true }
    })
    const citizens = await prisma.citizen.findMany({
      select: {
        id: true, nombreCompleto: true, sector: true, voluntario: true,
        nivelApoyo: true, registradoPorId: true, referidoPorId: true,
      }
    })

    // Referidos agrupados por el voluntario que los refirió
    const referidosByVol: Record<number, typeof citizens> = {}
    citizens.forEach(c => {
      if (c.referidoPorId) (referidosByVol[c.referidoPorId] ||= []).push(c)
    })

    const promotores = promoters.map(p => {
      const propios = citizens.filter(c => c.registradoPorId === p.id)
      const voluntarios = propios.filter(c => c.voluntario).map(v => {
        const refs = referidosByVol[v.id] || []
        return {
          id: v.id, nombre: v.nombreCompleto, sector: v.sector, nivelApoyo: v.nivelApoyo,
          totalReferidos: refs.length,
          referidos: refs.map(r => ({ id: r.id, nombre: r.nombreCompleto, sector: r.sector, nivelApoyo: r.nivelApoyo })),
        }
      })
      const totalReferidos = voluntarios.reduce((s, v) => s + v.totalReferidos, 0)
      return {
        id: p.id, nombre: p.nombre,
        totalCiudadanos: propios.length,
        totalVoluntarios: voluntarios.length,
        totalReferidos,
        multiplicador: voluntarios.length > 0 ? Number((totalReferidos / voluntarios.length).toFixed(1)) : 0,
        voluntarios: voluntarios.sort((a, b) => b.totalReferidos - a.totalReferidos),
      }
    })
    promotores.sort((a, b) => b.totalCiudadanos - a.totalCiudadanos)

    res.json({ promotores })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener el linaje' })
  }
})

// Detalle de un promotor: estadísticas + linaje (voluntarios → referidos)
router.get('/promoter/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const promotor = await prisma.user.findUnique({
      where: { id }, select: { id: true, nombre: true, email: true, sectores: true }
    })
    if (!promotor) return res.status(404).json({ error: 'Promotor no encontrado' })

    const citizens = await prisma.citizen.findMany({
      where: { registradoPorId: id },
      select: {
        id: true, nombreCompleto: true, sector: true, voluntario: true,
        nivelApoyo: true, prioridades: true, votaEnSanCristobal: true, scorePolit: true, createdAt: true,
      }
    })

    const volIds = citizens.filter(c => c.voluntario).map(c => c.id)
    const referidos = volIds.length
      ? await prisma.citizen.findMany({
          where: { referidoPorId: { in: volIds } },
          select: { id: true, nombreCompleto: true, sector: true, nivelApoyo: true, referidoPorId: true }
        })
      : []

    const referidosByVol: Record<number, typeof referidos> = {}
    referidos.forEach(r => { if (r.referidoPorId) (referidosByVol[r.referidoPorId] ||= []).push(r) })

    const voluntarios = citizens.filter(c => c.voluntario).map(v => {
      const refs = referidosByVol[v.id] || []
      return {
        id: v.id, nombre: v.nombreCompleto, sector: v.sector, nivelApoyo: v.nivelApoyo,
        totalReferidos: refs.length,
        referidos: refs.map(r => ({ id: r.id, nombre: r.nombreCompleto, sector: r.sector, nivelApoyo: r.nivelApoyo })),
      }
    }).sort((a, b) => b.totalReferidos - a.totalReferidos)

    // Fechas
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const week = new Date(); week.setDate(week.getDate() - 7)
    const hoy = citizens.filter(c => c.createdAt >= today).length
    const semana = citizens.filter(c => c.createdAt >= week).length
    const ultimoRegistro = citizens.reduce<Date | null>((acc, c) => (!acc || c.createdAt > acc ? c.createdAt : acc), null)

    // Embudo de apoyo de su red
    const nivelOrder = ['NEUTRAL', 'SIMPATIZANTE', 'APOYA', 'MUY_COMPROMETIDO', 'LIDER_COMUNITARIO']
    const nivelCount: Record<string, number> = {}
    citizens.forEach(c => { nivelCount[c.nivelApoyo] = (nivelCount[c.nivelApoyo] || 0) + 1 })
    const embudo = nivelOrder.map(n => ({ nivelApoyo: n, count: nivelCount[n] || 0 }))

    // Top prioridades de su red
    const prioCount: Record<string, number> = {}
    citizens.forEach(c => {
      try { (JSON.parse(c.prioridades || '[]') as string[]).forEach(p => { prioCount[p] = (prioCount[p] || 0) + 1 }) } catch {}
    })
    const prioridades = Object.entries(prioCount).map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5)

    const total = citizens.length
    let sectores: string[] = []
    try { const v = JSON.parse(promotor.sectores || '[]'); sectores = Array.isArray(v) ? v : [] } catch {}

    res.json({
      promotor: { id: promotor.id, nombre: promotor.nombre, email: promotor.email, sectores },
      stats: {
        totalCiudadanos: total,
        totalVoluntarios: volIds.length,
        totalReferidos: referidos.length,
        multiplicador: volIds.length > 0 ? Number((referidos.length / volIds.length).toFixed(1)) : 0,
        scorePromedio: total > 0 ? Math.round(citizens.reduce((s, c) => s + c.scorePolit, 0) / total) : 0,
        votanSC: citizens.filter(c => c.votaEnSanCristobal).length,
        sectoresCubiertos: new Set(citizens.map(c => c.sector).filter(Boolean)).size,
        hoy, semana, ultimoRegistro,
      },
      embudo,
      prioridades,
      voluntarios,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener detalle del promotor' })
  }
})

// Detalle de un voluntario: estadísticas + ciudadanos que refirió
router.get('/volunteer/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const vol = await prisma.citizen.findUnique({
      where: { id },
      include: { registradoPor: { select: { id: true, nombre: true } } }
    })
    if (!vol) return res.status(404).json({ error: 'Voluntario no encontrado' })

    const referidos = await prisma.citizen.findMany({
      where: { referidoPorId: id },
      select: { id: true, nombreCompleto: true, sector: true, nivelApoyo: true, telefono: true, votaEnSanCristobal: true, scorePolit: true },
      orderBy: { createdAt: 'desc' },
    })

    const nivelOrder = ['NEUTRAL', 'SIMPATIZANTE', 'APOYA', 'MUY_COMPROMETIDO', 'LIDER_COMUNITARIO']
    const nivelCount: Record<string, number> = {}
    referidos.forEach(r => { nivelCount[r.nivelApoyo] = (nivelCount[r.nivelApoyo] || 0) + 1 })
    const embudo = nivelOrder.map(n => ({ nivelApoyo: n, count: nivelCount[n] || 0 }))

    const total = referidos.length
    res.json({
      voluntario: {
        id: vol.id, nombre: vol.nombreCompleto, sector: vol.sector, telefono: vol.telefono,
        nivelApoyo: vol.nivelApoyo, esVoluntario: vol.voluntario,
        registradoPor: vol.registradoPor,
      },
      stats: {
        totalReferidos: total,
        votanSC: referidos.filter(r => r.votaEnSanCristobal).length,
        scorePromedio: total > 0 ? Math.round(referidos.reduce((s, r) => s + r.scorePolit, 0) / total) : 0,
        sectoresCubiertos: new Set(referidos.map(r => r.sector).filter(Boolean)).size,
      },
      embudo,
      referidos,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener detalle del voluntario' })
  }
})

// Territorial / electoral intelligence: embudo, penetración, prioridades por sector
router.get('/territorio', authenticate, requireAdmin, async (_req, res: Response) => {
  try {
    const sectors = await prisma.sector.findMany({ select: { nombre: true } })
    const citizens = await prisma.citizen.findMany({
      select: { sector: true, nivelApoyo: true, prioridades: true, votaEnSanCristobal: true }
    })

    // Penetración por sector (incluye sectores sin cobertura)
    const bySector: Record<string, number> = {}
    citizens.forEach(c => { const s = c.sector || 'Sin sector'; bySector[s] = (bySector[s] || 0) + 1 })
    const penetracion = sectors
      .map(s => ({ sector: s.nombre, count: bySector[s.nombre] || 0 }))
      .sort((a, b) => b.count - a.count)
    const sectoresSinCobertura = penetracion.filter(p => p.count === 0).map(p => p.sector)

    // Embudo de apoyo (orden de menor a mayor compromiso)
    const nivelOrder = ['NEUTRAL', 'SIMPATIZANTE', 'APOYA', 'MUY_COMPROMETIDO', 'LIDER_COMUNITARIO']
    const nivelCount: Record<string, number> = {}
    citizens.forEach(c => { nivelCount[c.nivelApoyo] = (nivelCount[c.nivelApoyo] || 0) + 1 })
    const embudo = nivelOrder.map(n => ({ nivelApoyo: n, count: nivelCount[n] || 0 }))

    // Prioridad dominante por sector
    const prioBySector: Record<string, Record<string, number>> = {}
    citizens.forEach(c => {
      const s = c.sector || 'Sin sector'
      try {
        (JSON.parse(c.prioridades || '[]') as string[]).forEach(p => {
          (prioBySector[s] ||= {})[p] = (prioBySector[s][p] || 0) + 1
        })
      } catch {}
    })
    const prioridadesPorSector = Object.entries(prioBySector).map(([sector, m]) => {
      const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0]
      return { sector, prioridad: top?.[0], count: top?.[1] || 0 }
    }).filter(x => x.prioridad).sort((a, b) => b.count - a.count)

    const votanSC = citizens.filter(c => c.votaEnSanCristobal).length

    res.json({
      embudo,
      penetracion,
      sectoresSinCobertura,
      prioridadesPorSector,
      baseElectoral: { votanSC, total: citizens.length },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener inteligencia territorial' })
  }
})

export default router
