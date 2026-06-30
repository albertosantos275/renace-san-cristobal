import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
}

router.get('/citizens', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { sector, voluntario } = req.query as any
    const where: any = {}
    if (sector) where.sector = sector
    if (voluntario === 'true') where.voluntario = true

    const citizens = await prisma.citizen.findMany({
      where,
      include: { registradoPor: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const headers = ['ID', 'Nombre', 'Cédula', 'Teléfono', 'Edad', 'Sexo', 'Sector', 'Vota SC', 'WhatsApp', 'Voluntario', 'Nivel Apoyo', 'Prioridades', 'Problema Comunidad', 'Score Político', 'Registrado Por', 'Fecha Registro']
    const rows = citizens.map(c => [
      String(c.id), c.nombreCompleto, c.cedula, c.telefono,
      String(c.edad ?? ''), c.sexo ?? '', c.sector ?? '',
      c.votaEnSanCristobal ? 'Sí' : 'No',
      c.whatsappUpdates ? 'Sí' : 'No',
      c.voluntario ? 'Sí' : 'No',
      c.nivelApoyo,
      (() => { try { return JSON.parse(c.prioridades).join(', ') } catch { return '' } })(),
      c.problemaComunidad ?? '',
      String(c.scorePolit),
      c.registradoPor?.nombre ?? '',
      new Date(c.createdAt).toLocaleDateString('es-DO')
    ])

    const csv = toCSV(headers, rows)

    await prisma.auditLog.create({
      data: { userId: req.user!.id, accion: 'csv_exportado', entidad: 'citizen', detalle: `Exportación: ${citizens.length} ciudadanos` }
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="ciudadanos-renace-2028.csv"')
    res.send('﻿' + csv)
  } catch {
    res.status(500).json({ error: 'Error al exportar' })
  }
})

router.get('/promotores', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({ where: { rol: 'PROMOTER' } })
    const headers = ['ID', 'Nombre', 'Email', 'Sectores', 'Total Registros', 'Activo']
    const rows = await Promise.all(users.map(async u => {
      const count = await prisma.citizen.count({ where: { registradoPorId: u.id } })
      const sectores = (() => { try { const v = JSON.parse(u.sectores || '[]'); return Array.isArray(v) ? v.join(', ') : '' } catch { return '' } })()
      return [String(u.id), u.nombre, u.email, sectores, String(count), u.activo ? 'Sí' : 'No']
    }))
    const csv = toCSV(headers, rows)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="promotores-renace-2028.csv"')
    res.send('﻿' + csv)
  } catch {
    res.status(500).json({ error: 'Error al exportar' })
  }
})

export default router
