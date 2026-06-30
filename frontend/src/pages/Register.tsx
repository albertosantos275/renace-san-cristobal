import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { PRIORIDADES_OPCIONES } from '../types'
import SectorAutocomplete, { SectorOption } from '../components/SectorAutocomplete'

const schema = z.object({
  nombreCompleto:     z.string().min(3, 'Nombre requerido (mín. 3 caracteres)'),
  cedula:             z.string().min(11, 'Cédula debe tener al menos 11 caracteres').max(13),
  telefono:           z.string().min(10, 'Teléfono requerido'),
  edad:               z.string().optional(),
  sexo:               z.string().optional(),
  votaEnSanCristobal: z.boolean().default(true),
  whatsappUpdates:    z.boolean().default(false),
  voluntario:         z.boolean().default(false),
  nivelApoyo:         z.string().default('NEUTRAL'),
  prioridades:        z.array(z.string()).max(3, 'Máximo 3 prioridades'),
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

export default function Register() {
  const navigate = useNavigate()
  const [selectedSector, setSelectedSector] = useState<SectorOption | null>(null)
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      votaEnSanCristobal: true,
      whatsappUpdates:    false,
      voluntario:         false,
      nivelApoyo:         'NEUTRAL',
      prioridades:        [],
    }
  })

  const togglePrioridad = (p: string) => {
    setSelectedPrioridades(prev => {
      if (prev.includes(p)) return prev.filter(x => x !== p)
      if (prev.length >= 3) return prev
      return [...prev, p]
    })
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedSector && !selectedPrioridades) {
      setError('Por favor selecciona tu sector')
      return
    }
    setSubmitting(true); setError('')
    try {
      await api.post('/citizens/public', {
        ...data,
        sector:       selectedSector?.nombre ?? null,
        sectorGeoId:  selectedSector?.id ?? null,
        prioridades:  selectedPrioridades,
      })
      navigate('/gracias')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar. Por favor intente de nuevo.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-1.5 hover:bg-primary-600 rounded-lg">
            <ChevronLeft size={22} />
          </Link>
          <div>
            <div className="font-bold text-sm">Renace San Cristóbal 2028</div>
            <div className="text-primary-300 text-xs">Censo Ciudadano</div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Únete al Movimiento</h1>
          <p className="text-gray-500 text-sm">Completa tu registro en menos de 45 segundos</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Personal */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Información Personal
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre completo *</label>
                <input {...register('nombreCompleto')} className="input-field" placeholder="Juan Carlos Ramírez" />
                {errors.nombreCompleto && <p className="text-red-500 text-xs mt-1">{errors.nombreCompleto.message}</p>}
              </div>
              <div>
                <label className="label">Cédula *</label>
                <input {...register('cedula')} className="input-field" placeholder="000-0000000-0" maxLength={13} />
                {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula.message}</p>}
              </div>
              <div>
                <label className="label">Teléfono / WhatsApp *</label>
                <input {...register('telefono')} type="tel" className="input-field" placeholder="809-000-0000" />
                {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Edad</label>
                  <input {...register('edad')} type="number" min="18" max="100" className="input-field" placeholder="25" />
                </div>
                <div>
                  <label className="label">Sexo</label>
                  <select {...register('sexo')} className="input-field">
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación con autocomplete y GPS */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Ubicación
            </h2>
            <label className="label">Sector o barrio donde reside</label>
            <SectorAutocomplete
              value={selectedSector}
              onChange={setSelectedSector}
            />
          </div>

          {/* Participación */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Participación Ciudadana
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('votaEnSanCristobal')} type="checkbox" className="w-5 h-5 rounded accent-primary-600" />
                <span className="text-gray-700 text-sm">¿Vota en San Cristóbal?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('whatsappUpdates')} type="checkbox" className="w-5 h-5 rounded accent-primary-600" />
                <span className="text-gray-700 text-sm">¿Desea recibir información por WhatsApp?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('voluntario')} type="checkbox" className="w-5 h-5 rounded accent-primary-600" />
                <span className="text-gray-700 text-sm">¿Le gustaría participar como voluntario?</span>
              </label>
            </div>
          </div>

          {/* Nivel */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              Nivel de Apoyo
            </h2>
            <select {...register('nivelApoyo')} className="input-field">
              {nivelOpciones.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>

          {/* Prioridades */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              Prioridades Ciudadanas
            </h2>
            <p className="text-xs text-gray-400 mb-4">Selecciona hasta 3 temas más importantes</p>
            <div className="grid grid-cols-2 gap-2">
              {PRIORIDADES_OPCIONES.map(p => {
                const selected = selectedPrioridades.includes(p)
                const disabled = !selected && selectedPrioridades.length >= 3
                return (
                  <button type="button" key={p} onClick={() => togglePrioridad(p)} disabled={disabled}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      selected ? 'bg-primary-600 border-primary-600 text-white' :
                      disabled ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' :
                      'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    {selected && <CheckCircle size={12} className="inline mr-1" />}
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Problema */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
              Tu Voz
            </h2>
            <label className="label">¿Cuál es el principal problema de su comunidad?</label>
            <textarea {...register('problemaComunidad')} className="input-field resize-none" rows={3}
              placeholder="Cuéntenos qué necesita su comunidad..." />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full btn-primary text-lg py-4 rounded-2xl font-bold shadow-xl">
            {submitting ? 'Registrando...' : '¡UNIRME AL CENSO CIUDADANO!'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4 pb-8">
          Sus datos están protegidos y serán utilizados únicamente para el movimiento ciudadano.
        </p>
      </div>
    </div>
  )
}
