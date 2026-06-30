import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Share2, Star, ArrowRight, Instagram } from 'lucide-react'
import api from '../lib/api'
import { PublicStats } from '../types'

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (target === 0) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
          else setCount(target)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString('es-DO')}</span>
}

function whatsappShare() {
  const msg = encodeURIComponent('¡Me uní al Censo Ciudadano Renace San Cristóbal 2028! Tu voz también cuenta. Regístrate aquí: ' + window.location.origin + '/registro')
  window.open(`https://wa.me/?text=${msg}`, '_blank')
}

export default function Home() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats/public')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    const interval = setInterval(() => {
      api.get('/stats/public').then(r => setStats(r.data)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const meta = stats?.meta ?? 50000
  const total = stats?.total ?? 0
  const pct = Math.min(Math.round((total / meta) * 100), 100)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-8 right-8 w-96 h-96 rounded-full border-2 border-white" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full border border-white" />
      </div>

      {/* NAV */}
      <nav className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-base sm:text-lg tracking-tight">
            <span className="text-white">Renace</span>
            <span className="text-primary-200 ml-1">San Cristóbal 2028</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-primary-100 hover:text-white text-sm font-medium transition-colors">
              Acceder
            </Link>
            <Link
              to="/registro"
              className="bg-white text-primary-700 hover:bg-primary-50 font-semibold text-sm px-4 py-2 rounded-lg transition-all"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </nav>

      {/* MAIN — everything centered in one view */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto px-4 py-6">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium mb-4">
          <Star size={13} className="text-yellow-300 fill-yellow-300" />
          Movimiento Ciudadano Oficial
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-3">
          RENACE <span className="text-yellow-300">SAN CRISTÓBAL</span> 2028
        </h1>

        <p className="text-base sm:text-lg text-primary-100 font-light mb-6 max-w-xl">
          {stats?.slogan || 'Construyamos juntos el San Cristóbal que merecemos.'}
        </p>

        {/* Live counter */}
        <div className="flex items-center gap-2 text-primary-100 text-xs font-semibold uppercase tracking-widest mb-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          En tiempo real
        </div>
        <div className="text-6xl sm:text-7xl font-black leading-none">
          {loading ? <span className="text-white/30">---</span> : <AnimatedCounter target={total} />}
        </div>
        <p className="text-sm font-bold text-primary-200 uppercase tracking-widest mt-1 mb-4">
          Ciudadanos Registrados
        </p>

        {/* Progress */}
        <div className="w-full max-w-md mb-7">
          <div className="flex justify-between text-xs text-primary-100 mb-1.5">
            <span>Meta: {meta.toLocaleString('es-DO')}</span>
            <span className="font-bold text-yellow-300">{pct}% completado</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-300 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Primary CTA — the single "join" action */}
        <Link
          to="/registro"
          className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-yellow-300 hover:text-primary-800 font-bold text-base sm:text-lg px-8 py-3.5 rounded-2xl shadow-2xl transition-all duration-200 hover:scale-105"
        >
          ÚNETE AL CENSO CIUDADANO
          <ArrowRight size={20} />
        </Link>

        {/* Ayúdanos a crecer — share + follow */}
        <div className="w-full max-w-md mt-8">
          <div className="flex items-center gap-3 text-primary-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <div className="flex-1 h-px bg-white/20" />
            Ayúdanos a crecer
            <div className="flex-1 h-px bg-white/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={whatsappShare}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              <Share2 size={18} />
              Compartir
            </button>
            <a
              href="https://www.instagram.com/oliver_santos2424"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white font-semibold px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              <Instagram size={18} />
              Seguir
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 text-center text-primary-200 text-xs py-4 px-4">
        Movimiento Ciudadano · Censo Democrático Participativo
      </footer>
    </div>
  )
}
