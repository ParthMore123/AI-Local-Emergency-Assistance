import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SosPage from './pages/SosPage'
import MapPage from './pages/MapPage'
import AssistantPage from './pages/AssistantPage'
import ContactsPage from './pages/ContactsPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import NearbyPage from './pages/NearbyPage'

function Protected({ children }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">AILEA</div>
        <p>Loading emergency assistance…</p>
      </div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { token, loading } = useAuth()
  if (loading) return null
  if (token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="sos" element={<SosPage />} />
        <Route path="nearby" element={<NearbyPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
