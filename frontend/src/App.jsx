import { useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import Loading from './components/Loading.jsx';
import MaintenanceBanner from './components/common/MaintenanceBanner.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

// Eager Load Critical Pages
import Login from './pages/auth/Login.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

// Lazy Load Help
const HelpCenter = lazy(() => import('./pages/help/HelpCenter.jsx'));

// Lazy Load Logistics Pages
const LogisticDashboard = lazy(() => import('./pages/logistics/LogisticDashboard.jsx'));
const DispatchesPage = lazy(() => import('./pages/logistics/DispatchesPage.jsx'));
const BoxesPage = lazy(() => import('./pages/logistics/BoxesPage.jsx'));
const TripsPage = lazy(() => import('./pages/logistics/TripsPage.jsx'));
const MonitoringPage = lazy(() => import('./pages/logistics/MonitoringPage.jsx'));
const DocumentsPage = lazy(() => import('./pages/logistics/DocumentsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/logistics/ReportsPage.jsx'));
const DriverMobileDashboard = lazy(() => import('./pages/logistics/DriverMobileDashboard.jsx'));
const DriverTripDetails = lazy(() => import('./pages/logistics/DriverTripDetails.jsx'));

function App() {
  const [auth, setAuth] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        return { user: JSON.parse(savedUser), token: savedToken };
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    return { user: null, token: null };
  });

  const handleLogin = ({ user, token }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setAuth({ user, token })
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuth({ user: null, token: null })
  }

  const RequireAuth = ({ children, role }) => {
    if (!auth.user) {
      return <Navigate to="/login" replace />
    }

    const userRole = auth.user.role;

    if (role) {
      const allowedRoles = Array.isArray(role) ? role : [role];

      if (!allowedRoles.includes(userRole)) {
        if (userRole === 'admin' || userRole === 'operator') return <Navigate to="/admin" replace />;
        if (userRole === 'driver') return <Navigate to="/driver/dashboard" replace />;
        return <Navigate to="/login" replace />;
      }
    }

    return children
  }

  return (
    <Suspense fallback={<Loading />}>
      <Toaster position="top-right" />
      <MaintenanceBanner />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Panel compartido para roles administrativos (Logística) */}
        <Route element={<RequireAuth role={['admin', 'operator']}><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin" element={<LogisticDashboard user={auth.user} />} />
          <Route path="/admin/dispatches" element={<DispatchesPage />} />
          <Route path="/admin/boxes" element={<BoxesPage />} />
          <Route path="/admin/trips" element={<TripsPage />} />
          <Route path="/admin/monitoring" element={<MonitoringPage />} />
          <Route path="/admin/documents" element={<DocumentsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>

        {/* Panel para Choferes */}
        <Route element={<RequireAuth role="driver"><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/driver/dashboard" element={<DriverMobileDashboard user={auth.user} />} />
          <Route path="/driver/trips/:id" element={<DriverTripDetails user={auth.user} />} />
        </Route>

        <Route element={<RequireAuth><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/help" element={<HelpCenter />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="mt-12 text-gray-600 text-sm text-center w-full pb-6">
        &copy; {new Date().getFullYear()} - Plataforma de Gestión Logística y Trazabilidad de Despachos
      </footer>
    </Suspense>
  )
}

export default App