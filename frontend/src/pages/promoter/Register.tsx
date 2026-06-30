import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import { PRIORIDADES_OPCIONES } from '../../types'
import SectorAutocomplete, { SectorOption } from '../../components/SectorAutocomplete'

const schema = z.object({
  nombreCompleto:     z.string().min(3, 'Requerido'),
  cedula:             z.string().min(11, 'Cédula inválida'),
  telefono:           z.string().min(10, 'Teléfono requerido'),
  edad:               z.string().optional(),
  sexo:               z.string().optional(),
  votaEnSanCristobal: z.boolean().default(true),
  whatsappUpdates:    z.boolean().default(false),
  voluntario:         z.boolean().default(false),
  nivelApoyo:         z.string().default('NEUTRAL'),
  prioridades:        z.array(z.string()).max(3),
  problemaComunidad:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

const nivelOpciones = [
  { value: 'NEUTRAL',           label: 'Neutral' },
  { value: 'SIMPATIZANTE',      label: 'Simpatizante' },
  { value: 'APOYA',             label: 'Apoya activamente' },
  { value: 'MUY_COMPROMETIDO',  label: 'Muy comprometido' },
  { value: 'LIDER_COMUNITARIO', label: 'Líder Comunitario' },
]

interface VolunteerOption { id: number; nombreCompleto: string; sector?: string }

export default function PromoterRegister() {
  const [selectedSector, setSelectedSector] = useState<SectorOption | null>(null)
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>([])
  const [referidoPorId, setReferidoPorId] = useState('')
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [count, setCount] = useState(0)

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { votaEnSanCristobal: true, whatsappUpdates: false, voluntario: false, nivelApoyo: 'NEUTRAL', prioridades: [] }
  })

  useEffect(() => {
    api.get('/citizens', { params: { limit: 1 } }).then(r => setCount(r.data.total)).catch(() => {})
    api.get('/citizens', { params: { voluntario: 'true', limit: 500 } })
      .then(r => setVolunteers(r.data.citizens.map((c: any) => ({ id: c.id, nombreCompleto: c.nombreCompleto, sector: c.sector }))))
      .catch(() => {})
  }, [])

  const togglePrioridad = (p: string) => {
    setSelectedPrioridades(prev => {
      if (prev.includes(p)) return prev.filter(x => x !== p)
      if (prev.length >= 3) return prev
      return [...prev, p]
    })
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true); setError('')
    try {
      await api.post('/citizens', {
        ...data,
        sector:        selectedSector?.nombre ?? null,
        sectorGeoId:   selectedSector?.id ?? null,
        prioridades:   selectedPrioridades,
        referidoPorId: referidoPorId ? Number(referidoPorId) : null,
      })
      setSuccess(true)
      setCount(c => c + 1)
      setTimeout(() => {
        setSuccess(false)
        reset()
        setSelectedSector(null)
        setSelectedPrioridades([])
        setReferidoPorId('')
      }, 2500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Registrar Ciudadano</h1>
          <p className="text-sm text-gray-500 mt-0.5">Has registrado {count} ciudadanos en total</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 flex items-center gap-3 animate-slide-up">
          <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-green-800">¡Ciudadano registrado exitosamente!</div>
            <div className="text-sm text-green-600">El formulario se limpiará en un momento...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Datos personales */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Datos Personales
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input {...register('nombreCompleto')} className="input-field" placeholder="Juan Carlos Ramírez" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Cédula *</label>
                <input {...register('cedula')} className="input-field" placeholder="000-0000000-0" />
              </div>
              <div>
                <label className="label">Teléfono *</label>
                <input {...register('telefono')} type="tel" className="input-field" placeholder="809-000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Edad</label>
                <input {...register('edad')} type="number" className="input-field" placeholder="25" />
              </div>
              <div>
                <label className="label">Sexo</label>
                <select {...register('sexo')} className="input-field">
                  <option value="">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sector con autocomplete + GPS */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Sector del Ciudadano
          </h2>
          <label className="label">Sector o barrio donde reside</label>
          <SectorAutocomplete
            value={selectedSector}
            onChange={setSelectedSector}
            placeholder="Buscar sector..."
          />

          <div className="mt-4">
            <label className="label">¿Quién lo refirió? <span className="text-xs text-gray-400 font-normal">(voluntario, opcional)</span></label>
            <select value={referidoPorId} onChange={e => setReferidoPorId(e.target.value)} className="input-field">
              <option value="">Nadie / registro directo</option>
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>{v.nombreCompleto}{v.sector ? ` · ${v.sector}` : ''}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Si un voluntario trajo a este ciudadano, selecciónalo para construir el linaje.</p>
          </div>
        </div>

        {/* Participación */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Participación y Apoyo
          </h2>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('votaEnSanCristobal')} type="checkbox" className="w-5 h-5 accent-primary-600" />
              <span className="text-sm text-gray-700">¿Vota en San Cristóbal?</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('whatsappUpdates')} type="checkbox" className="w-5 h-5 accent-primary-600" />
              <span className="text-sm text-gray-700">¿Recibir info por WhatsApp?</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('voluntario')} type="checkbox" className="w-5 h-5 accent-primary-600" />
              <span className="text-sm text-gray-700">¿Quiere ser voluntario?</span>
            </label>
          </div>
          <label className="label">Nivel de Apoyo</label>
          <select {...register('nivelApoyo')} className="input-field">
            {nivelOpciones.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>

        {/* Prioridades */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            Prioridades <span className="text-xs text-gray-400 font-normal">(máx. 3)</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {PRIORIDADES_OPCIONES.map(p => {
              const sel = selectedPrioridades.includes(p)
              const dis = !sel && selectedPrioridades.length >= 3
              return (
                <button type="button" key={p} onClick={() => togglePrioridad(p)} disabled={dis}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    sel ? 'bg-primary-600 border-primary-600 text-white' :
                    dis ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' :
                    'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                  }`}
                >
                  {sel && '✓ '}{p}
                </button>
              )
            })}
          </div>
        </div>

        {/* Problema */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            Problema de la Comunidad
          </h2>
          <textarea {...register('problemaComunidad')} className="input-field resize-none text-sm" rows={2}
            placeholder="¿Cuál es el principal problema de su comunidad?" />
        </div>

        <button type="submit" disabled={submitting || success}
          className="w-full btn-primary text-base py-4 rounded-2xl font-bold shadow-xl">
          {submitting ? 'Registrando...' : success ? '✓ ¡Registrado!' : 'REGISTRAR CIUDADANO'}
        </button>
      </form>
    </div>
  )
}
