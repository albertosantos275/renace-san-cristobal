import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Share2, Instagram, UserPlus, Home } from 'lucide-react'

function whatsappShare() {
  const msg = encodeURIComponent('¡Me uní a Renace San Cristóbal 2028! Tu voz también cuenta. Regístrate aquí: ' + window.location.origin + '/registro')
  window.open(`https://wa.me/?text=${msg}`, '_blank')
}

export default function Thanks() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-slide-up">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={44} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-3">
          ¡Gracias por unirte!
        </h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          Gracias por unirte a <strong>Renace San Cristóbal 2028</strong>.
          Tu voz es importante y juntos construiremos el San Cristóbal que merecemos.
        </p>

        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-8">
          <p className="text-primary-700 text-sm font-medium">
            🇩🇴 Eres parte del movimiento ciudadano más importante de San Cristóbal.
          </p>
        </div>

        {/* Ayúdanos a crecer — share + follow */}
        <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <div className="flex-1 h-px bg-gray-200" />
          Ayúdanos a crecer
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <button
            onClick={whatsappShare}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold py-3.5 rounded-xl transition-all duration-200"
          >
            <Share2 size={18} />
            Compartir por WhatsApp
          </button>

          <a
            href="https://www.instagram.com/oliver_santos2424"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white font-semibold py-3.5 rounded-xl transition-all duration-200"
          >
            <Instagram size={18} />
            Síguenos en Instagram
          </a>

          <button
            onClick={() => navigate('/registro')}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200"
          >
            <UserPlus size={18} />
            Registrar otra persona
          </button>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl transition-all duration-200"
          >
            <Home size={18} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
