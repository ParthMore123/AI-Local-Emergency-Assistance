import { NavLink, Outlet } from 'react-router-dom'
import {
  Bot,
  History,
  Home,
  Map,
  Menu,
  Phone,
  Siren,
  UserRound,
  MapPinned,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocationCtx } from '../context/LocationContext'

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/sos', label: 'Emergency SOS', icon: Siren, sos: true },
  { to: '/nearby', label: 'Nearby Services', icon: MapPinned },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/contacts', label: 'Emergency Contacts', icon: Phone },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile & Settings', icon: UserRound },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { location, permission, locating, refreshLocation } = useLocationCtx()
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      {open && <div className="overlay" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand-block">
          <div className="brand">AILEA</div>
          <p>Help When Every Second Matters.</p>
        </div>
        <nav className="nav-list">
          {links.map(({ to, label, icon: Icon, sos, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${sos ? ' sos-nav' : ''}${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.9rem', marginBottom: '0.65rem', opacity: 0.85 }}>
            Signed in as <strong>{user?.name}</strong>
          </div>
          <button className="btn btn-secondary btn-block" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" type="button" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <strong style={{ fontFamily: 'var(--font-display)' }}>Emergency dashboard</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {locating ? 'Detecting location…' : location.label} · {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {permission === 'denied' && (
              <span className="badge" title="Using demo fallback location">
                Location denied
              </span>
            )}
            <button className="btn btn-secondary" type="button" onClick={refreshLocation}>
              Update location
            </button>
            <button className="menu-btn" type="button" aria-label="Close menu" style={{ display: open ? 'grid' : undefined }} onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>

        <nav className="mobile-nav" aria-label="Mobile shortcuts">
          <NavLink to="/" end>
            <Home size={16} />
            Home
          </NavLink>
          <NavLink to="/sos">
            <Siren size={16} />
            SOS
          </NavLink>
          <NavLink to="/map">
            <Map size={16} />
            Map
          </NavLink>
          <NavLink to="/assistant">
            <Bot size={16} />
            AI
          </NavLink>
          <NavLink to="/contacts">
            <Phone size={16} />
            Contacts
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
