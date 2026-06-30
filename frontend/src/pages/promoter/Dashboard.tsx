import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { UserPlus, Users, TrendingUp, Star, ArrowRight } from 'lucide-react'
import api from '../../lib/api'

export default function PromoterDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, hoy: 0, semana: 0, voluntarios: 0 })
  const [ranking, setRanking] = useState<{ id: number; nombre: string; count: number }[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myRes, allRes] = await Promise.all([
          api.get('/citizens', { params: { limit: 1 } }),
          api.get('/stats/admin'),
        ])

        const today = new Date(); today.setHours(0,0,0,0)
        const week = new Date(); week.setDate(week.getDate() - 7)

        const [hoyRes, semanaRes, volRes] = await Promise.all([
          api.get('/citizens', { params: { periodo: 'hoy', limit: 1 } }),
          api.get('/citizens', { params: { periodo: 'semana', limit: 1 } }),
          api.get('/citizens', { params: { voluntario: 'true', limit: 1 } }),
        ])

        setStats({
          total: myRes.data.total,
          hoy: hoyRes.data.total,
          semana: semanaRes.data.total,
          voluntarios: volRes.data.total,
        })

        const top = allRes.data.topPromotores || []
        setRanking(top)
        const rank = top.findIndex((p: any) => p.id === user?.id)
        setMyRank(rank >= 0 ? rank + 1 : null)
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [user?.id])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Tu panel de promotor · Renace San Cristóbal 2028</p>
      </div>

      {/* Quick action */}
      <Link
        to="/promotor/registro"
        className="block bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-primary-100 text-sm font-medium mb-1">Acción rápida</div>
            <div className="text-2xl font-black">Registrar Nuevo Ciudadano</div>
            <div className="text-primary-200 text-sm mt-1">Toca para registrar ahora</div>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus size={28} />
          </div>
        </div>
      </Link>

      {/* My stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="text-4xl font-black text-primary-700">{loading ? '—' : stats.total}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Mis Registros Totales</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-black text-green-600">{loading ? '—' : stats.hoy}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Registros Hoy</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-black text-primary-500">{loading ? '—' : stats.semana}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Esta Semana</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-black text-purple-600">{loading ? '—' : stats.voluntarios}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Voluntarios</div>
        </div>
      </div>

      {/* My rank */}
      {myRank && (
        <div className="card bg-yellow-50 border border-yellow-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-2xl text-yellow-900">
            #{myRank}
          </div>
          <div>
            <div className="font-bold text-gray-800">Tu posición en el ranking</div>
            <div className="text-sm text-gray-600 mt-0.5">
              {myRank === 1 ? '🥇 ¡Eres el promotor #1!' : myRank === 2 ? '🥈 ¡Segundo lugar!' : myRank === 3 ? '🥉 ¡Tercer lugar!' : `Posición ${myRank} entre todos los promotores`}
            </div>
          </div>
        </div>
      )}

      {/* Mini ranking */}
      {ranking.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Star size={18} className="text-yellow-500" />Ranking General</h2>
            <Link to="/promotor/ranking" className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {ranking.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${p.id === user?.id ? 'bg-primary-50 border border-primary-100' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </div>
                <div className="flex-1 font-medium text-gray-800 text-sm">
                  {p.nombre}
                  {p.id === user?.id && <span className="ml-2 text-xs text-primary-600 font-bold">← Tú</span>}
                </div>
                <div className="font-bold text-primary-700">{Number(p.count)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/promotor/mis-ciudadanos" className="card hover:shadow-md transition-all flex items-center gap-3 p-4">
          <Users size={22} className="text-primary-600" />
          <div className="text-sm font-semibold text-gray-700">Mis Ciudadanos</div>
        </Link>
        <Link to="/promotor/ranking" className="card hover:shadow-md transition-all flex items-center gap-3 p-4">
          <TrendingUp size={22} className="text-primary-600" />
          <div className="text-sm font-semibold text-gray-700">Ver Ranking</div>
        </Link>
      </div>
    </div>
  )
}
