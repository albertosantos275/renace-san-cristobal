import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, UserCheck, Heart,
  BarChart3, TrendingUp, Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/ciudadanos', label: 'Ciudadanos', icon: Users },
  { to: '/admin/promotores', label: 'Promotores', icon: UserCheck },
  { to: '/admin/voluntarios', label: 'Voluntarios', icon: Heart },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/resultados', label: 'Estadísticas', icon: TrendingUp },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <div className="text-white">
          <div className="text-xs font-semibold text-primary-200 uppercase tracking-widest mb-1">Panel Admin</div>
          <div className="text-lg font-bold leading-tight">Renace San Cristóbal</div>
          <div className="text-primary-300 text-sm font-medium">2028</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-primary-100 hover:bg-primary-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{user?.nombre}</div>
            <div className="text-primary-300 text-xs">Administrador</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-primary-200 hover:text-white text-sm transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-primary-700"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-primary-700 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-primary-700 flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setOpen(false)} className="text-white p-1">
                <X size={24} />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-primary-600 font-semibold">Admin</span>
            <ChevronRight size={14} />
            <span className="text-gray-700">Panel de Control</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-primary-600 hover:text-primary-700 font-medium underline">
              Ver sitio público
            </a>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
