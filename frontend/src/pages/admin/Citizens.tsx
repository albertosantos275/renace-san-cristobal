import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Download, Trash2, X, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import api from '../../lib/api'
import { Citizen, NIVEL_APOYO_LABELS, NivelApoyo } from '../../types'

const NIVEL_COLORS: Record<NivelApoyo, string> = {
  NEUTRAL: 'badge-blue',
  SIMPATIZANTE: 'badge-yellow',
  APOYA: 'badge-green',
  MUY_COMPROMETIDO: 'badge-purple',
  LIDER_COMUNITARIO: 'badge-red',
}

export default function AdminCitizens() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [nivelApoyo, setNivelApoyo] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [voluntario, setVoluntario] = useState('')
  const [sectors, setSectors] = useState<string[]>([])
  const [deleting, setDeleting] = useState<number | null>(null)
  const [selected, setSelected] = useState<Citizen | null>(null)
  const limit = 20

  const fetchCitizens = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit, search, sector, nivelApoyo, periodo, voluntario }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const r = await api.get('/citizens', { params })
      setCitizens(r.data.citizens)
      setTotal(r.data.total)
    } catch {}
    setLoading(false)
  }, [page, search, sector, nivelApoyo, periodo, voluntario])

  useEffect(() => { fetchCitizens() }, [fetchCitizens])
  useEffect(() => { api.get('/sectors').then(r => setSectors(r.data.map((s: any) => s.nombre))).catch(() => {}) }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este ciudadano? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    try {
      await api.delete(`/citizens/${id}`)
      fetchCitizens()
    } catch {}
    setDeleting(null)
  }

  const exportCSV = async () => {
    const params = new URLSearchParams()
    if (sector) params.set('sector', sector)
    if (voluntario) params.set('voluntario', voluntario)
    const token = localStorage.getItem('token')
    const url = `/api/export/citizens?${params}`
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await resp.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ciudadanos-renace-2028.csv'
    a.click()
  }

  const totalPages = Math.ceil(total / limit)

  const getPrioridades = (raw: string) => {
    try { return JSON.parse(raw) } catch { return [] }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ciudadanos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('es-DO')} registros en total</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="col-span-2 lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input-field pl-9 py-2.5 text-sm"
              placeholder="Buscar nombre, cédula, teléfono..."
            />
          </div>
          <select value={sector} onChange={e => { setSector(e.target.value); setPage(1) }} className="input-field py-2.5 text-sm">
            <option value="">Todos los sectores</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={nivelApoyo} onChange={e => { setNivelApoyo(e.target.value); setPage(1) }} className="input-field py-2.5 text-sm">
            <option value="">Todos los niveles</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="SIMPATIZANTE">Simpatizante</option>
            <option value="APOYA">Apoya</option>
            <option value="MUY_COMPROMETIDO">Muy Comprometido</option>
            <option value="LIDER_COMUNITARIO">Líder Comunitario</option>
          </select>
          <select value={periodo} onChange={e => { setPeriodo(e.target.value); setPage(1) }} className="input-field py-2.5 text-sm">
            <option value="">Todo el tiempo</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Cargando ciudadanos...</p>
          </div>
        ) : citizens.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
            <p>No se encontraron ciudadanos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ciudadano</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contacto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Sector</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Score</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Promotor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Fecha</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {citizens.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-primary-50/40 cursor-pointer transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{c.nombreCompleto}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                        {c.voluntario && <span className="text-green-600 font-medium">✓ Voluntario</span>}
                        {c.whatsappUpdates && <span className="text-primary-500">WhatsApp</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="text-gray-600">{c.cedula}</div>
                      <div className="text-gray-400 text-xs">{c.telefono}</div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-gray-600">{c.sector || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${NIVEL_COLORS[c.nivelApoyo as NivelApoyo] || 'badge-blue'}`}>
                        {NIVEL_APOYO_LABELS[c.nivelApoyo as NivelApoyo] || c.nivelApoyo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center hidden lg:table-cell">
                      <span className={`font-bold text-sm ${c.scorePolit >= 70 ? 'text-green-600' : c.scorePolit >= 40 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {c.scorePolit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden xl:table-cell">{c.registradoPor?.nombre || '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs hidden xl:table-cell">{new Date(c.createdAt).toLocaleDateString('es-DO')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                          disabled={deleting === c.id}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg text-gray-900">Detalle del Ciudadano</h3>
              <button onClick={() => setSelected(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-400">Nombre</span><p className="font-semibold mt-0.5">{selected.nombreCompleto}</p></div>
                <div><span className="text-gray-400">Cédula</span><p className="font-semibold mt-0.5">{selected.cedula}</p></div>
                <div><span className="text-gray-400">Teléfono</span><p className="font-semibold mt-0.5">{selected.telefono}</p></div>
                <div><span className="text-gray-400">Edad</span><p className="font-semibold mt-0.5">{selected.edad || '—'} {selected.sexo ? `· ${selected.sexo === 'M' ? 'Masculino' : selected.sexo === 'F' ? 'Femenino' : 'Otro'}` : ''}</p></div>
                <div><span className="text-gray-400">Sector</span><p className="font-semibold mt-0.5">{selected.sector || '—'}</p></div>
                <div><span className="text-gray-400">Nivel de Apoyo</span><p className="mt-0.5"><span className={`badge ${NIVEL_COLORS[selected.nivelApoyo as NivelApoyo]}`}>{NIVEL_APOYO_LABELS[selected.nivelApoyo as NivelApoyo]}</span></p></div>
                <div><span className="text-gray-400">Score Político</span><p className={`font-bold text-lg mt-0.5 ${selected.scorePolit >= 70 ? 'text-green-600' : selected.scorePolit >= 40 ? 'text-yellow-600' : 'text-gray-500'}`}>{selected.scorePolit}/100</p></div>
                <div><span className="text-gray-400">Registrado por</span><p className="font-semibold mt-0.5">{selected.registradoPor?.nombre || '—'}</p></div>
              </div>
              <div className="flex gap-4 py-2">
                {selected.votaEnSanCristobal && <span className="badge badge-green">Vota en SC</span>}
                {selected.whatsappUpdates && <span className="badge badge-blue">WhatsApp</span>}
                {selected.voluntario && <span className="badge badge-purple">Voluntario</span>}
              </div>
              {getPrioridades(selected.prioridades).length > 0 && (
                <div>
                  <span className="text-gray-400">Prioridades</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {getPrioridades(selected.prioridades).map((p: string) => (
                      <span key={p} className="badge badge-blue">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.problemaComunidad && (
                <div>
                  <span className="text-gray-400">Problema de la comunidad</span>
                  <p className="mt-1 text-gray-700 italic bg-gray-50 rounded-xl p-3">"{selected.problemaComunidad}"</p>
                </div>
              )}
              <div className="text-xs text-gray-400 pt-2 border-t">
                Registrado el {new Date(selected.createdAt).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getPrioridades(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}
