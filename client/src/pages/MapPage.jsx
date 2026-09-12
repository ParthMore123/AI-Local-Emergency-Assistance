import { useEffect, useState } from 'react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import EmergencyMap from '../components/EmergencyMap'
import ServiceCard from '../components/ServiceCard'

const FILTERS = ['hospital', 'ambulance', 'police', 'fire', 'pharmacy']

export default function MapPage() {
  const { location } = useLocationCtx()
  const [types, setTypes] = useState([...FILTERS])
  const [services, setServices] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data } = await api.get('/services/nearby', {
          params: {
            lat: location.lat,
            lng: location.lng,
            type: types.join(','),
            radiusKm: 30,
          },
        })
        if (active) setServices(data.results)
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Map data unavailable')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [location.lat, location.lng, types])

  function toggle(type) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Map & navigation</h1>
        <p>Your location and nearby emergency facilities.</p>
      </div>
      <div className="chip-row" style={{ marginBottom: '0.85rem' }}>
        {FILTERS.map((type) => (
          <button key={type} type="button" className={`chip${types.includes(type) ? ' active' : ''}`} onClick={() => toggle(type)}>
            {type}
          </button>
        ))}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <EmergencyMap center={location} services={services} />
      <section className="panel" style={{ marginTop: '1rem' }}>
        <h2>Listed facilities</h2>
        <div className="service-list">
          {services.slice(0, 8).map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
        </div>
      </section>
    </div>
  )
}
