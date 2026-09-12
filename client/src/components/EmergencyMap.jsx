import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { SERVICE_META, formatDistance } from '../utils/helpers'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function EmergencyMap({ center, services = [], selectedId }) {
  if (!center?.lat || !center?.lng) {
    return <div className="panel">Waiting for location…</div>
  }

  return (
    <div className="map-wrap" role="region" aria-label="Emergency services map">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={10}
          pathOptions={{ color: '#c1121f', fillColor: '#c1121f', fillOpacity: 0.85 }}
        >
          <Popup>Your location</Popup>
        </CircleMarker>
        {services.map((service) => {
          const [lng, lat] = service.location.coordinates
          const meta = SERVICE_META[service.type]
          return (
            <Marker key={service._id} position={[lat, lng]} icon={markerIcon} opacity={selectedId && selectedId !== service._id ? 0.55 : 1}>
              <Popup>
                <strong>{service.name}</strong>
                <div>{meta?.label}</div>
                <div>{formatDistance(service.distanceKm)} away</div>
                <Link to={`/services/${service._id}`}>View details</Link>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
