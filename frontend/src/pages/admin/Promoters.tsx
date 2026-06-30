import { useEffect, useState } from 'react'
import { Plus, X, Trophy, Search } from 'lucide-react'
import api from '../../lib/api'
import SectorMultiSelect from '../../components/SectorMultiSelect'
import PromoterDetailModal from '../../components/PromoterDetailModal'

interface PromoterUser {
  id: number; nombre: string; email: string; rol: string; sectores?: string[]
  activo: boolean; totalRegistros: number; registrosHoy: number; registrosSemana: number
  ultimoRegistro?: string; createdAt: string
}

export default function AdminPromoters() {
  const [promoters, setPromoters] = useState<PromoterUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sectors, setSectors] = useState<string[]>([])
  const [form, setForm] = useState({ nombre: '', email: '', password: '', sectores: [] as string[], rol: 'PROMOTER' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const loadPromoters = () => {
    setLoading(true)
    api.get('/users').then(r => setPromoters(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadPromoters() }, [])
  useEffect(() => { api.get('/sectors').then(r => setSectors(r.data.map((s: any) => s.nombre))).catch(() => {}) }, [])

  const handleCreate = async () => {
    if (!form.nombre || !form.email || !form.password) { setError('Nombre, email y contraseña requeridos'); return }
    setCreating(true); setError('')
    try {
      await api.post('/users', form)
      setShowForm(false)
      setForm({ nombre: '', email: '', password: '', sectores: [], rol: 'PROMOTER' })
      loadPromoters()
    } catch (e: any) { setError(e.response?.data?.error || 'Error al crear usuario') }
    setCreating(false)
  }

  const handleToggle = async (id: number, activo: boolean) => {
    try { await api.put(`/users/${id}`, { activo: !activo }); loadPromoters() } catch {}
  }

  const downloadCSV = async () => {
    const token = localStorage.getItem('token')
    const resp = await window.fetch('/api/export/promotores', { headers: { Authorization: `Bearer ${token}` } })
    const blob = await resp.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'promotores-renace-2028.csv'
    a.click()
  }

  const q = search.trim().toLowerCase()
  const sorted = [...promoters]
    .filter(p => !q || p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.sectores || []).some(s => s.toLowerCase().includes(q)))
    .sort((a, b) => b.totalRegistros - a.totalRegistros)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Promotores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{promoters.filter(p => p.activo).length} promotores activos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
            CSV
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 py-2.5 text-sm">
            <Plus size={16} />Nuevo Promotor
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 py-2.5 text-sm"
          placeholder="Buscar promotor por nombre, email o sector..."
        />
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Crear Promotor</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="label">Nombre completo *</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-field" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" placeholder="juan@renace2028.do" />
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Sectores asignados</label>
                <SectorMultiSelect
                  sectors={sectors}
                  value={form.sectores}
                  onChange={next => setForm({ ...form, sectores: next })}
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="input-field">
                  <option value="PROMOTER">Promotor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 btn-primary py-3">
                {creating ? 'Creando...' : 'Crear Promotor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ranking table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          <h2 className="font-bold text-gray-800">Ranking de Promotores</h2>
          <span className="text-xs text-gray-400 ml-auto">Toca un promotor para ver su detalle y linaje</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Promotor</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Hoy</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Semana</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Último Registro</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((p, i) => (
                  <tr key={p.id} onClick={() => setDetailId(p.id)} className="hover:bg-primary-50/40 cursor-pointer transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{p.nombre}</div>
                      <div className="text-xs text-gray-400">{p.email}</div>
                      {p.sectores && p.sectores.length > 0 && <div className="text-xs text-primary-500 mt-0.5">📍 {p.sectores.join(', ')}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-primary-700 text-lg">{p.totalRegistros}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600 hidden md:table-cell">{p.registrosHoy}</td>
                    <td className="py-3 px-4 text-right text-gray-600 hidden lg:table-cell">{p.registrosSemana}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs hidden xl:table-cell">
                      {p.ultimoRegistro ? new Date(p.ultimoRegistro).toLocaleDateString('es-DO') : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(p.id, p.activo) }}
                        className={`badge cursor-pointer ${p.activo ? 'badge-green' : 'badge-red'}`}
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalle del promotor (clic en una fila) */}
      {detailId !== null && (
        <PromoterDetailModal promoterId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  )
}
