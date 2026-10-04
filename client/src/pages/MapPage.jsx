import { useEffect, useState } from 'react'
import { MapPin, Navigation2, Building2, Search, ExternalLink, LocateFixed, Compass, Crosshair } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import EmergencyMap from '../components/EmergencyMap'
import ServiceCard from '../components/ServiceCard'
import { PALGHAR_DISTRICT_CITIES, REGIONS_VIEW } from '../utils/cities'
import { googleMapsTraceUrl, googleMapsHospitalsUrl } from '../utils/helpers'

const FILTERS = [
  { id: 'hospital', label: 'Hospitals' },
  { id: 'ambulance', label: 'Ambulances' },
  { id: 'police', label: 'Police' },
  { id: 'fire', label: 'Fire Stations' },
  { id: 'pharmacy', label: '24/7 Pharmacies' },
]

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '60 km (All District)', value: 60 },
]

export default function MapPage() {
  const {
    location,
    selectCity,
    refreshLocation,
    locating,
    isLiveTracing,
    toggleLiveTracing,
    traceHistory,
    clearTraceHistory,
  } = useLocationCtx()

  const [types, setTypes] = useState(FILTERS.map((f) => f.id))
  const [searchQuery, setSearchQuery] = useState('')
  const [radiusKm, setRadiusKm] = useState(60)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mapZoom, setMapZoom] = useState(13)
  const [activeCityName, setActiveCityName] = useState('Palghar City (HQ)')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await api.get('/services/nearby', {
          params: {
            lat: location.lat,
            lng: location.lng,
            type: types.join(','),
            radiusKm,
            q: searchQuery.trim() || undefined,
          },
        })
        if (active) setServices(data.results)
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Map data unavailable')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [location.lat, location.lng, types, radiusKm, searchQuery])

  function toggle(type) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  function handleCitySelect(cityItem) {
    setActiveCityName(cityItem.name)
    setMapZoom(cityItem.zoom || 14)
    selectCity(cityItem)
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1>Emergency Map & Hospital Finder</h1>
            <p>
              Trace your real-time location via Google Maps and search emergency hospitals, trauma centers, and life-saving units across Palghar district & Maharashtra.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn ${isLiveTracing ? 'btn-danger' : 'btn-secondary'}`}
              type="button"
              onClick={toggleLiveTracing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Continuously trace device movement via GPS"
            >
              <LocateFixed size={16} />
              {isLiveTracing ? 'Stop Live GPS Tracing' : 'Start Live GPS Tracing'}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={refreshLocation}
              disabled={locating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Navigation2 size={16} />
              {locating ? 'Locating GPS…' : 'Locate Device Once'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Location Tracing & Google Maps Actions Card */}
      <section
        className="panel"
        style={{
          marginBottom: '1rem',
          padding: '0.9rem 1.2rem',
          background: isLiveTracing ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'var(--panel-bg, #ffffff)',
          borderColor: isLiveTracing ? '#86efac' : 'var(--border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isLiveTracing ? '#16a34a' : '#2563eb',
                boxShadow: isLiveTracing ? '0 0 0 4px rgba(22, 163, 74, 0.25)' : 'none',
                display: 'inline-block',
              }}
            />
            <div>
              <strong style={{ fontSize: '0.92rem', color: isLiveTracing ? '#14532d' : 'inherit' }}>
                {isLiveTracing ? 'Live GPS Tracing Active' : 'Traced Location'}
              </strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {location.label || 'Palghar, Maharashtra'} ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
                {location.accuracy ? ` · ±${location.accuracy}m accuracy` : ''}
                {traceHistory.length > 1 ? ` · ${traceHistory.length} trace points recorded` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {traceHistory.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearTraceHistory}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                title="Clear recorded GPS trail breadcrumbs"
              >
                Clear Trail
              </button>
            )}
            <a
              className="btn btn-secondary"
              href={googleMapsTraceUrl(location.lat, location.lng)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              <Compass size={13} color="#ea4335" />
              <span>Open Pin in Google Maps</span>
              <ExternalLink size={11} />
            </a>
            <a
              className="btn btn-secondary"
              href={googleMapsHospitalsUrl(location.city, location.lat, location.lng, searchQuery ? `${searchQuery} hospital` : 'emergency hospital')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.78rem',
                padding: '0.4rem 0.75rem',
                background: '#fee2e2',
                borderColor: '#fca5a5',
                color: '#991b1b',
                fontWeight: 600,
              }}
            >
              <Crosshair size={13} color="#dc2626" />
              <span>Search Hospitals in Google Maps</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </section>

      {/* Hospital Search & Filter Controls */}
      <section className="panel" style={{ marginBottom: '1rem', padding: '0.9rem 1.2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search hospitals by name, emergency casualty, ICU, specialty..."
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

        {/* Palghar District Cities Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <MapPin size={16} color="#c1121f" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quick Pan to Taluka / City:</span>
        </div>
        <div className="chip-row" style={{ flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {PALGHAR_DISTRICT_CITIES.map((c) => {
            const isSelected = activeCityName === c.name || (location.city && location.city.toLowerCase() === c.city.toLowerCase())
            return (
              <button
                key={c.name}
                type="button"
                className={`chip${isSelected ? ' active' : ''}`}
                onClick={() => handleCitySelect(c)}
                title={c.desc}
                style={{ fontSize: '0.78rem', padding: '3px 8px' }}
              >
                {c.name}
              </button>
            )
          })}
          {REGIONS_VIEW.map((r) => (
            <button
              key={r.name}
              type="button"
              className={`chip${activeCityName === r.name ? ' active' : ''}`}
              onClick={() => handleCitySelect(r)}
              style={{ borderStyle: 'dashed', fontSize: '0.78rem', padding: '3px 8px' }}
              title={r.desc}
            >
              🌐 {r.name}
            </button>
          ))}
        </div>

        {/* Service Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Facility types:</span>
          <div className="chip-row" style={{ margin: 0 }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip${types.includes(f.id) ? ' active' : ''}`}
                onClick={() => toggle(f.id)}
                style={{ fontSize: '0.78rem', padding: '3px 8px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Interactive Map with Google Maps layers & Live GPS Path */}
      <EmergencyMap
        center={location}
        services={services}
        zoom={mapZoom}
        traceHistory={traceHistory}
      />

      {/* Listed Hospitals & Emergency Facilities */}
      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Building2 size={18} />
            Hospitals & Emergency Facilities ({services.length})
            {loading && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>Updating…</span>}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Radius: {radiusKm}km from {location.city || 'Palghar'}
            </span>
            <a
              href={googleMapsHospitalsUrl(location.city, location.lat, location.lng, searchQuery ? `${searchQuery} hospital` : 'emergency hospitals')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.8rem',
                color: '#dc2626',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              Search on G-Maps <ExternalLink size={11} />
            </a>
          </div>
        </div>

        <div className="service-list">
          {services.map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
          {!services.length && !loading && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No matching hospitals or facilities found within {radiusKm}km.</p>
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setSearchQuery(''); setRadiusKm(60); }}>
                  Reset Filters
                </button>
                <a
                  className="btn btn-primary"
                  href={googleMapsHospitalsUrl(location.city, location.lat, location.lng, 'emergency hospitals')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Search size={14} /> Search Nearby Hospitals on Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
