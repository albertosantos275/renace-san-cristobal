import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import api from '../lib/api'

const schema = z.object({
  nombreCompleto: z.string().min(3, 'Nombre requerido (mín. 3 caracteres)'),
  cedula:         z.string().min(11, 'Cédula debe tener al menos 11 caracteres').max(13),
  telefono:       z.string().min(10, 'Teléfono requerido'),
  edad:           z.string().optional(),
  sexo:           z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true); setError('')
    try {
      await api.post('/citizens/public', { ...data, votaEnSanCristobal: true })
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
          <p className="text-gray-500 text-sm">Completa tu registro en menos de 30 segundos</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Información Personal */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Información Personal</h2>
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

          <button type="submit" disabled={submitting}
            className="w-full btn-primary text-lg py-4 rounded-2xl font-bold shadow-xl">
            {submitting ? 'Registrando...' : '¡UNIRME!'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4 pb-8">
          Sus datos están protegidos y serán utilizados únicamente para el movimiento ciudadano.
        </p>
      </div>
    </div>
  )
}
