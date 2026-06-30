import { BarChart3 } from 'lucide-react'
import StatsPanel from '../components/StatsPanel'

// Rendered inside the admin/promoter layouts (keeps the side menu).
export default function Estadisticas() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center">
          <BarChart3 size={22} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Estadísticas</h1>
          <p className="text-gray-500 text-sm">Resumen del censo ciudadano</p>
        </div>
      </div>

      <StatsPanel />
    </div>
  )
}
