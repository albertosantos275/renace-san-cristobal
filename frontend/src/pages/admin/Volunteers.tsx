import { useEffect, useState, useCallback } from 'react'
import { Heart, Search } from 'lucide-react'
import api from '../../lib/api'
import { Citizen, NIVEL_APOYO_LABELS, NivelApoyo } from '../../types'
import VolunteerDetailModal from '../../components/VolunteerDetailModal'

type VolunteerRow = Citizen & { _count?: { referidos: number } }

function nivelBadgeClass(nivel: string) {
  return nivel === 'LIDER_COMUNITARIO' ? 'badge-yellow'
    : nivel === 'MUY_COMPROMETIDO' ? 'badge-green'
    : nivel === 'APOYA' ? 'badge-blue'
    : nivel === 'SIMPATIZANTE' ? 'badge-blue'
    : 'bg-gray-100 text-gray-500'
}

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [sectors, setSectors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<number | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { voluntario: 'true', limit: 200 }
      if (search) params.search = search
      if (sector) params.sector = sector
      const r = await api.get('/citizens', { params })
      setVolunteers(r.data.citizens)
      setTotal(r.data.total)
    } catch {}
    setLoading(false)
  }, [search, sector])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { api.get('/sectors').then(r => setSectors(r.data.map((s: any) => s.nombre))).catch(() => {}) }, [])

  const sorted = [...volunteers].sort((a, b) => (b._count?.referidos || 0) - (a._count?.referidos || 0))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Voluntarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} ciudadanos disponibles para voluntariado · toca uno para ver su detalle</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 py-2.5 text-sm" placeholder="Buscar voluntario..." />
        </div>
        <select value={sector} onChange={e => setSector(e.target.value)} className="input-field py-2.5 text-sm max-w-52">
          <option value="">Todos los sectores</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Heart size={18} className="text-green-500" />
          <h2 className="font-bold text-gray-800">Listado de Voluntarios</h2>
          <span className="text-xs text-gray-400 ml-auto">Toca un voluntario para ver su detalle y red</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Heart size={40} className="mx-auto mb-3 opacity-30" />
            <p>No se encontraron voluntarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Voluntario</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Sector</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Nivel de Apoyo</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Referidos</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((v, i) => (
                  <tr key={v.id} onClick={() => setDetailId(v.id)} className="hover:bg-green-50/40 cursor-pointer transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{v.nombreCompleto}</div>
                      <div className="text-xs text-gray-400">{v.telefono}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{v.sector || '—'}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`badge ${nivelBadgeClass(v.nivelApoyo)}`}>{NIVEL_APOYO_LABELS[v.nivelApoyo as NivelApoyo]}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-green-700 text-base">{v._count?.referidos || 0}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden xl:table-cell">{v.registradoPor?.nombre || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailId !== null && (
        <VolunteerDetailModal volunteerId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  )
}
