import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Users, Share2, Star, ArrowRight, Instagram } from 'lucide-react'
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
    <div className="min-h-screen bg-white">
      {/* HEADER NAV */}
      <nav className="bg-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight">
            <span className="text-white">Renace</span>
            <span className="text-primary-300 ml-1">San Cristóbal 2028</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-primary-200 hover:text-white text-sm font-medium transition-colors">
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

      {/* HERO */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white py-20 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full border-2 border-white" />
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full border border-white" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-white" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Star size={14} className="text-yellow-300 fill-yellow-300" />
            Movimiento Ciudadano Oficial
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
            RENACE<br />
            <span className="text-yellow-300">SAN CRISTÓBAL</span><br />
            2028
          </h1>

          <p className="text-xl sm:text-2xl text-primary-100 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            {stats?.slogan || 'Construyamos juntos el San Cristóbal que merecemos.'}
          </p>

          <Link
            to="/registro"
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-yellow-300 hover:text-primary-800 font-bold text-lg px-10 py-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            ÚNETE AL CENSO CIUDADANO
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* COUNTER SECTION */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold uppercase tracking-widest mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Actualizando en tiempo real
          </div>

          <div className="text-7xl sm:text-8xl lg:text-9xl font-black text-primary-700 leading-none mb-2">
            {loading ? (
              <span className="text-gray-200">---</span>
            ) : (
              <AnimatedCounter target={total} />
            )}
          </div>

          <p className="text-xl sm:text-2xl font-bold text-gray-500 uppercase tracking-widest mb-8">
            CIUDADANOS REGISTRADOS
          </p>

          {/* Progress */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-600">Meta: {meta.toLocaleString('es-DO')} ciudadanos</span>
              <span className="text-sm font-bold text-primary-600">{pct}% completado</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
              Faltan {Math.max(0, meta - total).toLocaleString('es-DO')} para la meta
            </p>
          </div>

          <Link
            to="/registro"
            className="btn-primary text-lg px-8 py-4 rounded-2xl inline-flex items-center gap-2 hover:scale-105 transform transition-all duration-200"
          >
            <Users size={20} />
            ÚNETE AHORA
          </Link>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Tu voz importa</h2>
          <p className="text-primary-200 text-lg mb-10 max-w-xl mx-auto">
            Únete al censo ciudadano y ayuda a construir el San Cristóbal que todos merecemos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registro" className="btn-primary bg-white text-primary-700 hover:bg-yellow-300 hover:text-primary-800 text-lg px-8 py-4 rounded-2xl font-bold inline-flex items-center justify-center gap-2">
              <Users size={20} />
              Regístrate Ahora
            </Link>
            <button
              onClick={whatsappShare}
              className="btn-secondary border-white text-white hover:bg-white/10 text-lg px-8 py-4 rounded-2xl font-bold inline-flex items-center justify-center gap-2 border-2"
            >
              <Share2 size={20} />
              Compartir por WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary-900 text-primary-300 py-8 px-4 text-center text-sm">
        <p className="font-semibold text-white mb-1">Renace San Cristóbal 2028</p>
        <p>Movimiento Ciudadano · Censo Democrático Participativo</p>

        {/* Instagram follow */}
        <a
          href="https://www.instagram.com/oliver_santos2424"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white font-semibold px-5 py-2.5 rounded-full hover:opacity-90 hover:scale-105 transition-all duration-200"
        >
          <Instagram size={18} />
          Síguenos en Instagram
        </a>

        <div className="flex justify-center gap-6 mt-6 text-xs">
          <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
          <Link to="/registro" className="hover:text-white transition-colors">Registro</Link>
          <Link to="/login" className="hover:text-white transition-colors">Acceso</Link>
        </div>
      </footer>
    </div>
  )
}
