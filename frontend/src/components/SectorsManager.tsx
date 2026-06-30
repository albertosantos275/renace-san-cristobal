import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, MapPin } from 'lucide-react'
import api from '../lib/api'
import { Sector } from '../types'

export default function SectorsManager() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const fetch = () => {
    setLoading(true)
    api.get('/sectors').then(r => setSectors(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true); setError('')
    try {
      await api.post('/sectors', { nombre: newName.trim() })
      setNewName('')
      fetch()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al crear')
    }
    setCreating(false)
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return
    try {
      await api.put(`/sectors/${id}`, { nombre: editName.trim() })
      setEditId(null); fetch()
    } catch (e: any) { setError(e.response?.data?.error || 'Error al actualizar') }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar el sector "${name}"?`)) return
    try { await api.delete(`/sectors/${id}`); fetch() } catch {}
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Create */}
      <div className="card">
        <h2 className="font-bold text-gray-800 mb-4">Agregar Nuevo Sector</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-3">{error}</div>}
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="input-field flex-1"
            placeholder="Nombre del sector (ej: Madre Vieja)"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-3 whitespace-nowrap"
          >
            <Plus size={18} />
            {creating ? 'Guardando...' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Sectores Registrados</h2>
          <span className="badge badge-blue">{sectors.length} sectores</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : sectors.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <MapPin size={36} className="mx-auto mb-2 opacity-30" />
            <p>No hay sectores registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
            {sectors.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-primary-600" />
                </div>
                {editId === s.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(s.id)}
                      className="input-field py-2 flex-1"
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(s.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                    <button onClick={() => setEditId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{s.nombre}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.ciudadanos.toLocaleString('es-DO')} ciudadanos</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditId(s.id); setEditName(s.nombre) }}
                        className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.nombre)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
