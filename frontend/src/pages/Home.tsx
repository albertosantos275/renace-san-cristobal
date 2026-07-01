import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Share2, Instagram, LogOut } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
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
  const { user, logout, isAdmin } = useAuth()

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-base sm:text-lg tracking-tight">
            <span className="text-white">Renace</span>
            <span className="text-primary-200 ml-1">San Cristóbal 2028</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/promotor'}
                  className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors"
                  title="Ir a mi panel"
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center font-bold text-sm">
                    {user.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[8rem] truncate">{user.nombre}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary-100 hover:text-white text-sm font-medium transition-colors">
                  Acceder
                </Link>
                <Link
                  to="/registro"
                  className="bg-white text-primary-700 hover:bg-primary-50 font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Regístrate
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN — poster + counter + share (fits mobile without scroll) */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-12 max-w-6xl mx-auto px-4 py-3 lg:py-6 w-full">

        {/* POSTER (clickable → register) — height-capped on mobile */}
        <Link
          to="/registro"
          title="¡Inscríbete!"
          className="block shrink-0 w-full max-w-[68vw] sm:max-w-xs lg:max-w-sm"
        >
          <img
            src="/afiche.jpg"
            alt="Oliver Santos — Si lo quieres como Alcalde, ¡Inscríbete!"
            className="mx-auto rounded-2xl shadow-2xl transition-transform duration-200 hover:scale-[1.02] max-h-[40vh] w-auto lg:max-h-none lg:w-full"
          />
        </Link>

        {/* COUNTER + SHARE */}
        <div className="w-full max-w-md text-center lg:text-left">
          {/* Live counter */}
          <div className="flex items-center gap-2 justify-center lg:justify-start text-primary-100 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-0.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            En tiempo real
          </div>
          <div className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none">
            {loading ? <span className="text-white/30">---</span> : <AnimatedCounter target={total} />}
          </div>
          <p className="text-xs sm:text-sm font-bold text-primary-200 uppercase tracking-widest mt-0.5 mb-3">
            Ciudadanos Registrados
          </p>

          {/* Progress */}
          <div className="mb-5 max-w-md mx-auto lg:mx-0">
            <div className="flex justify-between text-[11px] sm:text-xs text-primary-100 mb-1">
              <span>Meta: {meta.toLocaleString('es-DO')}</span>
              <span className="font-bold text-yellow-300">{pct}% completado</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-300 rounded-full transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Ayúdanos a crecer — compact share + follow */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-3 text-primary-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
              <div className="flex-1 h-px bg-white/20" />
              Ayúdanos a crecer
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={whatsappShare}
                className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <Share2 size={16} />
                Compartir
              </button>
              <a
                href="https://www.instagram.com/oliver_santos2424"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <Instagram size={16} />
                Seguir
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
