import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'
import { PALGHAR_DISTRICT_CITIES } from '../utils/cities'

const FILTERS = [
  { value: '', label: 'All Services' },
  { value: 'hospital', label: 'Hospitals in Palghar' },
  { value: 'ambulance', label: 'Ambulance Units' },
  { value: 'police', label: 'Police Stations' },
  { value: 'fire', label: 'Fire & Rescue' },
  { value: 'pharmacy', label: '24x7 Pharmacies' },
]

export default function NearbyPage() {
  const routerLocation = useRouterLocation()
  const params = new URLSearchParams(routerLocation.search)
  const { location, selectCity } = useLocationCtx()
  const [type, setType] = useState(params.get('type') || '')
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
            radiusKm: 60,
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
  }, [location.lat, location.lng, type])

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Emergency Services in Palghar District, Maharashtra</h1>
        <p>Verified hospitals, trauma centers, ambulances, police, and pharmacies across Palghar district.</p>
      </div>

      {/* City quick switch */}
      <section className="panel" style={{ marginBottom: '1rem', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MapPin size={16} color="#c1121f" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Select Palghar City / Taluka:</span>
          <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
            Current: {location.label || 'Palghar, Maharashtra'}
          </span>
        </div>
        <div className="chip-row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
          {PALGHAR_DISTRICT_CITIES.map((c) => {
            const isSelected = location.city && location.city.toLowerCase() === c.city.toLowerCase()
            return (
              <button
                key={c.name}
                type="button"
                className={`chip${isSelected ? ' active' : ''}`}
                onClick={() => selectCity(c)}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Category filters */}
      <div className="chip-row" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            className={`chip${type === f.value ? ' active' : ''}`}
            onClick={() => setType(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
            Available Services ({results.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing services around {location.city || 'Palghar'}
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
              <p className="service-meta">
                No matching services in this category. Try selecting another service type or city.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
