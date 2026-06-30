import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Loader2, ChevronDown, X } from 'lucide-react'
import api from '../lib/api'

export interface SectorOption {
  id: number
  nombre: string
  zone?: string | null
  centerLat?: number | null
  centerLng?: number | null
}

interface Props {
  value?: SectorOption | null
  onChange: (sector: SectorOption | null) => void
  placeholder?: string
  required?: boolean
  error?: string
}

export default function SectorAutocomplete({ value, onChange, placeholder = 'Escribe tu sector o barrio...', required, error }: Props) {
  const [query, setQuery] = useState(value?.nombre ?? '')
  const [results, setResults] = useState<SectorOption[]>([])
  const [open, setOpen] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsMsg, setGpsMsg] = useState('')
  const [gpsSuggestion, setGpsSuggestion] = useState<SectorOption | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync input when value changes externally
  useEffect(() => {
    if (value) setQuery(value.nombre)
    else if (!query) setQuery('')
  }, [value])

  const handleInput = (q: string) => {
    setQuery(q)
    setOpen(true)
    setGpsSuggestion(null)
    if (!q.trim()) { setResults([]); onChange(null); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      try {
        const r = await api.get('/sectors/search', { params: { q } })
        setResults(r.data)
      } catch {}
    }, 200)
  }

  const select = (sector: SectorOption | null) => {
    onChange(sector)
    setQuery(sector?.nombre ?? 'Otro / No aparece mi sector')
    setOpen(false)
    setResults([])
    setGpsSuggestion(null)
    setGpsMsg('')
  }

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGpsMsg('Tu dispositivo no soporta GPS')
      return
    }
    setGpsLoading(true)
    setGpsMsg('Obteniendo ubicación...')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await api.post('/sectors/detect-location', {
            lat: coords.latitude,
            lng: coords.longitude
          })
          if (r.data.sector) {
            setGpsSuggestion(r.data.sector)
            setGpsMsg(`Detectamos que probablemente resides en ${r.data.sector.nombre}`)
          } else {
            setGpsMsg('No encontramos un sector para tu ubicación. Selecciona manualmente.')
          }
        } catch {
          setGpsMsg('Error al detectar sector. Selecciona manualmente.')
        }
        setGpsLoading(false)
      },
      () => {
        setGpsMsg('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
        setGpsLoading(false)
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }

  const clearSelection = () => {
    setQuery('')
    onChange(null)
    setGpsSuggestion(null)
    setGpsMsg('')
    setResults([])
  }

  const isSelected = !!value

  return (
    <div ref={wrapperRef} className="space-y-2">
      {/* Input */}
      <div className="relative">
        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (!isSelected) setOpen(true) }}
          className={`input-field pl-9 pr-10 ${error ? 'border-red-300 focus:ring-red-400' : ''} ${isSelected ? 'bg-primary-50 border-primary-300' : ''}`}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        {(query || isSelected) && (
          <button type="button" onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
        {!query && (
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}

        {/* Dropdown */}
        {open && (results.length > 0 || query.length >= 1) && (
          <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
            {results.map(s => (
              <li
                key={s.id}
                onMouseDown={() => select(s)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary-50 transition-colors"
              >
                <MapPin size={14} className="text-primary-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-800">{s.nombre}</span>
                  {s.zone && <span className="text-xs text-gray-400 ml-2">{s.zone}</span>}
                </div>
              </li>
            ))}
            <li
              onMouseDown={() => select(null)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-t border-gray-100 text-gray-400 text-sm"
            >
              Otro / No aparece mi sector
            </li>
          </ul>
        )}
      </div>

      {/* GPS detection */}
      <button
        type="button"
        onClick={detectGPS}
        disabled={gpsLoading}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {gpsLoading
          ? <Loader2 size={15} className="animate-spin" />
          : <Navigation size={15} />
        }
        {gpsLoading ? 'Detectando ubicación...' : 'Detectar mi ubicación (GPS)'}
      </button>

      {/* GPS message */}
      {gpsMsg && (
        <div className={`rounded-xl p-3 text-sm ${gpsSuggestion ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
          {gpsSuggestion ? (
            <div>
              <p className="font-medium text-primary-700 mb-2">📍 {gpsMsg}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => select(gpsSuggestion)}
                  className="flex-1 bg-primary-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  ✓ Confirmar sector
                </button>
                <button
                  type="button"
                  onClick={() => { setGpsSuggestion(null); setGpsMsg('') }}
                  className="flex-1 bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cambiar manualmente
                </button>
              </div>
            </div>
          ) : (
            <p>{gpsMsg}</p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
