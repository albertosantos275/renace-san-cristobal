import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserPlus, Users, Trophy, LayoutDashboard, BarChart3, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/promotor', label: 'Mi Panel', icon: LayoutDashboard, end: true },
  { to: '/promotor/registro', label: 'Registrar Ciudadano', icon: UserPlus },
  { to: '/promotor/mis-ciudadanos', label: 'Mis Ciudadanos', icon: Users },
  { to: '/promotor/ranking', label: 'Ranking', icon: Trophy },
  { to: '/promotor/estadisticas', label: 'Estadísticas', icon: BarChart3 },
]

export default function PromoterLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-primary-700 flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-white font-bold text-lg">Renace 2028</div>
              <button onClick={() => setOpen(false)} className="text-white"><X size={22} /></button>
            </div>
            <nav className="space-y-1 flex-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-white text-primary-700' : 'text-primary-100 hover:bg-primary-600'
                    }`}
                >
                  <Icon size={18} />{label}
                </NavLink>
              ))}
            </nav>
            {isAdmin && (
              <NavLink to="/admin" className="flex items-center gap-2 text-primary-200 text-sm mt-4 hover:text-white">
                → Ir al Panel Admin
              </NavLink>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-primary-200 hover:text-white text-sm mt-3">
              <LogOut size={16} />Cerrar sesión
            </button>
          </aside>
        </div>
      )}

      {/* Top nav */}
      <header className="bg-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu size={22} />
          </button>
          <div className="font-bold text-lg">Renace San Cristóbal 2028</div>
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-white text-primary-700' : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  }`}
              >
                <Icon size={16} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">
                {user?.nombre?.charAt(0)}
              </div>
              <span className="text-sm font-medium">{user?.nombre}</span>
            </div>
            {isAdmin && (
              <NavLink to="/admin" className="hidden lg:block text-xs bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-300">
                Admin
              </NavLink>
            )}
            <button onClick={handleLogout} className="p-2 hover:bg-primary-600 rounded-lg" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
