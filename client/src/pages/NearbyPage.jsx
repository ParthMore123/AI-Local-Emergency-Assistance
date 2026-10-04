import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation } from 'react-router-dom'
import { MapPin, ExternalLink, Search, Crosshair, Compass, LocateFixed, Building2 } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'
import { PALGHAR_DISTRICT_CITIES } from '../utils/cities'
import { googleMapsHospitalsUrl, googleMapsTraceUrl } from '../utils/helpers'

const FILTERS = [
  { value: '', label: 'All Services' },
  { value: 'hospital', label: 'Hospitals' },
  { value: 'ambulance', label: 'Ambulance Units' },
  { value: 'police', label: 'Police Stations' },
  { value: 'fire', label: 'Fire & Rescue' },
  { value: 'pharmacy', label: '24x7 Pharmacies' },
]

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '60 km', value: 60 },
]

export default function NearbyPage() {
  const routerLocation = useRouterLocation()
  const params = new URLSearchParams(routerLocation.search)
  const {
    location,
    selectCity,
    isLiveTracing,
    toggleLiveTracing,
    refreshLocation,
    locating,
  } = useLocationCtx()

  const [type, setType] = useState(params.get('type') || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [radiusKm, setRadiusKm] = useState(60)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/services/nearby', {
          params: {
            lat: location.lat,
            lng: location.lng,
            type: type || undefined,
            radiusKm,
            q: searchQuery.trim() || undefined,
          },
        })
        if (active) setResults(data.results)
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load services')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [location.lat, location.lng, type, radiusKm, searchQuery])

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1>Nearby Emergency Hospitals & Services</h1>
            <p>Locate, trace, and navigate to verified hospitals, trauma centers, and medical facilities via Google Maps.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn ${isLiveTracing ? 'btn-danger' : 'btn-secondary'}`}
              type="button"
              onClick={toggleLiveTracing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <LocateFixed size={16} />
              {isLiveTracing ? 'Stop Live GPS Tracing' : 'Start Live GPS Tracing'}
            </button>
            <a
              className="btn btn-secondary"
              href={googleMapsHospitalsUrl(location.city || 'Palghar', location.lat, location.lng, searchQuery ? `${searchQuery} hospital` : 'emergency hospitals')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fee2e2',
                borderColor: '#fca5a5',
                color: '#991b1b',
                fontWeight: 600,
              }}
            >
              <Crosshair size={16} color="#dc2626" />
              <span>Search Hospitals in Google Maps</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Traced Location Banner */}
      <section
        className="panel"
        style={{
          marginBottom: '1rem',
          padding: '0.85rem 1.25rem',
          background: isLiveTracing ? '#f0fdf4' : 'var(--panel-bg, #fff)',
          borderColor: isLiveTracing ? '#86efac' : 'var(--border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isLiveTracing ? '#16a34a' : '#2563eb',
                boxShadow: isLiveTracing ? '0 0 0 3px rgba(22, 163, 74, 0.25)' : 'none',
              }}
            />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Location: </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {location.label || 'Palghar, Maharashtra'} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={refreshLocation}
              disabled={locating}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            >
              {locating ? 'Locating…' : 'Update GPS'}
            </button>
            <a
              className="btn btn-secondary"
              href={googleMapsTraceUrl(location.lat, location.lng)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            >
              <Compass size={13} color="#ea4335" />
              <span>Trace in Google Maps</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </section>

      {/* Hospital Search, Radius, & Category Filters */}
      <section className="panel" style={{ marginBottom: '1rem', padding: '0.9rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search hospitals by name, ICU, casualty, trauma, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: '0.88rem',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Radius:</span>
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`chip${radiusKm === opt.value ? ' active' : ''}`}
                onClick={() => setRadiusKm(opt.value)}
                style={{ fontSize: '0.78rem', padding: '3px 9px' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* City quick switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <MapPin size={16} color="#c1121f" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Palghar Taluka / City Filter:</span>
        </div>
        <div className="chip-row" style={{ flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {PALGHAR_DISTRICT_CITIES.map((c) => {
            const isSelected = location.city && location.city.toLowerCase() === c.city.toLowerCase()
            return (
              <button
                key={c.name}
                type="button"
                className={`chip${isSelected ? ' active' : ''}`}
                onClick={() => selectCity(c)}
                style={{ fontSize: '0.78rem', padding: '3px 8px' }}
              >
                {c.name}
              </button>
            )
          })}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Facility type:</span>
          <div className="chip-row" style={{ margin: 0, flexWrap: 'wrap', gap: '0.35rem' }}>
            {FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                type="button"
                className={`chip${type === f.value ? ' active' : ''}`}
                onClick={() => setType(f.value)}
                style={{ fontSize: '0.78rem', padding: '3px 8px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} />
            Available Emergency Facilities ({results.length})
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Within {radiusKm}km of {location.city || 'Palghar'}
          </span>
        </div>

        {loading ? (
          <p className="service-meta">Searching emergency facilities in Palghar district…</p>
        ) : (
          <div className="service-list">
            {results.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
            {!results.length && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No matching facilities found within {radiusKm}km.</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setSearchQuery(''); setRadiusKm(60); setType(''); }}>
                    Reset Filters
                  </button>
                  <a
                    className="btn btn-primary"
                    href={googleMapsHospitalsUrl(location.city, location.lat, location.lng, 'emergency hospitals')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Search size={14} /> Search on Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
