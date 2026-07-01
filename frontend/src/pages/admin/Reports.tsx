import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, MapPin, TrendingUp, Filter, AlertTriangle, Vote } from 'lucide-react'
import api from '../../lib/api'
import { AdminStats, NIVEL_APOYO_LABELS, NivelApoyo } from '../../types'

const COLORS = ['#1638D6', '#2B73FF', '#558FFF', '#80ABFF', '#AAC7FF', '#D5E3FF']

type Tab = 'resumen' | 'apoyo' | 'territorio' | 'sector'

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>('resumen')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [territorio, setTerritorio] = useState<any>(null)
  const [sectorIntel, setSectorIntel] = useState<any>(null)
  const [selectedSector, setSelectedSector] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats/admin').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/stats/territorio').then(r => setTerritorio(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedSector) { setSectorIntel(null); return }
    api.get(`/stats/sector/${encodeURIComponent(selectedSector)}`).then(r => setSectorIntel(r.data)).catch(() => {})
  }, [selectedSector])

  if (loading) return <div className="card py-16 text-center text-gray-400">Cargando reportes...</div>
  if (!stats) return <div className="card py-16 text-center text-red-400">Error al cargar reportes</div>

  const nivelData = stats.porNivel.map(n => ({
    name: NIVEL_APOYO_LABELS[n.nivelApoyo as NivelApoyo] || n.nivelApoyo,
    value: Number(n.count)
  }))

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',    label: 'Resumen',                 icon: <TrendingUp size={15} /> },
    { id: 'apoyo',      label: 'Apoyo y Base Electoral',  icon: <Filter size={15} /> },
    { id: 'territorio', label: 'Territorio',              icon: <MapPin size={15} /> },
    { id: 'sector',     label: 'Inteligencia por Sector', icon: <BarChart3 size={15} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Reportes e Inteligencia Política</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análisis completo de los registros</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Resumen ─────────────────────────────────────────────────────────── */}
      {tab === 'resumen' && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary-600" />Crecimiento Diario</h2>
              {stats.dailyGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.dailyGrowth.slice(-14)} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip labelFormatter={d => `Fecha: ${d}`} formatter={v => [v, 'Registros']} />
                    <Bar dataKey="count" fill="#1638D6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>}
            </div>

            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-primary-600" />Distribución por Nivel</h2>
              {nivelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={nivelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {nivelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [v, 'Ciudadanos']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>}
            </div>
          </div>
        </>
      )}

      {/* ── Apoyo y Base Electoral ──────────────────────────────────────────── */}
      {tab === 'apoyo' && (
        <>
          {territorio && (() => {
            const embudoTotal = territorio.embudo.reduce((s: number, n: any) => s + n.count, 0) || 1
            const embudoMax = Math.max(...territorio.embudo.map((n: any) => n.count), 1)
            const baseTotal = territorio.baseElectoral.total || 1
            const basePct = Math.round((territorio.baseElectoral.votanSC / baseTotal) * 100)
            return (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Filter size={18} className="text-primary-600" />Embudo de Apoyo</h2>
                  <div className="space-y-2.5">
                    {territorio.embudo.map((n: any) => {
                      const label = NIVEL_APOYO_LABELS[n.nivelApoyo as NivelApoyo] || n.nivelApoyo
                      const pct = Math.round((n.count / embudoTotal) * 100)
                      return (
                        <div key={n.nivelApoyo} className="flex items-center gap-3">
                          <div className="w-36 text-sm text-gray-600 text-right flex-shrink-0">{label}</div>
                          <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg flex items-center justify-end px-2"
                              style={{ width: `${Math.max((n.count / embudoMax) * 100, 4)}%` }}
                            >
                              <span className="text-[11px] font-bold text-white">{n.count}</span>
                            </div>
                          </div>
                          <div className="w-10 text-xs text-gray-400 flex-shrink-0">{pct}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="card flex flex-col justify-center">
                  <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Vote size={18} className="text-green-600" />Base Electoral</h2>
                  <div className="text-center">
                    <div className="text-5xl font-black text-green-700">{basePct}%</div>
                    <p className="text-sm text-gray-500 mt-1">votan en San Cristóbal</p>
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-bold text-gray-800">{territorio.baseElectoral.votanSC}</span> de {territorio.baseElectoral.total} ciudadanos
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {stats.prioridades.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">Todas las Prioridades Ciudadanas</h2>
              <div className="space-y-3">
                {stats.prioridades.map((p, i) => {
                  const max = stats.prioridades[0]?.count || 1
                  return (
                    <div key={p.nombre} className="flex items-center gap-3">
                      <div className="w-7 text-right text-xs font-bold text-gray-400">{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{p.nombre}</span>
                          <span className="font-bold text-primary-600">{p.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(p.count / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Territorio ──────────────────────────────────────────────────────── */}
      {tab === 'territorio' && territorio && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={18} className="text-primary-600" />Penetración por Sector</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={territorio.penetracion.filter((p: any) => p.count > 0).slice(0, 12)} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={v => [v, 'Ciudadanos']} />
                  <Bar dataKey="count" fill="#1638D6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" />Sectores sin Cobertura</h2>
              {territorio.sectoresSinCobertura.length === 0 ? (
                <p className="text-sm text-green-600">¡Todos los sectores tienen al menos un registro! 🎉</p>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-2">{territorio.sectoresSinCobertura.length} sectores con 0 registros — prioriza estos:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                    {territorio.sectoresSinCobertura.map((s: string) => (
                      <span key={s} className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-lg border border-amber-100">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {territorio.prioridadesPorSector.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-primary-600" />Prioridad Dominante por Sector</h2>
              <p className="text-xs text-gray-400 mb-3">Qué problema pesa más en cada zona — úsalo para segmentar el mensaje de campaña.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {territorio.prioridadesPorSector.map((p: any) => (
                  <div key={p.sector} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">{p.sector}</div>
                      <div className="text-xs text-primary-600 truncate">{p.prioridad}</div>
                    </div>
                    <span className="text-xs font-bold text-gray-400 ml-2 flex-shrink-0">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Inteligencia por Sector ─────────────────────────────────────────── */}
      {tab === 'sector' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} className="text-primary-600" />
            <h2 className="font-bold text-gray-900 text-lg">Inteligencia por Sector</h2>
          </div>
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="input-field max-w-sm mb-4"
          >
            <option value="">Seleccionar sector...</option>
            {stats.porSector.map(s => <option key={s.sector} value={s.sector}>{s.sector}</option>)}
          </select>

          {!sectorIntel ? (
            <p className="text-sm text-gray-400">Selecciona un sector para ver su análisis detallado.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-primary-700">{sectorIntel.total}</div>
                <div className="text-xs text-gray-500 mt-1">Total Ciudadanos</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-green-700">{sectorIntel.voluntarios}</div>
                <div className="text-xs text-gray-500 mt-1">Voluntarios</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-purple-700">{sectorIntel.scorePromedio}</div>
                <div className="text-xs text-gray-500 mt-1">Score Promedio</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-yellow-700">
                  {sectorIntel.nivelApoyo?.['LIDER_COMUNITARIO'] || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Líderes Comunitarios</div>
              </div>

              {sectorIntel.prioridadTop?.length > 0 && (
                <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-700 mb-2 text-sm">Prioridades Top</div>
                  {sectorIntel.prioridadTop.map(([p, c]: [string, number], i: number) => (
                    <div key={p} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">{i + 1}. {p}</span>
                      <span className="font-bold text-primary-600">{c} votos</span>
                    </div>
                  ))}
                </div>
              )}

              {sectorIntel.problemasRecientes?.length > 0 && (
                <div className="col-span-2 bg-gray-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-700 mb-2 text-sm">Problemas Mencionados</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {sectorIntel.problemasRecientes.map((p: string, i: number) => (
                      <p key={i} className="text-xs text-gray-600 italic">"{p}"</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
