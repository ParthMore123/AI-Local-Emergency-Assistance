import { useEffect, useState } from 'react'
import api from '../api/client'
import { STATUS_LABELS } from '../utils/helpers'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/emergency/history', {
          params: {
            type: type || undefined,
            from: from || undefined,
            to: to || undefined,
          },
        })
        if (active) setHistory(data.history)
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load history')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [type, from, to])

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Emergency history</h1>
        <p>Past requests with type, location, service, and status.</p>
      </div>

      <section className="panel" style={{ marginBottom: '1rem' }}>
        <div className="grid-3">
          <div className="field">
            <label htmlFor="htype">Emergency type</label>
            <select id="htype" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="fire">Fire</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="hfrom">From</label>
            <input id="hfrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="hto">To</label>
            <input id="hto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        {loading ? (
          <p className="service-meta">Loading history…</p>
        ) : (
          <div className="service-list">
            {history.map((item) => (
              <article key={item._id} className="service-card" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <strong style={{ textTransform: 'capitalize' }}>{item.emergencyType} emergency</strong>
                  <div className="service-meta">{new Date(item.createdAt).toLocaleString()}</div>
                  <div className="service-meta">
                    Status: {STATUS_LABELS[item.status] || item.status}
                    {item.isSos ? ' · SOS' : ''}
                  </div>
                  <div className="service-meta">
                    Location: {item.location?.label || '—'}
                    {item.location?.lat != null && ` (${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)})`}
                  </div>
                  <div className="service-meta">Service: {item.selectedService?.name || '—'}</div>
                </div>
              </article>
            ))}
            {!history.length && <p className="service-meta">No history for these filters.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
