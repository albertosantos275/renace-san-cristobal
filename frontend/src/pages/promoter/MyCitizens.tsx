import { useEffect, useState, useCallback } from 'react'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import { Citizen, NIVEL_APOYO_LABELS, NivelApoyo } from '../../types'

const NIVEL_COLORS: Record<NivelApoyo, string> = {
  NEUTRAL: 'badge-blue',
  SIMPATIZANTE: 'badge-yellow',
  APOYA: 'badge-green',
  MUY_COMPROMETIDO: 'badge-purple',
  LIDER_COMUNITARIO: 'badge-red',
}

export default function PromoterMyCitizens() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [sectors, setSectors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit }
      if (search) params.search = search
      if (sector) params.sector = sector
      const r = await api.get('/citizens', { params })
      setCitizens(r.data.citizens)
      setTotal(r.data.total)
    } catch {}
    setLoading(false)
  }, [page, search, sector])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { api.get('/sectors').then(r => setSectors(r.data.map((s: any) => s.nombre))).catch(() => {}) }, [])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Mis Ciudadanos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Has registrado {total} ciudadanos</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="input-field pl-9 py-2.5 text-sm" placeholder="Buscar..." />
        </div>
        <select value={sector} onChange={e => { setSector(e.target.value); setPage(1) }} className="input-field py-2.5 text-sm max-w-48">
          <option value="">Todos los sectores</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : citizens.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay ciudadanos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {citizens.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0 text-sm">
                  {c.nombreCompleto.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{c.nombreCompleto}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                    <span>{c.cedula}</span>
                    <span>·</span>
                    <span>{c.telefono}</span>
                    {c.sector && <><span>·</span><span>{c.sector}</span></>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={`badge ${NIVEL_COLORS[c.nivelApoyo as NivelApoyo]}`}>
                      {NIVEL_APOYO_LABELS[c.nivelApoyo as NivelApoyo]}
                    </span>
                    {c.voluntario && <span className="badge badge-green">Voluntario</span>}
                    {c.whatsappUpdates && <span className="badge badge-blue">WhatsApp</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-right flex-shrink-0">
                  {new Date(c.createdAt).toLocaleDateString('es-DO')}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{total} total</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
