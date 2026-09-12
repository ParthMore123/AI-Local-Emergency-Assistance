import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation } from 'react-router-dom'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'police', label: 'Police' },
  { value: 'fire', label: 'Fire' },
  { value: 'pharmacy', label: 'Pharmacy' },
]

export default function NearbyPage() {
  const routerLocation = useRouterLocation()
  const params = new URLSearchParams(routerLocation.search)
  const { location } = useLocationCtx()
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
            radiusKm: 30,
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
        <h1>Nearby services</h1>
        <p>Hospitals, ambulances, police, fire stations, and pharmacies near you.</p>
      </div>
      <div className="chip-row" style={{ marginBottom: '1rem' }}>
        {FILTERS.map((f) => (
          <button key={f.value || 'all'} type="button" className={`chip${type === f.value ? ' active' : ''}`} onClick={() => setType(f.value)}>
            {f.label}
          </button>
        ))}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <section className="panel">
        {loading ? (
          <p className="service-meta">Searching nearby…</p>
        ) : (
          <div className="service-list">
            {results.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
            {!results.length && <p className="service-meta">No matching services in range.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
