import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Users, TrendingUp, Heart, UserCheck, Target, Calendar, Award, MapPin, BarChart3 } from 'lucide-react'
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
  const [tab, setTab] = useState<'general' | 'promotores'>('general')

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

  // Avance de meta por promotor (todo el histórico) + líneas de progreso diario
  const LINE_COLORS = ['#1638D6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6']
  const metaPromotores = stats.topPromotores
    .filter(p => Number(p.meta) > 0)
    .map(p => ({ ...p, pct: Math.min(Math.round((Number(p.count) / Number(p.meta)) * 100), 100) }))
    .sort((a, b) => b.pct - a.pct)

  const topProgress = [...(stats.promoterProgress || [])].sort((a, b) => b.total - a.total).slice(0, 5)
  const progressDates = Array.from(new Set(topProgress.flatMap(p => p.dias.map(d => d.date)))).sort()
  const progressChart = progressDates.map(date => {
    const row: Record<string, any> = { date }
    topProgress.forEach(p => { row[p.nombre] = p.dias.find(d => d.date === date)?.count || 0 })
    return row
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard Principal</h1>
        <p className="text-gray-500 text-sm mt-1">Renace San Cristóbal 2028 · Panel de Control</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl sm:inline-flex">
        <button
          onClick={() => setTab('general')}
          className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'general' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 size={16} />General
        </button>
        <button
          onClick={() => setTab('promotores')}
          className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'promotores' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={16} />Por Promotor
        </button>
      </div>

    {tab === 'general' && (
      <div className="space-y-6">
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

      {/* Charts row 2: sector + prioridades */}
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

        {/* Prioridades */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Prioridades Ciudadanas</h2>
          {stats.prioridades.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.prioridades.slice(0, 8).map(p => ({ name: p.nombre, value: p.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [v, 'Votos']} />
                <Bar dataKey="value" fill="#1638D6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos de prioridades</div>
          )}
        </div>
      </div>
      </div>
    )}

    {tab === 'promotores' && (
      <div className="space-y-6">
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

      {/* Voluntarios por promotor */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={18} className="text-red-500" />
          <h2 className="text-lg font-bold text-gray-900">Voluntarios por Promotor</h2>
          <span className="ml-auto text-sm text-gray-400">{stats.voluntarios.toLocaleString('es-DO')} en total</span>
        </div>
        {(() => {
          const porVol = [...stats.topPromotores].sort((a, b) => Number(b.voluntarios) - Number(a.voluntarios))
          const max = Number(porVol[0]?.voluntarios) || 1
          return porVol.some(p => Number(p.voluntarios) > 0) ? (
            <div className="space-y-3">
              {porVol.slice(0, 8).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 bg-red-50 text-red-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{p.nombre}</div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.round((Number(p.voluntarios) / max) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-red-500 flex-shrink-0">{Number(p.voluntarios).toLocaleString('es-DO')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-300 text-sm">Aún no hay voluntarios registrados</div>
          )
        })()}
      </div>

      {/* Avance de meta por promotor */}
      {metaPromotores.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Avance de Meta por Promotor</h2>
          </div>
          <div className="space-y-4">
            {metaPromotores.slice(0, 10).map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-800 truncate">{p.nombre}</span>
                  <span className="text-gray-500 flex-shrink-0 ml-2">
                    {Number(p.count).toLocaleString('es-DO')} / {Number(p.meta).toLocaleString('es-DO')} ·{' '}
                    <span className={`font-bold ${p.pct >= 100 ? 'text-green-600' : 'text-primary-600'}`}>{p.pct}%</span>
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${p.pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progreso diario por promotor */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Registros por Día por Promotor (30 días)</h2>
          <span className="ml-auto text-xs text-gray-400">Top 5 promotores</span>
        </div>
        {progressChart.length > 0 && topProgress.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={progressChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip labelFormatter={d => `Fecha: ${d}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {topProgress.map((p, i) => (
                <Line key={p.id} type="monotone" dataKey={p.nombre} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Sin actividad reciente de promotores</div>
        )}
      </div>

      </div>
    )}
    </div>
  )
}
