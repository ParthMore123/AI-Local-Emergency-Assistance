import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { Phone, Navigation } from 'lucide-react'
import { SERVICE_META, formatDistance, mapsDirectionsUrl, telHref } from '../utils/helpers'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapRecenter({ center, zoom = 13 }) {
  const map = useMap()
  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], zoom, { animate: true })
    }
  }, [center?.lat, center?.lng, zoom, map])
  return null
}

export default function EmergencyMap({ center, services = [], selectedId, zoom = 13 }) {
  if (!center?.lat || !center?.lng) {
    return <div className="panel">Waiting for location in Maharashtra…</div>
  }

  return (
    <div className="map-wrap" role="region" aria-label="Maharashtra & Palghar emergency services map">
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
        <MapRecenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={11}
          pathOptions={{ color: '#c1121f', fillColor: '#c1121f', fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <div style={{ fontWeight: 600 }}>Your Active Location</div>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>{center.label || 'Palghar, Maharashtra'}</div>
          </Popup>
        </CircleMarker>
        {services.map((service) => {
          const [lng, lat] = service.location.coordinates
          const meta = SERVICE_META[service.type]
          return (
            <Marker
              key={service._id}
              position={[lat, lng]}
              icon={markerIcon}
              opacity={selectedId && selectedId !== service._id ? 0.55 : 1}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: service.type === 'hospital' ? '#fee2e2' : '#e0f2fe',
                      color: service.type === 'hospital' ? '#b91c1c' : '#0369a1',
                      marginBottom: 4,
                    }}
                  >
                    {meta?.label || service.type}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1rem', marginBottom: 2 }}>{service.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#444', marginBottom: 4 }}>{service.address}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', marginBottom: 6 }}>
                    {formatDistance(service.distanceKm)} away
                    {service.emergencyDept && ' · 24/7 ER'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {service.phone && (
                      <a
                        href={telHref(service.phone)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.8rem',
                          background: '#2563eb',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: 4,
                          textDecoration: 'none',
                        }}
                      >
                        <Phone size={12} /> Call {service.phone}
                      </a>
                    )}
                    <a
                      href={mapsDirectionsUrl(lat, lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.8rem',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        padding: '4px 8px',
                        borderRadius: 4,
                        textDecoration: 'none',
                      }}
                    >
                      <Navigation size={12} /> Directions
                    </a>
                  </div>
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                    <Link to={`/services/${service._id}`} style={{ fontSize: '0.8rem', color: '#2563eb' }}>
                      View facility details &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
