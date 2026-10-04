import { useEffect, useState } from 'react'
import { useParams, useLocation as useRouterLocation } from 'react-router-dom'
import { Navigation, Phone, Share2 } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import { SERVICE_META, formatDistance, mapsDirectionsUrl, telHref } from '../utils/helpers'
import EmergencyMap from '../components/EmergencyMap'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const routerLocation = useRouterLocation()
  const { location } = useLocationCtx()
  const [service, setService] = useState(routerLocation.state?.service || null)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data } = await api.get(`/services/${id}`, {
          params: { lat: location.lat, lng: location.lng },
        })
        if (active) setService(data.service)
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Service not found')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id, location.lat, location.lng])

  if (error) return <div className="alert alert-error">{error}</div>
  if (!service) return <p className="service-meta">Loading service…</p>

  const [lng, lat] = service.location.coordinates
  const meta = SERVICE_META[service.type]

  async function requestHelp() {
    setRequesting(true)
    setMessage('')
    try {
      await api.post('/emergency/request', {
        emergencyType:
          service.type === 'police' ? 'security' : service.type === 'fire' ? 'fire' : service.type === 'pharmacy' ? 'medical' : 'medical',
        description: `Help requested from ${service.name}`,
        lat: location.lat,
        lng: location.lng,
        label: location.label,
        serviceId: service._id,
      })
      setMessage('Emergency request created. Track it from History or SOS if activated.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to create request')
    } finally {
      setRequesting(false)
    }
  }

  async function share() {
    const text = `${service.name} — ${service.address} — ${service.phone}`
    if (navigator.share) {
      await navigator.share({ title: service.name, text })
    } else {
      await navigator.clipboard.writeText(text)
      setMessage('Service details copied to clipboard.')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>{service.name}</h1>
        <p>
          {meta?.label} · {formatDistance(service.distanceKm)} · ~{service.etaMinutes} min
        </p>
      </div>

      <div className="grid-2">
        <section className="panel">
          <p>
            <strong>Address:</strong> {service.address}
          </p>
          <p>
            <strong>Phone:</strong> {service.phone}
          </p>
          <p>
            <strong>Status:</strong> {service.availability}
          </p>
          <p>
            <strong>Rating:</strong> {service.rating ?? '—'}
          </p>
          {service.emergencyDept != null && (
            <p>
              <strong>Emergency department:</strong> {service.emergencyDept ? 'Yes' : 'No'}
            </p>
          )}
          {service.facilities?.length > 0 && (
            <p>
              <strong>Facilities:</strong> {service.facilities.join(', ')}
            </p>
          )}
          {service.description && <p>{service.description}</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', marginTop: '1rem' }}>
            {service.phone && (
              <a className="btn btn-primary" href={telHref(service.phone)}>
                <Phone size={16} /> Call {service.phone}
              </a>
            )}
            <a
              className="btn btn-secondary"
              href={googleMapsPlaceUrl(service.name, service.address, lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Navigation size={16} color="#ea4335" /> Check on Google Maps
            </a>
            <a
              className="btn btn-secondary"
              href={mapsDirectionsUrl(lat, lng, service.name, location.lat, location.lng)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Navigation size={16} /> Google Maps Directions
            </a>
            <button className="btn btn-secondary" type="button" onClick={share}>
              <Share2 size={16} /> Share
            </button>
            <button className="btn btn-primary" type="button" disabled={requesting} onClick={requestHelp}>
              {requesting ? 'Requesting…' : 'Request help'}
            </button>
          </div>
          {message && <div className="alert alert-info" style={{ marginTop: '0.85rem' }}>{message}</div>}
        </section>

        <EmergencyMap
          center={location}
          services={[service]}
          selectedId={service._id}
        />
      </div>
    </div>
  )
}
