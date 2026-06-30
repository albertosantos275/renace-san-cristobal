import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, Target, TrendingUp } from 'lucide-react'
import api from '../lib/api'
import { PublicStats } from '../types'

const COLORS = ['#1638D6', '#2B73FF', '#558FFF', '#80ABFF', '#AAC7FF']

// Reusable statistics content (KPIs + charts). Used both on the standalone
// /resultados page and embedded inside the admin/promoter panels.
export default function StatsPanel() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    api.get('/stats/results').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const meta = stats?.meta ?? 50000
  const total = stats?.total ?? 0
  const pct = Math.min(Math.round((total / meta) * 100), 100)

  const sectorData = stats?.sectoresTop?.map(s => ({ name: s.sector, value: Number(s.count) })) || []
  const prioData = stats?.prioridades?.map(p => ({ name: p.nombre, value: p.count })) || []

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <Users size={28} className="text-primary-600 mx-auto mb-2" />
          <div className="text-4xl font-black text-primary-700">{total.toLocaleString('es-DO')}</div>
          <div className="text-gray-500 text-sm font-medium mt-1">Ciudadanos Registrados</div>
        </div>
        <div className="card text-center">
          <Target size={28} className="text-primary-600 mx-auto mb-2" />
          <div className="text-4xl font-black text-primary-700">{pct}%</div>
          <div className="text-gray-500 text-sm font-medium mt-1">Meta Alcanzada</div>
        </div>
        <div className="card text-center">
          <TrendingUp size={28} className="text-primary-600 mx-auto mb-2" />
          <div className="text-4xl font-black text-primary-700">{Math.max(0, meta - total).toLocaleString('es-DO')}</div>
          <div className="text-gray-500 text-sm font-medium mt-1">Para Alcanzar Meta</div>
        </div>
      </div>

      {/* Prioridades chart */}
      {prioData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Prioridades Ciudadanas</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={prioData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Votos']} />
              <Bar dataKey="value" fill="#1638D6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sectors pie */}
      {sectorData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Participación por Sector</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
