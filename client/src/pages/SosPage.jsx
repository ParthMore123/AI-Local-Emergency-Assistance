import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Siren } from 'lucide-react'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import StatusTracker from '../components/StatusTracker'
import ServiceCard from '../components/ServiceCard'

const DEMO_SOS_PRESETS = [
  'SOS activated',
  'Critical Medical Emergency: Severe Chest Pain',
  'Road Traffic Accident: Passenger Injured',
  'Fire Emergency: Chemical / Industrial Smoke',
  'Immediate Security Threat / Distress',
]

export default function SosPage() {
  const routeLocation = useLocation()
  const { location } = useLocationCtx()
  const [confirming, setConfirming] = useState(false)
  const [sosNote, setSosNote] = useState('SOS activated')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [request, setRequest] = useState(null)

  useEffect(() => {
    const id = routeLocation.state?.requestId || request?._id
    if (!id) return undefined
    let active = true
    async function poll() {
      try {
        const { data } = await api.get(`/emergency/status/${id}`)
        if (active) setRequest(data.request)
      } catch {
        /* ignore transient poll errors */
      }
    }
    poll()
    const timer = setInterval(poll, 8000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [routeLocation.state?.requestId, request?._id])

  async function activateSos() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/emergency/sos', {
        lat: location.lat,
        lng: location.lng,
        label: location.label,
        description: sosNote || 'SOS activated',
        confirm: true,
      })
      setPayload(data)
      setRequest(data.request)
      setConfirming(false)
    } catch (err) {
      setError(err.response?.data?.message || 'SOS activation failed')
    } finally {
      setLoading(false)
    }
  }

  async function cancelSos() {
    if (!request?._id) return
    setLoading(true)
    try {
      const { data } = await api.put(`/emergency/cancel/${request._id}`)
      setRequest(data.request)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Emergency SOS</h1>
        <p>Intentional activation reduces accidental alerts while keeping help one confirmation away.</p>
      </div>

      {!request && (
        <section className="sos-hero">
          <div>
            <h2>Get emergency help now</h2>
            <p>
              Current location: {location.label} ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
            </p>
          </div>
          {!confirming ? (
            <button className="btn sos-cta" type="button" onClick={() => setConfirming(true)}>
              <Siren size={20} /> Tap to prepare SOS
            </button>
          ) : (
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <div className="alert alert-warn" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
                Confirm SOS? This will notify selected emergency contacts and surface nearby services.
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.6rem 0.8rem', borderRadius: 6 }}>
                <span style={{ fontSize: '0.78rem', color: '#fff', opacity: 0.9, fontWeight: 600 }}>
                  Demo Emergency Type:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {DEMO_SOS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="chip"
                      style={{
                        fontSize: '0.75rem',
                        background: sosNote === preset ? '#fff' : 'rgba(255,255,255,0.2)',
                        color: sosNote === preset ? '#c1121f' : '#fff',
                        borderColor: '#fff',
                      }}
                      onClick={() => setSosNote(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn sos-cta" type="button" disabled={loading} onClick={activateSos}>
                {loading ? 'Activating…' : `Confirm & Activate SOS (${sosNote})`}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          )}
        </section>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {request && (
        <div className="grid-2" style={{ marginTop: '1rem' }}>
          <section className="panel">
            <h2>SOS status</h2>
            <p className="service-meta">Request ID: {request._id}</p>
            <StatusTracker status={request.status} />
            <div style={{ marginTop: '1rem' }}>
              <strong>Location shared</strong>
              <div className="service-meta">
                {request.location?.label} · {request.location?.lat?.toFixed(5)}, {request.location?.lng?.toFixed(5)}
              </div>
              <div className="service-meta">Sharing started: {new Date(request.createdAt).toLocaleString()}</div>
              <div className="service-meta">
                Active: {!['completed', 'cancelled'].includes(request.status) ? 'Yes' : 'No'}
              </div>
            </div>
            {request.selectedService && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Service contacted</strong>
                <div>{request.selectedService.name} ({request.selectedService.type})</div>
                <div className="service-meta">{request.selectedService.phone}</div>
              </div>
            )}
            {!['completed', 'cancelled'].includes(request.status) && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} type="button" disabled={loading} onClick={cancelSos}>
                Cancel SOS
              </button>
            )}
          </section>

          <section className="panel">
            <h2>Contacts notified</h2>
            {(request.contactsNotified || []).length === 0 && (
              <p className="service-meta">No SOS contacts configured. Add contacts with “Notify on SOS” enabled.</p>
            )}
            {(request.contactsNotified || []).map((c) => (
              <div key={c.contactId || c.phone} className="service-card" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <strong>{c.name}</strong>
                  <div className="service-meta">{c.phone}</div>
                </div>
              </div>
            ))}
            {payload?.fallbackNumbers && (
              <div className="alert alert-info" style={{ marginTop: '0.75rem' }}>
                Fallback numbers — Medical: {payload.fallbackNumbers.medical}, Police: {payload.fallbackNumbers.police}, Fire:{' '}
                {payload.fallbackNumbers.fire}
              </div>
            )}
          </section>
        </div>
      )}

      {payload?.nearbyServices?.length > 0 && (
        <section className="panel" style={{ marginTop: '1rem' }}>
          <h2>Nearby recommended services</h2>
          <div className="service-list">
            {payload.nearbyServices.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
