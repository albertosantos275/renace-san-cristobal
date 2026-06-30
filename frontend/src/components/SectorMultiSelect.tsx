import { useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'

interface Props {
  sectors: string[]
  value: string[]
  onChange: (next: string[]) => void
}

// Selector de múltiples sectores: chips de seleccionados + lista filtrable con checkboxes.
export default function SectorMultiSelect({ sectors, value, onChange }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? sectors.filter(s => s.toLowerCase().includes(q)) : sectors
  }, [sectors, query])

  const toggle = (s: string) => {
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s])
  }

  return (
    <div className="space-y-2">
      {/* Chips seleccionados */}
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map(s => (
            <span key={s} className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-lg">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-primary-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Sin sectores asignados</p>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar sector..."
          className="input-field pl-9 py-2 text-sm"
        />
      </div>

      {/* Lista de checkboxes */}
      <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
        {filtered.length === 0 && (
          <div className="px-3 py-3 text-xs text-gray-400">No hay sectores que coincidan.</div>
        )}
        {filtered.map(s => {
          const checked = value.includes(s)
          return (
            <label key={s} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(s)}
                className="w-4 h-4 accent-primary-600"
              />
              <span className={checked ? 'text-gray-800 font-medium' : 'text-gray-600'}>{s}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
