import { useEffect, useState } from 'react'
import { Save, Settings, CheckCircle, Users, Plus, X, Pencil, KeyRound, MapPin } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import SectorMultiSelect from '../../components/SectorMultiSelect'
import SectorsManager from '../../components/SectorsManager'

type Tab = 'general' | 'usuarios' | 'sectores'

interface SystemUser {
  id: number
  nombre: string
  email: string
  rol: string
  sectores?: string[]
  activo: boolean
  totalRegistros?: number
  createdAt: string
}

const emptyForm = { id: 0, nombre: '', email: '', password: '', rol: 'PROMOTER', sectores: [] as string[] }

export default function AdminSettings() {
  const { user: currentUser } = useAuth()
  const [tab, setTab] = useState<Tab>('general')

  // ── General config ────────────────────────────────────────────────────────
  const [config, setConfig] = useState({
    meta_ciudadana:          '50000',
    slogan:                  'Construyamos juntos el San Cristóbal que merecemos.',
    registro_publico_activo: 'true',
    texto_contador:          'CIUDADANOS REGISTRADOS',
  })
  const [loadingGeneral, setLoadingGeneral] = useState(true)
  const [savingGeneral, setSavingGeneral]   = useState(false)
  const [savedGeneral, setSavedGeneral]     = useState(false)

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [sectors, setSectors] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [userError, setUserError] = useState('')

  useEffect(() => {
    api.get('/config')
      .then(r => setConfig(c => ({ ...c, ...r.data })))
      .catch(() => {})
      .finally(() => setLoadingGeneral(false))
  }, [])

  const loadUsers = () => {
    setLoadingUsers(true)
    api.get('/users').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoadingUsers(false))
  }

  useEffect(() => {
    if (tab === 'usuarios' && users.length === 0) {
      loadUsers()
      api.get('/sectors').then(r => setSectors(r.data.map((s: any) => s.nombre))).catch(() => {})
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── General handler ─────────────────────────────────────────────────────────
  const saveGeneral = async () => {
    setSavingGeneral(true); setSavedGeneral(false)
    try { await api.put('/config', config); setSavedGeneral(true); setTimeout(() => setSavedGeneral(false), 3000) } catch {}
    setSavingGeneral(false)
  }

  // ── User handlers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm); setEditing(false); setUserError(''); setShowForm(true)
  }

  const openEdit = (u: SystemUser) => {
    setForm({ id: u.id, nombre: u.nombre, email: u.email, password: '', rol: u.rol, sectores: u.sectores || [] })
    setEditing(true); setUserError(''); setShowForm(true)
  }

  const saveUser = async () => {
    if (!form.nombre || !form.email || (!editing && !form.password)) {
      setUserError('Nombre, email y contraseña son requeridos'); return
    }
    setSaving(true); setUserError('')
    try {
      if (editing) {
        const payload: any = { nombre: form.nombre, email: form.email, rol: form.rol, sectores: form.sectores }
        if (form.password) payload.password = form.password // reset password only if provided
        await api.put(`/users/${form.id}`, payload)
      } else {
        await api.post('/users', {
          nombre: form.nombre, email: form.email, password: form.password, rol: form.rol, sectores: form.sectores,
        })
      }
      setShowForm(false)
      loadUsers()
    } catch (e: any) {
      setUserError(e.response?.data?.error || 'Error al guardar el usuario')
    }
    setSaving(false)
  }

  const toggleActive = async (u: SystemUser) => {
    try { await api.put(`/users/${u.id}`, { activo: !u.activo }); loadUsers() } catch {}
  }

  if (loadingGeneral) return <div className="card py-16 text-center text-gray-400">Cargando configuración...</div>

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general',  label: 'General',  icon: <Settings size={15} /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users size={15} /> },
    { id: 'sectores', label: 'Sectores', icon: <MapPin size={15} /> },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-black text-gray-900">Configuración del Sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">Parámetros generales, usuarios y sectores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
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

      {/* ── General ─────────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <>
          {savedGeneral && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium flex items-center gap-2">
              <CheckCircle size={16} /> Configuración guardada exitosamente
            </div>
          )}

          <div className="card space-y-6 max-w-2xl">
            <div>
              <label className="label">Meta Ciudadana</label>
              <input
                type="number"
                value={config.meta_ciudadana}
                onChange={e => setConfig(c => ({ ...c, meta_ciudadana: e.target.value }))}
                className="input-field max-w-xs"
                placeholder="50000"
              />
              <p className="text-xs text-gray-400 mt-1.5">Número de ciudadanos objetivo para el censo</p>
            </div>

            <div>
              <label className="label">Slogan del Movimiento</label>
              <textarea
                value={config.slogan}
                onChange={e => setConfig(c => ({ ...c, slogan: e.target.value }))}
                className="input-field resize-none"
                rows={2}
              />
              <p className="text-xs text-gray-400 mt-1.5">Frase que se muestra en la página principal</p>
            </div>

            <div>
              <label className="label">Texto del Contador</label>
              <input
                value={config.texto_contador}
                onChange={e => setConfig(c => ({ ...c, texto_contador: e.target.value }))}
                className="input-field"
                placeholder="CIUDADANOS REGISTRADOS"
              />
            </div>

            <div>
              <label className="label">Registro Público</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setConfig(c => ({ ...c, registro_publico_activo: 'true' }))}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                    config.registro_publico_activo === 'true'
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  Activo
                </button>
                <button
                  onClick={() => setConfig(c => ({ ...c, registro_publico_activo: 'false' }))}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                    config.registro_publico_activo === 'false'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-red-300'
                  }`}
                >
                  Desactivado
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Controla si el público puede registrarse sin login</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button onClick={saveGeneral} disabled={savingGeneral} className="btn-primary flex items-center gap-2 px-8">
                <Save size={18} />
                {savingGeneral ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          <div className="card bg-gray-50 max-w-2xl">
            <h2 className="font-bold text-gray-700 mb-3">Información del Sistema</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Versión</span><span className="font-medium">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Base de datos</span><span className="font-medium">SQLite (local)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Stack</span><span className="font-medium">React + Node.js + Prisma</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Movimiento</span><span className="font-medium">Renace San Cristóbal 2028</span></div>
            </div>
          </div>
        </>
      )}

      {/* ── Usuarios ────────────────────────────────────────────────────────── */}
      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{users.filter(u => u.activo).length} usuarios activos · {users.length} en total</p>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2.5 text-sm">
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingUsers ? (
              <div className="py-12 text-center text-gray-400 text-sm">Cargando usuarios...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Sectores</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => {
                      const isSelf = u.id === currentUser?.id
                      return (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-800">
                              {u.nombre} {isSelf && <span className="text-xs text-gray-400 font-normal">(tú)</span>}
                            </div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${u.rol === 'ADMIN' ? 'badge-blue' : 'bg-gray-100 text-gray-600'}`}>
                              {u.rol === 'ADMIN' ? 'Administrador' : 'Promotor'}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {u.sectores && u.sectores.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.sectores.map(s => (
                                  <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">{s}</span>
                                ))}
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => !isSelf && toggleActive(u)}
                              disabled={isSelf}
                              title={isSelf ? 'No puedes desactivar tu propia cuenta' : ''}
                              className={`badge ${u.activo ? 'badge-green' : 'badge-red'} ${isSelf ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(u)}
                                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50"
                              >
                                <Pencil size={14} /> Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-400 text-sm">No hay usuarios.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sectores ────────────────────────────────────────────────────────── */}
      {tab === 'sectores' && <SectorsManager />}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">{editing ? 'Editar Usuario' : 'Crear Usuario'}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {userError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{userError}</div>}
            <div className="space-y-4">
              <div>
                <label className="label">Nombre completo *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input-field" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="juan@renace2028.do" />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  {editing ? <><KeyRound size={13} /> Nueva contraseña</> : 'Contraseña *'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="••••••••" />
                {editing && <p className="text-xs text-gray-400 mt-1">Déjalo vacío para mantener la contraseña actual</p>}
              </div>
              <div>
                <label className="label">Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="input-field">
                  <option value="PROMOTER">Promotor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="label">Sectores asignados</label>
                <SectorMultiSelect
                  sectors={sectors}
                  value={form.sectores}
                  onChange={next => setForm({ ...form, sectores: next })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={saveUser} disabled={saving} className="flex-1 btn-primary py-3">
                {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
