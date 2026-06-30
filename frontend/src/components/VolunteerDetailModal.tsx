import { useEffect, useState } from 'react'
import { X, User, Users, Heart, Phone, MapPin, Filter } from 'lucide-react'
import api from '../lib/api'
import { NIVEL_APOYO_LABELS, NivelApoyo } from '../types'

interface Referido { id: number; nombreCompleto: string; sector?: string | null; nivelApoyo: string; telefono: string }
interface Detail {
  voluntario: { id: number; nombre: string; sector?: string | null; telefono: string; nivelApoyo: string; esVoluntario: boolean; registradoPor?: { id: number; nombre: string } | null }
  stats: { totalReferidos: number; votanSC: number; scorePromedio: number; sectoresCubiertos: number }
  embudo: { nivelApoyo: string; count: number }[]
  referidos: Referido[]
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

export default function VolunteerDetailModal({ volunteerId, onClose }: { volunteerId: number; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/stats/volunteer/${volunteerId}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [volunteerId])

  const embudoMax = data ? Math.max(...data.embudo.map(n => n.count), 1) : 1

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-gray-900 truncate">{data?.voluntario.nombre || 'Cargando...'}</h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {data?.voluntario.telefono && <span className="flex items-center gap-1"><Phone size={11} />{data.voluntario.telefono}</span>}
                {data?.voluntario.sector && <span className="flex items-center gap-1"><MapPin size={11} />{data.voluntario.sector}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={22} /></button>
        </div>

        {loading || !data ? (
          <div className="py-20 text-center text-gray-400 text-sm">Cargando detalle...</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {nivelBadge(data.voluntario.nivelApoyo)}
              {data.voluntario.registradoPor && (
                <span className="text-xs text-gray-400">Registrado por <span className="font-medium text-gray-600">{data.voluntario.registradoPor.nombre}</span></span>
              )}
              {!data.voluntario.esVoluntario && (
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded">No marcado como voluntario</span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Stat label="Referidos" value={data.stats.totalReferidos} accent="text-purple-600" />
              <Stat label="Votan en SC" value={data.stats.votanSC} accent="text-green-700" />
              <Stat label="Score prom." value={data.stats.scorePromedio} accent="text-gray-700" />
              <Stat label="Sectores" value={data.stats.sectoresCubiertos} accent="text-primary-600" />
            </div>

            {/* Embudo de su red (si tiene referidos) */}
            {data.stats.totalReferidos > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Filter size={15} className="text-primary-600" />Apoyo de sus Referidos</h3>
                <div className="space-y-1.5">
                  {data.embudo.map(n => (
                    <div key={n.nivelApoyo} className="flex items-center gap-2">
                      <div className="w-32 text-xs text-gray-600 text-right flex-shrink-0">{NIVEL_APOYO_LABELS[n.nivelApoyo as NivelApoyo] || n.nivelApoyo}</div>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded flex items-center justify-end px-1.5" style={{ width: `${Math.max((n.count / embudoMax) * 100, 5)}%` }}>
                          <span className="text-[10px] font-bold text-white">{n.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de referidos */}
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2"><Users size={15} className="text-primary-600" />Ciudadanos que Refirió</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {data.referidos.length === 0 ? (
                  <div className="px-4 py-4 text-xs text-gray-400">Este voluntario aún no ha referido ciudadanos.</div>
                ) : data.referidos.map(r => (
                  <div key={r.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><User size={13} className="text-gray-500" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{r.nombreCompleto}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2">
                        {r.sector && <span className="flex items-center gap-0.5"><MapPin size={10} />{r.sector}</span>}
                        <span className="flex items-center gap-0.5"><Phone size={10} />{r.telefono}</span>
                      </div>
                    </div>
                    {nivelBadge(r.nivelApoyo)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
