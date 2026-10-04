import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Siren, Bot, MapPinned, MapPin } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'
import { STATUS_LABELS } from '../utils/helpers'
import { PALGHAR_DISTRICT_CITIES } from '../utils/cities'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { location, selectCity } = useLocationCtx()
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
          api.get('/services/nearby', { params: { lat: location.lat, lng: location.lng, radiusKm: 60 } }),
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
    { type: 'hospital', label: 'Hospitals in Palghar' },
    { type: 'ambulance', label: 'Ambulance 108' },
    { type: 'police', label: 'Police 100' },
    { type: 'fire', label: 'Fire & Rescue 101' },
    { type: 'pharmacy', label: '24x7 Pharmacies' },
  ]

  return (
    <div>
      {/* Top Location Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          background: 'var(--panel-bg, #fff)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} color="#c1121f" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Region:</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {location.label || 'Palghar, Maharashtra'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Switch City:</span>
          {PALGHAR_DISTRICT_CITIES.slice(0, 6).map((c) => {
            const isSelected = location.city && location.city.toLowerCase() === c.city.toLowerCase()
            return (
              <button
                key={c.name}
                type="button"
                className={`chip${isSelected ? ' active' : ''}`}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                onClick={() => selectCity(c)}
              >
                {c.name.split(' ')[0]}
              </button>
            )
          })}
          <Link to="/map" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', marginLeft: 4 }}>
            More &rarr;
          </Link>
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Emergency Assistance — Maharashtra & Palghar District</h1>
        <p>Immediate connection to hospitals, ambulances, and emergency responders in Palghar.</p>
      </div>

      <div className="sos-hero" style={{ marginBottom: '1rem' }}>
        <div>
          <h2>EMERGENCY SOS — GET IMMEDIATE HELP</h2>
          <p>One intentional confirmation shares your location with your personal emergency contacts and alerts nearby Palghar services.</p>
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
              placeholder='e.g. "Accident near Manor Highway. Find nearest trauma hospital."'
              aria-label="Describe your emergency"
            />
            <button className="btn btn-primary" type="submit">
              Analyze
            </button>
          </form>
          <div className="chip-row" style={{ marginTop: '0.75rem' }}>
            {['Nearest hospital in Palghar', 'Ambulance in Boisar', 'Police station near me', 'Dahanu cottage hospital'].map((chip) => (
              <button key={chip} type="button" className="chip" onClick={() => navigate('/assistant', { state: { preset: chip } })}>
                {chip}
              </button>
            ))}
          </div>
          <p className="disclaimer">AILEA is an assistance tool — call 108 / 112 directly for life-threatening emergencies.</p>
        </section>

        <section className="panel">
          <h2>Emergency Services in Palghar</h2>
          <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {categories.map((c) => (
              <Link key={c.type} className="btn btn-secondary" to={`/nearby?type=${c.type}`}>
                {c.label}
              </Link>
            ))}
            <Link className="btn btn-secondary" to="/map">
              <MapPinned size={16} /> Open Palghar Map
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
          <h2 style={{ margin: 0 }}>Hospitals & Emergency Facilities Near {location.city || 'Palghar'}</h2>
          <Link to="/nearby">View all facilities</Link>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
        {loading ? (
          <p className="service-meta" style={{ marginTop: '0.75rem' }}>Loading nearby facilities…</p>
        ) : (
          <div className="service-list" style={{ marginTop: '0.75rem' }}>
            {services.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
            {!services.length && <p className="service-meta">No services found near this location.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
