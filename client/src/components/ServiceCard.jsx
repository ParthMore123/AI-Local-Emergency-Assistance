import { Link } from 'react-router-dom'
import { Ambulance, Building2, Cross, Flame, Phone, Pill, Shield, MapPin, Navigation } from 'lucide-react'
import { SERVICE_META, formatDistance, googleMapsPlaceUrl, mapsDirectionsUrl, telHref } from '../utils/helpers'
import { useLocationCtx } from '../context/LocationContext'

const ICONS = {
  hospital: Building2,
  ambulance: Ambulance,
  police: Shield,
  fire: Flame,
  pharmacy: Pill,
}

export default function ServiceCard({ service }) {
  const locCtx = useLocationCtx()
  const userLoc = locCtx?.location
  const meta = SERVICE_META[service.type] || { label: service.type, tone: 'hospital' }
  const Icon = ICONS[service.type] || Cross
  const [lng, lat] = service.location?.coordinates || []
  const gmapsUrl = googleMapsPlaceUrl(service.name, service.address, lat, lng)
  const directionsUrl = mapsDirectionsUrl(lat, lng, service.name, userLoc?.lat, userLoc?.lng)

  return (
    <Link to={`/services/${service._id}`} className="service-card" state={{ service }}>
      <div className={`service-icon ${meta.tone}`} aria-hidden>
        <Icon size={20} />
      </div>
      <div>
        <strong>{service.name}</strong>
        <div className="service-meta">
          {meta.label}
          {service.distanceKm != null && ` · ${formatDistance(service.distanceKm)}`}
          {service.etaMinutes != null && ` · ~${service.etaMinutes} min`}
          {service.emergencyDept && ' · 24/7 Casualty'}
        </div>
        <div className="service-meta">{service.address}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
        <span className={`badge ${service.availability === 'open' ? 'open' : service.availability === 'closed' ? 'closed' : ''}`}>
          {service.availability || 'unknown'}
        </span>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a
            className="btn btn-secondary"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Get driving directions to ${service.name} in Google Maps`}
            style={{ padding: '0.35rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}
          >
            <Navigation size={12} color="#ea4335" />
            <span>Directions</span>
          </a>
          <a
            className="btn btn-secondary"
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Check ${service.name} on Google Maps`}
            style={{ padding: '0.35rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
          >
            <MapPin size={12} color="#ea4335" />
            <span>Maps</span>
          </a>
          {service.phone && (
            <a
              className="btn btn-secondary"
              href={telHref(service.phone)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Call ${service.name}`}
              style={{ padding: '0.35rem 0.55rem' }}
            >
              <Phone size={12} />
            </a>
          )}
        </div>
      </div>
      {lat != null && lng != null && <span className="sr-only">Located at {lat}, {lng}</span>}
    </Link>
  )
}
