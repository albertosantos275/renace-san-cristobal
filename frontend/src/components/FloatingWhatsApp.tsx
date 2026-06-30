import { useLocation } from 'react-router-dom'

// Pages where the floating share button should appear (public-facing only).
const PUBLIC_PATHS = ['/', '/registro', '/gracias', '/resultados', '/mapa']

// Pre-filled message + link that opens in WhatsApp. The user just picks who to send it to.
export function shareOnWhatsApp() {
  const url = window.location.origin
  const msg =
    '🇩🇴 *Renace San Cristóbal 2028*\n\n' +
    'Únete al Censo Ciudadano. Tu voz cuenta y juntos construiremos el San Cristóbal que merecemos.\n\n' +
    '👉 Regístrate aquí: ' + url
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
}

function WhatsAppIcon({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M16.004 0h-.008C7.174 0 .002 7.174.002 16c0 3.5 1.13 6.744 3.05 9.376L1.06 31.27l6.1-1.95A15.9 15.9 0 0 0 16.004 32C24.83 32 32 24.826 32 16S24.83 0 16.004 0Zm9.32 22.594c-.386 1.09-1.92 1.994-3.142 2.258-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.396.99-.576 1.57-.576.188 0 .356.01.508.018.45.018.676.044.972.75.368.886 1.264 3.082 1.37 3.304.108.222.216.522.066.832-.142.32-.266.452-.488.71-.222.258-.432.456-.654.732-.204.24-.434.498-.178.94.256.432 1.14 1.878 2.446 3.04 1.686 1.5 3.05 1.972 3.536 2.176.36.15.79.114 1.054-.168.336-.36.748-.96 1.168-1.55.298-.424.674-.476 1.068-.328.4.142 2.524 1.19 2.958 1.406.434.216.722.32.83.498.106.18.106 1.03-.28 2.12Z" />
    </svg>
  )
}

export default function FloatingWhatsApp() {
  const { pathname } = useLocation()
  if (!PUBLIC_PATHS.includes(pathname)) return null

  return (
    <button
      onClick={shareOnWhatsApp}
      aria-label="Compartir por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
    >
      <WhatsAppIcon size={26} />
      <span className="hidden sm:inline">Compartir</span>
    </button>
  )
}
