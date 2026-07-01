import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { PublicStats } from '../types'

/** Por debajo de este número NO mostramos el "0" gigante ni el "0% completado"
 *  (evita prueba social negativa en el lanzamiento). Ajustable. */
const THRESHOLD_MOSTRAR_CONTADOR = 300
/** Meta de registros para la barra de progreso del hero. */
const META = 10000

const PROPUESTAS = [
  'Gestión cercana y transparente',
  'Obras y servicios para tu barrio',
  'Tu voz decide las prioridades',
]

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

  const total = stats?.total ?? 0
  const mostrarContador = total >= THRESHOLD_MOSTRAR_CONTADOR
  const pct = Math.min(Math.round((total / META) * 100), 100)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-8 right-8 w-96 h-96 rounded-full border-2 border-white" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full border border-white" />
      </div>

      {/* NAV */}
      <nav className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="font-black text-xl sm:text-2xl lg:text-3xl tracking-tight leading-tight">
            <span className="text-white">Renace</span>
            <span className="text-primary-200 ml-1">San Cristóbal 2028</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/promotor'}
                  className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
                  title="Ir a mi panel"
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center font-bold text-sm">
                    {user.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[8rem] truncate">{user.nombre}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-primary-100 hover:text-white text-sm font-medium transition-colors rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
              >
                Acceder
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO — text/CTA/counter first (conversion), candidate photo second */}
      <main className="relative z-10 flex-1 grid lg:grid-cols-2 items-center gap-8 lg:gap-12 max-w-6xl mx-auto px-4 py-6 lg:py-10 w-full">

        {/* LEFT — real HTML headline, slogan, value, CTA, counter */}
        <div className="order-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0 w-full">
          <p className="text-primary-100 font-semibold text-sm sm:text-base tracking-wide">
            Si lo quieres como Alcalde,
          </p>
          <h1 className="font-black tracking-tight leading-[0.95] text-4xl sm:text-5xl lg:text-6xl mt-1">
            OLIVER <span className="text-primary-200">SANTOS</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-primary-50 font-medium">
            Gestión cercana, resultados para todos.
          </p>

          {/* Value block — fills the layout, gives real reasons to sign up */}
          <ul className="mt-5 space-y-2 text-left inline-block">
            {PROPUESTAS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm sm:text-base text-primary-50">
                <CheckCircle2 size={20} className="text-yellow-300 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          {/* CTA — real <a>, big, red, visible hover + focus */}
          <div className="mt-7">
            <Link
              to="/registro"
              className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-lg sm:text-xl uppercase tracking-wide px-8 py-4 rounded-2xl shadow-xl shadow-red-900/30 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
            >
              ¡Inscríbete!
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>

            {/* Purpose microcopy */}
            <p className="mt-3 text-sm text-primary-100 max-w-md mx-auto lg:mx-0">
              Regístrate para sumar tu apoyo y ayudar a decidir las prioridades de San Cristóbal.
            </p>
            {/* Privacy microcopy */}
            <p className="mt-1.5 flex items-center justify-center lg:justify-start gap-1.5 text-xs text-primary-200 max-w-md mx-auto lg:mx-0">
              <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
              No compartimos tus datos. Solo te contactaremos sobre la campaña.
            </p>
          </div>

          {/* COUNTER — dark translucent card (guarantees contrast), threshold-aware */}
          <div className="mt-7 rounded-2xl bg-primary-900/40 backdrop-blur-sm border border-white/15 p-4 sm:p-5 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-2 justify-center lg:justify-start text-primary-100 text-[11px] font-semibold uppercase tracking-widest mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              En tiempo real
            </div>

            {loading ? (
              <div className="h-10 flex items-center justify-center lg:justify-start text-white/40 text-sm">Cargando…</div>
            ) : mostrarContador ? (
              <>
                <div className="text-4xl sm:text-5xl font-black leading-none">
                  <AnimatedCounter target={total} />
                </div>
                <p className="text-xs font-bold text-primary-200 uppercase tracking-widest mt-1 mb-3">
                  Ciudadanos registrados
                </p>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-primary-100">Meta: {META.toLocaleString('es-DO')}</span>
                  <span className="font-bold text-yellow-300">{pct}% completado</span>
                </div>
                <div className="h-2.5 bg-primary-900/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-300 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-black leading-tight">
                  Sé de los primeros en sumarte
                </p>
                <p className="text-sm text-primary-100 mt-1.5">
                  El movimiento está arrancando. Tu registro marca la diferencia.
                </p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — candidate photo only (no burned-in text). Also taps through to register. */}
        <div className="order-2 flex justify-center lg:justify-end">
          <Link to="/registro" title="Inscríbete" className="block rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
            <img
              src="/oliver-recorte.jpg"
              alt="Oliver Santos, candidato a Alcalde de San Cristóbal, sonriendo con traje azul"
              className="rounded-2xl shadow-2xl w-auto max-h-[34vh] sm:max-h-[46vh] lg:max-h-[72vh] object-contain"
            />
          </Link>
        </div>
      </main>
    </div>
  )
}
