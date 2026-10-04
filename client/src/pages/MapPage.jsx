import { useEffect, useState } from 'react'
import { MapPin, Navigation2, Building2 } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import EmergencyMap from '../components/EmergencyMap'
import ServiceCard from '../components/ServiceCard'
import { PALGHAR_DISTRICT_CITIES, REGIONS_VIEW } from '../utils/cities'

const FILTERS = [
  { id: 'hospital', label: 'Hospitals' },
  { id: 'ambulance', label: 'Ambulances' },
  { id: 'police', label: 'Police' },
  { id: 'fire', label: 'Fire Stations' },
  { id: 'pharmacy', label: '24/7 Pharmacies' },
]

export default function MapPage() {
  const { location, selectCity, refreshLocation, locating } = useLocationCtx()
  const [types, setTypes] = useState(FILTERS.map((f) => f.id))
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [mapZoom, setMapZoom] = useState(13)
  const [activeCityName, setActiveCityName] = useState('Palghar City (HQ)')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data } = await api.get('/services/nearby', {
          params: {
            lat: location.lat,
            lng: location.lng,
            type: types.join(','),
            radiusKm: 60,
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
            <h1>Maharashtra — Palghar District Emergency Map</h1>
            <p>
              Interactive map of hospitals, trauma centers, and emergency services across Palghar district, Maharashtra.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={refreshLocation}
            disabled={locating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Navigation2 size={16} />
            {locating ? 'Locating GPS…' : 'Use Current Device GPS'}
          </button>
        </div>
      </div>

      {/* Palghar District Cities Selector */}
      <section className="panel" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MapPin size={18} color="#c1121f" />
          <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Palghar District Cities & Talukas</h2>
          <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
            Current: {location.label || 'Palghar, Maharashtra'}
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Tap any city to pan the map and find hospitals & emergency response units in that area:
        </p>
        <div className="chip-row" style={{ flexWrap: 'wrap', gap: '0.45rem' }}>
          {PALGHAR_DISTRICT_CITIES.map((c) => {
            const isSelected = activeCityName === c.name || (location.city && location.city.toLowerCase() === c.city.toLowerCase())
            return (
              <button
                key={c.name}
                type="button"
                className={`chip${isSelected ? ' active' : ''}`}
                onClick={() => handleCitySelect(c)}
                title={c.desc}
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
              style={{ borderStyle: 'dashed' }}
              title={r.desc}
            >
              🌐 {r.name}
            </button>
          ))}
        </div>
      </section>

      {/* Service Type Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter facilities:</span>
        <div className="chip-row" style={{ margin: 0 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip${types.includes(f.id) ? ' active' : ''}`}
              onClick={() => toggle(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Interactive Map */}
      <EmergencyMap center={location} services={services} zoom={mapZoom} />

      {/* Listed Hospitals & Emergency Facilities */}
      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} />
            Hospitals & Facilities in Palghar ({services.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sorted by distance from {location.city || 'Palghar'}
          </span>
        </div>
        <div className="service-list">
          {services.map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
          {!services.length && (
            <p className="service-meta">
              No matching services found for this filter. Try selecting "All" or another Palghar city above.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
