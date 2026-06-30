import { useEffect, useState } from 'react'
import { X, ChevronRight, ChevronDown, Heart, User, Users, Network, Star, MapPin, Filter } from 'lucide-react'
import api from '../lib/api'
import { NIVEL_APOYO_LABELS, NivelApoyo } from '../types'

interface Referido { id: number; nombre: string; sector?: string | null; nivelApoyo: string }
interface Voluntario { id: number; nombre: string; sector?: string | null; nivelApoyo: string; totalReferidos: number; referidos: Referido[] }
interface Detail {
  promotor: { id: number; nombre: string; email: string; sectores: string[] }
  stats: {
    totalCiudadanos: number; totalVoluntarios: number; totalReferidos: number; multiplicador: number
    scorePromedio: number; votanSC: number; sectoresCubiertos: number; hoy: number; semana: number; ultimoRegistro?: string
  }
  embudo: { nivelApoyo: string; count: number }[]
  prioridades: { nombre: string; count: number }[]
  voluntarios: Voluntario[]
}

function nivelBadge(nivel: string) {
  const label = NIVEL_APOYO_LABELS[nivel as NivelApoyo] || nivel
  const color = nivel === 'LIDER_COMUNITARIO' ? 'bg-yellow-100 text-yellow-700'
    : nivel === 'MUY_COMPROMETIDO' ? 'bg-green-100 text-green-700'
    : nivel === 'APOYA' ? 'bg-primary-100 text-primary-700'
    : nivel === 'SIMPATIZANTE' ? 'bg-blue-50 text-blue-600'
    : 'bg-gray-100 text-gray-500'
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{label}</span>
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className={`text-2xl font-black ${accent}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{label}</div>
    </div>
  )
}

export default function PromoterDetailModal({ promoterId, onClose }: { promoterId: number; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [openVol, setOpenVol] = useState<Set<number>>(new Set())

  useEffect(() => {
    setLoading(true)
    api.get(`/stats/promoter/${promoterId}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [promoterId])

  const toggleVol = (id: number) => {
    const next = new Set(openVol)
    next.has(id) ? next.delete(id) : next.add(id)
    setOpenVol(next)
  }

  const embudoMax = data ? Math.max(...data.embudo.map(n => n.count), 1) : 1

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="font-black text-primary-700">{data?.promotor.nombre?.charAt(0) || '?'}</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-gray-900 truncate">{data?.promotor.nombre || 'Cargando...'}</h2>
              <p className="text-xs text-gray-400 truncate">{data?.promotor.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={22} /></button>
        </div>

        {loading || !data ? (
          <div className="py-20 text-center text-gray-400 text-sm">Cargando detalle...</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Sectores */}
            {data.promotor.sectores.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <MapPin size={14} className="text-primary-500" />
                {data.promotor.sectores.map(s => (
                  <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-lg">{s}</span>
                ))}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              <Stat label="Ciudadanos" value={data.stats.totalCiudadanos} accent="text-primary-700" />
              <Stat label="Voluntarios" value={data.stats.totalVoluntarios} accent="text-green-600" />
              <Stat label="Referidos" value={data.stats.totalReferidos} accent="text-purple-600" />
              <Stat label="Multiplicador" value={`${data.stats.multiplicador}×`} accent="text-amber-600" />
              <Stat label="Score prom." value={data.stats.scorePromedio} accent="text-gray-700" />
              <Stat label="Votan en SC" value={data.stats.votanSC} accent="text-green-700" />
              <Stat label="Sectores" value={data.stats.sectoresCubiertos} accent="text-primary-600" />
              <Stat label="Hoy / Semana" value={<span className="text-base">{data.stats.hoy}/{data.stats.semana}</span>} accent="text-gray-700" />
            </div>

            {/* Embudo de apoyo */}
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Filter size={15} className="text-primary-600" />Embudo de Apoyo de su Red</h3>
              <div className="space-y-1.5">
                {data.embudo.map(n => (
                  <div key={n.nivelApoyo} className="flex items-center gap-2">
                    <div className="w-32 text-xs text-gray-600 text-right flex-shrink-0">{NIVEL_APOYO_LABELS[n.nivelApoyo as NivelApoyo] || n.nivelApoyo}</div>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded flex items-center justify-end px-1.5" style={{ width: `${Math.max((n.count / embudoMax) * 100, 5)}%` }}>
                        <span className="text-[10px] font-bold text-white">{n.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioridades */}
            {data.prioridades.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Star size={15} className="text-yellow-500" />Prioridades de su Gente</h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.prioridades.map(p => (
                    <span key={p.nombre} className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-lg border border-gray-100">
                      {p.nombre} <span className="font-bold text-primary-600">{p.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Linaje */}
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Network size={15} className="text-primary-600" />Linaje · Voluntarios → Referidos</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {data.voluntarios.length === 0 && (
                  <div className="px-4 py-4 text-xs text-gray-400 flex items-center gap-2"><Users size={14} />Este promotor aún no tiene voluntarios registrados.</div>
                )}
                {data.voluntarios.map(v => {
                  const vOpen = openVol.has(v.id)
                  return (
                    <div key={v.id}>
                      <button onClick={() => toggleVol(v.id)} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-left">
                        {v.totalReferidos > 0
                          ? (vOpen ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />)
                          : <span className="w-3.5 flex-shrink-0" />}
                        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><Heart size={13} className="text-green-600" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{v.nombre}</div>
                          <div className="text-[11px] text-gray-400">{v.sector || 'Sin sector'}</div>
                        </div>
                        {nivelBadge(v.nivelApoyo)}
                        <span className="text-xs font-bold text-green-700 ml-2 flex-shrink-0">{v.totalReferidos} ref.</span>
                      </button>
                      {vOpen && v.referidos.length > 0 && (
                        <div className="bg-gray-50/60 border-l-2 border-gray-200 ml-7">
                          {v.referidos.map(r => (
                            <div key={r.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-white">
                              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0"><User size={12} className="text-gray-500" /></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-700 truncate">{r.nombre}</div>
                                <div className="text-[11px] text-gray-400">{r.sector || 'Sin sector'}</div>
                              </div>
                              {nivelBadge(r.nivelApoyo)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
