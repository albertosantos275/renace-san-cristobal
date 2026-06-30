import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Trophy } from 'lucide-react'
import api from '../../lib/api'

interface PromoterRank {
  id: number; nombre: string; count: number
}

export default function PromoterRanking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState<PromoterRank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats/admin').then(r => {
      setRanking(r.data.topPromotores || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const myRank = ranking.findIndex(p => p.id === user?.id) + 1 || null

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Trophy size={24} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ranking de Promotores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quién está registrando más ciudadanos</p>
        </div>
      </div>

      {/* My position highlight */}
      {myRank && (
        <div className={`card flex items-center gap-4 border-2 ${
          myRank === 1 ? 'border-yellow-400 bg-yellow-50' :
          myRank === 2 ? 'border-gray-300 bg-gray-50' :
          myRank === 3 ? 'border-amber-600 bg-amber-50' :
          'border-primary-200 bg-primary-50'
        }`}>
          <div className="text-3xl">{myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`}</div>
          <div>
            <div className="font-bold text-gray-800">Tu posición: #{myRank}</div>
            <div className="text-sm text-gray-600">
              {myRank === 1 ? '¡Eres el promotor número uno!' :
               `Hay ${myRank - 1} promotor${myRank - 1 > 1 ? 'es' : ''} por delante de ti. ¡Sigue adelante!`}
            </div>
          </div>
          <div className="ml-auto text-2xl font-black text-primary-700">
            {ranking[myRank - 1] ? Number(ranking[myRank - 1].count) : 0}
          </div>
        </div>
      )}

      {/* Full ranking */}
      {loading ? (
        <div className="card py-12 text-center text-gray-400">Cargando ranking...</div>
      ) : ranking.length === 0 ? (
        <div className="card py-12 text-center text-gray-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay datos de ranking disponibles</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-primary-700 text-white flex font-semibold text-sm">
            <div className="w-12">#</div>
            <div className="flex-1">Promotor</div>
            <div>Registros</div>
          </div>
          <div className="divide-y divide-gray-50">
            {ranking.map((p, i) => {
              const isMe = p.id === user?.id
              const max = Number(ranking[0]?.count) || 1
              return (
                <div key={p.id} className={`flex items-center gap-0 px-6 py-4 ${isMe ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                  <div className="w-12 font-bold text-gray-500 text-lg">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm text-gray-400">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${isMe ? 'text-primary-700' : 'text-gray-800'}`}>
                      {p.nombre}
                      {isMe && <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-bold">Tú</span>}
                    </div>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]">
                      <div
                        className={`h-full rounded-full ${isMe ? 'bg-primary-600' : 'bg-primary-300'}`}
                        style={{ width: `${(Number(p.count) / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-xl font-black ${isMe ? 'text-primary-700' : 'text-gray-700'}`}>
                    {Number(p.count)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
