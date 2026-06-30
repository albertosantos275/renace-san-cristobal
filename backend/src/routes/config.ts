import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (_req, res: Response) => {
  try {
    const configs = await prisma.config.findMany()
    const map = Object.fromEntries(configs.map(c => [c.clave, c.valor]))
    res.json(map)
  } catch {
    res.status(500).json({ error: 'Error al obtener configuración' })
  }
})

router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body as Record<string, string>
    await Promise.all(
      Object.entries(updates).map(([clave, valor]) =>
        prisma.config.upsert({
          where: { clave },
          update: { valor: String(valor) },
          create: { clave, valor: String(valor) }
        })
      )
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Error al actualizar configuración' })
  }
})

export default router
