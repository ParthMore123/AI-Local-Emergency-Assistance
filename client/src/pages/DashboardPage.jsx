import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Siren, Bot, MapPinned } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'
import { STATUS_LABELS } from '../utils/helpers'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { location } = useLocationCtx()
  const [query, setQuery] = useState('')
  const [services, setServices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [nearbyRes, historyRes] = await Promise.all([
          api.get('/services/nearby', { params: { lat: location.lat, lng: location.lng, radiusKm: 20 } }),
          api.get('/emergency/history'),
        ])
        if (!active) return
        setServices(nearbyRes.data.results.slice(0, 6))
        setAlerts(historyRes.data.history.filter((h) => !['completed', 'cancelled'].includes(h.status)).slice(0, 3))
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load dashboard')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [location.lat, location.lng])

  function onSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate('/assistant', { state: { preset: query.trim() } })
  }

  const categories = [
    { type: 'hospital', label: 'Hospitals' },
    { type: 'ambulance', label: 'Ambulance' },
    { type: 'police', label: 'Police' },
    { type: 'fire', label: 'Fire' },
    { type: 'pharmacy', label: 'Pharmacies' },
  ]

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Home</h1>
        <p>Describe an emergency or tap SOS for immediate help.</p>
      </div>

      <div className="sos-hero" style={{ marginBottom: '1rem' }}>
        <div>
          <h2>EMERGENCY SOS — GET EMERGENCY HELP</h2>
          <p>One intentional confirmation shares your location, notifies trusted contacts, and surfaces nearby services.</p>
        </div>
        <Link to="/sos" className="btn sos-cta">
          <Siren size={20} /> Activate Emergency SOS
        </Link>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>
            <Bot size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            AI emergency search
          </h2>
          <form className="search-row" onSubmit={onSearch}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "My friend has fainted. Find the nearest hospital."'
              aria-label="Describe your emergency"
            />
            <button className="btn btn-primary" type="submit">
              Analyze
            </button>
          </form>
          <div className="chip-row" style={{ marginTop: '0.75rem' }}>
            {['Nearest hospital', 'I need an ambulance', 'There is a fire', 'Police near me'].map((chip) => (
              <button key={chip} type="button" className="chip" onClick={() => navigate('/assistant', { state: { preset: chip } })}>
                {chip}
              </button>
            ))}
          </div>
          <p className="disclaimer">AILEA is an assistance tool — call professional emergency services directly when needed.</p>
        </section>

        <section className="panel">
          <h2>Quick categories</h2>
          <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {categories.map((c) => (
              <Link key={c.type} className="btn btn-secondary" to={`/nearby?type=${c.type}`}>
                {c.label}
              </Link>
            ))}
            <Link className="btn btn-secondary" to="/map">
              <MapPinned size={16} /> Open map
            </Link>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <h3>Active alerts</h3>
            {alerts.length === 0 && <p className="service-meta">No active emergency requests.</p>}
            {alerts.map((a) => (
              <Link key={a._id} to="/sos" state={{ requestId: a._id }} className="service-card" style={{ marginTop: '0.5rem' }}>
                <div>
                  <strong>{a.emergencyType}</strong>
                  <div className="service-meta">{STATUS_LABELS[a.status] || a.status}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Nearby emergency services</h2>
          <Link to="/nearby">View all</Link>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        {loading ? (
          <p className="service-meta" style={{ marginTop: '0.75rem' }}>Loading nearby services…</p>
        ) : (
          <div className="service-list" style={{ marginTop: '0.75rem' }}>
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
            {!services.length && <p className="service-meta">No services found near this location. Try updating location or run the seed script.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
