import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Users, Heart, TrendingUp, Star, Map as MapIcon, BarChart3 } from 'lucide-react'
import api from '../lib/api'

interface SectorStat {
  id: number
  nombre: string
  zone: string | null
  totalCitizens: number
  totalVolunteers: number
  weeklyGrowth: number
  weeklyGrowthPct: number
  topPriority: string | null
  supportScore: number
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return '#E5E7EB'
  if (count === max && max > 5) return '#B8860B'
  const ratio = count / Math.max(max, 1)
  if (ratio > 0.8)  return '#0A1F7A'
  if (ratio > 0.6)  return '#1638D6'
  if (ratio > 0.35) return '#2B73FF'
  if (ratio > 0.15) return '#80ABFF'
  return '#C7D9FF'
}

export default function MapPage() {
  const [sectors, setSectors] = useState<SectorStat[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SectorStat | null>(null)

  useEffect(() => {
    api.get('/map/sector-stats')
      .then(r => setSectors(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxCitizens = sectors.length > 0 ? Math.max(...sectors.map(s => s.totalCitizens), 1) : 1
  const totalAll = sectors.reduce((s, x) => s + x.totalCitizens, 0)
  const topSector = sectors.length > 0 ? [...sectors].sort((a, b) => b.totalCitizens - a.totalCitizens)[0] : null
  const sectorsWithData = sectors.filter(s => s.totalCitizens > 0).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-1.5 hover:bg-primary-600 rounded-lg">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex items-center gap-2">
            <MapIcon size={20} className="text-primary-300" />
            <div>
              <div className="font-bold">Mapa Territorial</div>
              <div className="text-primary-300 text-xs">Renace San Cristóbal 2028</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary-500" />
            <span className="text-gray-500">Total:</span>
            <span className="font-bold text-gray-900">{totalAll.toLocaleString('es-DO')}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" />
            <span className="text-gray-500">Sectores activos:</span>
            <span className="font-bold text-gray-900">{sectorsWithData}</span>
          </div>
          {topSector && topSector.totalCitizens > 0 && (
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              <span className="text-gray-500">Líder:</span>
              <span className="font-bold text-gray-900">{topSector.nombre} ({topSector.totalCitizens})</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 py-4 gap-4">

        {/* Sector list */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Todos los Sectores</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {[...sectors]
                .sort((a, b) => b.totalCitizens - a.totalCitizens)
                .map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors ${selected?.id === s.id ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelected(s)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        backgroundColor: getHeatColor(s.totalCitizens, maxCitizens),
                        color: s.totalCitizens > maxCitizens * 0.4 ? 'white' : '#0A1F7A',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">{s.nombre}</div>
                      <div className="text-xs text-gray-400">{s.zone ?? ''} · {s.totalVolunteers} voluntarios</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-primary-700">{s.totalCitizens.toLocaleString('es-DO')}</div>
                      {s.weeklyGrowth > 0 && <div className="text-xs text-green-600 font-medium">+{s.weeklyGrowth} esta semana</div>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 space-y-4 flex-shrink-0">
          {/* Legend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Intensidad Territorial</h3>
            <div className="space-y-2">
              {[
                { color: '#B8860B', label: 'Sector líder' },
                { color: '#0A1F7A', label: '500+ ciudadanos' },
                { color: '#1638D6', label: '201–500' },
                { color: '#2B73FF', label: '101–200' },
                { color: '#80ABFF', label: '51–100' },
                { color: '#C7D9FF', label: '1–50' },
                { color: '#E5E7EB', label: 'Sin registros' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-5 h-4 rounded border border-gray-200 flex-shrink-0" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Selected sector detail */}
          {selected ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{selected.nombre}</h3>
                  {selected.zone && <p className="text-xs text-gray-400 mt-0.5">Zona {selected.zone}</p>}
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
              <div className="space-y-3">
                <StatRow icon={<Users size={14} />} label="Ciudadanos" value={selected.totalCitizens.toLocaleString('es-DO')} color="text-primary-600" />
                <StatRow icon={<Heart size={14} />} label="Voluntarios" value={String(selected.totalVolunteers)} color="text-green-600" />
                <StatRow icon={<TrendingUp size={14} />} label="Esta semana" value={`+${selected.weeklyGrowth}`} color="text-blue-600" />
                {selected.weeklyGrowthPct !== 0 && (
                  <StatRow icon={<BarChart3 size={14} />}
                    label="Crecimiento"
                    value={`${selected.weeklyGrowthPct > 0 ? '+' : ''}${selected.weeklyGrowthPct}%`}
                    color={selected.weeklyGrowthPct > 0 ? 'text-green-600' : 'text-red-500'} />
                )}
                {selected.topPriority && (
                  <StatRow icon={<Star size={14} />} label="Prioridad #1" value={selected.topPriority} color="text-yellow-600" />
                )}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-gray-500">Score político</span>
                    <span className={`font-bold ${selected.supportScore >= 60 ? 'text-green-600' : selected.supportScore >= 35 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {selected.supportScore}/100
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${selected.supportScore}%` }} />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-gray-500">% del total</span>
                    <span className="font-bold text-gray-700">
                      {totalAll > 0 ? Math.round((selected.totalCitizens / totalAll) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary-400 transition-all"
                      style={{ width: `${totalAll > 0 ? (selected.totalCitizens / totalAll) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center text-sm text-primary-600">
              <MapIcon size={24} className="mx-auto mb-2 text-primary-400" />
              Haz clic en un sector para ver su análisis
            </div>
          )}

          {/* Top 5 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Top 5 Sectores</h3>
            <div className="space-y-2">
              {[...sectors]
                .sort((a, b) => b.totalCitizens - a.totalCitizens)
                .slice(0, 5)
                .map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg transition-colors text-sm ${selected?.id === s.id ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className="font-bold text-gray-400 w-4">{i + 1}</span>
                    <span className="flex-1 font-medium text-gray-700 truncate">{s.nombre}</span>
                    <span className="font-bold text-primary-600">{s.totalCitizens}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className={`flex items-center gap-1.5 ${color}`}>{icon}<span className="text-gray-500">{label}</span></div>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  )
}
