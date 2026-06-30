import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

import authRoutes from './routes/auth'
import citizenRoutes from './routes/citizens'
import sectorRoutes from './routes/sectors'
import userRoutes from './routes/users'
import statsRoutes from './routes/stats'
import exportRoutes from './routes/export'
import configRoutes from './routes/config'
import geoRoutes from './routes/geo'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  // In production the frontend is served from this same origin, so reflect it.
  origin: isProd ? true : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Renace San Cristóbal 2028' }))

app.use('/api/auth', authRoutes)
app.use('/api/citizens', citizenRoutes)
app.use('/api/sectors', sectorRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/config', configRoutes)
app.use('/api/map', geoRoutes)
app.use('/api/citizen-locations', geoRoutes)
app.use('/api/registration-events', geoRoutes)

// In production, serve the built React frontend (copied to ../public in the Docker image)
// and fall back to index.html for client-side routes (SPA).
if (isProd) {
  const publicDir = path.resolve(__dirname, '..', 'public')
  app.use(express.static(publicDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🚀 Renace San Cristóbal 2028 - Backend corriendo en puerto ${PORT}`)
  console.log(`📊 Health check: /api/health\n`)
})

export default app
