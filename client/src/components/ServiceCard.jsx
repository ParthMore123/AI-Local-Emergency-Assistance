import { Link } from 'react-router-dom'
import { Ambulance, Building2, Cross, Flame, Phone, Pill, Shield } from 'lucide-react'
import { SERVICE_META, formatDistance, telHref } from '../utils/helpers'

const ICONS = {
  hospital: Building2,
  ambulance: Ambulance,
  police: Shield,
  fire: Flame,
  pharmacy: Pill,
}

export default function ServiceCard({ service }) {
  const meta = SERVICE_META[service.type] || { label: service.type, tone: 'hospital' }
  const Icon = ICONS[service.type] || Cross
  const [lng, lat] = service.location?.coordinates || []

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
        </div>
        <div className="service-meta">{service.address}</div>
      </div>
      <div style={{ display: 'grid', gap: '0.35rem', justifyItems: 'end' }}>
        <span className={`badge ${service.availability === 'open' ? 'open' : service.availability === 'closed' ? 'closed' : ''}`}>
          {service.availability || 'unknown'}
        </span>
        <a
          className="btn btn-secondary"
          href={telHref(service.phone)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Call ${service.name}`}
          style={{ padding: '0.4rem 0.6rem' }}
        >
          <Phone size={14} />
        </a>
      </div>
      {lat != null && lng != null && <span className="sr-only">Located at {lat}, {lng}</span>}
    </Link>
  )
}
