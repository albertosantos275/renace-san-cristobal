import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Public pages
import Home from './pages/Home'
import Register from './pages/Register'
import Thanks from './pages/Thanks'
import Results from './pages/Results'
import Login from './pages/Login'
import MapPage from './pages/Map'

// Admin pages
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCitizens from './pages/admin/Citizens'
import AdminPromoters from './pages/admin/Promoters'
import AdminVolunteers from './pages/admin/Volunteers'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

// Promoter pages
import PromoterLayout from './components/PromoterLayout'
import PromoterDashboard from './pages/promoter/Dashboard'
import PromoterRegister from './pages/promoter/Register'
import PromoterMyCitizens from './pages/promoter/MyCitizens'
import PromoterRanking from './pages/promoter/Ranking'

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.rol !== 'ADMIN') return <Navigate to="/promotor" replace />
  return <>{children}</>
}

function ProtectedPromoter({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/gracias" element={<Thanks />} />
      <Route path="/resultados" element={<Results />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mapa" element={<MapPage />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="ciudadanos" element={<AdminCitizens />} />
        <Route path="promotores" element={<AdminPromoters />} />
        <Route path="voluntarios" element={<AdminVolunteers />} />
        <Route path="reportes" element={<AdminReports />} />
        <Route path="configuracion" element={<AdminSettings />} />
      </Route>

      {/* Promoter */}
      <Route path="/promotor" element={<ProtectedPromoter><PromoterLayout /></ProtectedPromoter>}>
        <Route index element={<PromoterDashboard />} />
        <Route path="registro" element={<PromoterRegister />} />
        <Route path="mis-ciudadanos" element={<PromoterMyCitizens />} />
        <Route path="ranking" element={<PromoterRanking />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
