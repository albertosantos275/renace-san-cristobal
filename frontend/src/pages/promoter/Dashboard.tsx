import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { UserPlus, TrendingUp, Target } from 'lucide-react'
import api from '../../lib/api'

export default function PromoterDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, hoy: 0, semana: 0, voluntarios: 0 })
  const [progress, setProgress] = useState<{ meta: number; dailyGrowth: { date: string; count: number }[] }>({ meta: 0, dailyGrowth: [] })
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Stats propias + meta y progreso diario (endpoints accesibles al promotor)
      try {
        const [myRes, hoyRes, semanaRes, volRes, progRes] = await Promise.all([
          api.get('/citizens', { params: { limit: 1 } }),
          api.get('/citizens', { params: { periodo: 'hoy', limit: 1 } }),
          api.get('/citizens', { params: { periodo: 'semana', limit: 1 } }),
          api.get('/citizens', { params: { voluntario: 'true', limit: 1 } }),
          api.get('/stats/my-progress'),
        ])
        setStats({
          total: myRes.data.total,
          hoy: hoyRes.data.total,
          semana: semanaRes.data.total,
          voluntarios: volRes.data.total,
        })
        setProgress({ meta: progRes.data.meta || 0, dailyGrowth: progRes.data.dailyGrowth || [] })
      } catch {}

      // Ranking general (accesible a promotores)
      try {
        const rankRes = await api.get('/stats/ranking')
        const top = rankRes.data.ranking || []
        const rank = top.findIndex((p: any) => p.id === user?.id)
        setMyRank(rank >= 0 ? rank + 1 : null)
      } catch {}

      setLoading(false)
    }
    fetchData()
  }, [user?.id])

  const metaPct = progress.meta > 0 ? Math.min(Math.round((stats.total / progress.meta) * 100), 100) : 0
  const restan = Math.max(progress.meta - stats.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Tu panel de promotor · Renace San Cristóbal 2028</p>
      </div>

      {/* Quick action */}
      <Link
        to="/promotor/registro"
        className="block bg-gradient-to-r from-primary-700 to-primary-600 text-white rounded-2xl p-4 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-primary-100 text-xs font-medium mb-0.5">Acción rápida</div>
            <div className="text-xl font-black">Registrar Nuevo Ciudadano</div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus size={24} />
          </div>
        </div>
      </Link>

      {/* My stats (compact — deja espacio para la gráfica sin scroll) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Link to="/promotor/mis-ciudadanos" className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl sm:text-2xl font-black text-primary-700 leading-none">{loading ? '—' : stats.total}</div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">Mis Registros</div>
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
          <div className="text-xl sm:text-2xl font-black text-green-600 leading-none">{loading ? '—' : stats.hoy}</div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">Hoy</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
          <div className="text-xl sm:text-2xl font-black text-primary-500 leading-none">{loading ? '—' : stats.semana}</div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">Semana</div>
        </div>
        <Link to="/promotor/mis-ciudadanos?voluntario=true" className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl sm:text-2xl font-black text-purple-600 leading-none">{loading ? '—' : stats.voluntarios}</div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium leading-tight">Voluntarios</div>
        </Link>
      </div>

      {/* Mi meta */}
      {progress.meta > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Target size={18} className="text-primary-600" />Mi Meta de Ciudadanos
            </h2>
            <span className="text-sm font-bold text-gray-700">{stats.total.toLocaleString('es-DO')} / {progress.meta.toLocaleString('es-DO')}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full transition-all duration-1000" style={{ width: `${metaPct}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1.5">
            <span className="font-bold text-primary-600">{metaPct}%</span> completado
            {restan > 0 ? ` · te faltan ${restan.toLocaleString('es-DO')}` : ' · ¡meta alcanzada! 🎉'}
          </div>
        </div>
      )}

      {/* Mi progreso por día */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" />Mi Progreso por Día (últimos 30 días)
        </h2>
        {progress.dailyGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progress.dailyGrowth}>
              <defs>
                <linearGradient id="myAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1638D6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1638D6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip labelFormatter={d => `Fecha: ${d}`} formatter={(v) => [v, 'Registros']} />
              <Area type="monotone" dataKey="count" stroke="#1638D6" strokeWidth={2} fill="url(#myAreaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Aún no has registrado ciudadanos</div>
        )}
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

    </div>
  )
}
