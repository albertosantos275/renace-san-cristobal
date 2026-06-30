import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Users, TrendingUp, Heart, UserCheck, Target, Calendar, Award, MapPin } from 'lucide-react'
import api from '../../lib/api'
import { AdminStats, NIVEL_APOYO_LABELS, NivelApoyo } from '../../types'

const PIE_COLORS = ['#1638D6', '#2B73FF', '#558FFF', '#80ABFF', '#AAC7FF', '#D5E3FF']

function KPICard({ icon: Icon, label, value, sub, color = 'text-primary-600' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900">{typeof value === 'number' ? value.toLocaleString('es-DO') : value}</div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats/admin').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (!stats) return <div className="card text-center text-gray-500 py-12">Error al cargar estadísticas</div>

  const nivelData = stats.porNivel.map(n => ({
    name: NIVEL_APOYO_LABELS[n.nivelApoyo as NivelApoyo] || n.nivelApoyo,
    value: Number(n.count)
  }))

  const sectorData = stats.porSector.slice(0, 8).map(s => ({
    name: s.sector?.length > 12 ? s.sector.slice(0, 12) + '…' : s.sector,
    fullName: s.sector,
    value: Number(s.count)
  }))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard Principal</h1>
        <p className="text-gray-500 text-sm mt-1">Renace San Cristóbal 2028 · Panel de Control</p>
      </div>

      {/* Meta progress */}
      <div className="card bg-gradient-to-r from-primary-700 to-primary-600 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-primary-100 text-sm font-medium uppercase tracking-wider mb-1">Avance hacia la Meta</div>
            <div className="text-5xl font-black">{stats.total.toLocaleString('es-DO')}</div>
            <div className="text-primary-200 mt-1">de {stats.meta.toLocaleString('es-DO')} ciudadanos</div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-yellow-300">{stats.porcentajeMeta}%</div>
            <div className="text-primary-200 text-sm">completado</div>
          </div>
        </div>
        <div className="h-3 bg-primary-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-300 rounded-full transition-all duration-1000"
            style={{ width: `${stats.porcentajeMeta}%` }}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard icon={Calendar} label="Registros Hoy" value={stats.hoy} color="text-green-600" />
        <KPICard icon={TrendingUp} label="Esta Semana" value={stats.semana} />
        <KPICard icon={Users} label="Este Mes" value={stats.mes} />
        <KPICard icon={Heart} label="Voluntarios" value={stats.voluntarios} color="text-red-500" />
        <KPICard icon={UserCheck} label="Promotores" value={stats.promotores} />
        <KPICard icon={Target} label="Meta Total" value={stats.meta.toLocaleString('es-DO')} color="text-purple-600" />
        <KPICard icon={Award} label="Nivel de Avance" value={`${stats.porcentajeMeta}%`} color="text-yellow-600" />
        <KPICard icon={MapPin} label="Sectores Activos" value={stats.porSector.length} />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily growth */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Crecimiento Diario (Últimos 30 días)</h2>
          {stats.dailyGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.dailyGrowth}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1638D6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1638D6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={d => `Fecha: ${d}`} formatter={(v) => [v, 'Registros']} />
                <Area type="monotone" dataKey="count" stroke="#1638D6" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos de crecimiento aún</div>
          )}
        </div>

        {/* Nivel de apoyo */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nivel de Apoyo</h2>
          {nivelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={nivelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {nivelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Ciudadanos']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By sector */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ciudadanos por Sector</h2>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => [v, 'Ciudadanos']} labelFormatter={(l, p) => p?.[0]?.payload?.fullName || l} />
                <Bar dataKey="value" fill="#1638D6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos de sectores</div>
          )}
        </div>

        {/* Top promotores */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Promotores</h2>
          {stats.topPromotores.length > 0 ? (
            <div className="space-y-3">
              {stats.topPromotores.slice(0, 8).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-gray-300 text-gray-700' :
                    i === 2 ? 'bg-amber-600 text-white' :
                    'bg-primary-100 text-primary-700'
                  }`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{p.nombre}</div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.round((Number(p.count) / Number(stats.topPromotores[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary-600 flex-shrink-0">{Number(p.count).toLocaleString('es-DO')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin promotores registrados</div>
          )}
        </div>
      </div>

      {/* Prioridades */}
      {stats.prioridades.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Prioridades Ciudadanas</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.prioridades.slice(0, 8).map(p => ({ name: p.nombre, value: p.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [v, 'Votos']} />
              <Bar dataKey="value" fill="#1638D6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
