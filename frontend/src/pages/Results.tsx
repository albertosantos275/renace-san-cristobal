import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import StatsPanel from '../components/StatsPanel'

export default function Results() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-1.5 hover:bg-primary-600 rounded-lg"><ChevronLeft size={22} /></Link>
          <div>
            <div className="font-bold">Estadísticas</div>
            <div className="text-primary-300 text-xs">Renace San Cristóbal 2028</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <StatsPanel />
      </div>
    </div>
  )
}
