import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation } from 'react-router-dom'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'

export default function AssistantPage() {
  const routerLocation = useRouterLocation()
  const { location } = useLocationCtx()
  const [message, setMessage] = useState(routerLocation.state?.preset || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (routerLocation.state?.preset) {
      setMessage(routerLocation.state.preset)
      analyze(routerLocation.state.preset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function analyze(text = message) {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/ai/analyze-emergency', {
        message: text,
        lat: location.lat,
        lng: location.lng,
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'AI analysis failed')
    } finally {
      setLoading(false)
    }
  }

  async function naturalSearch(text = message) {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/ai/search', {
        query: text,
        lat: location.lat,
        lng: location.lng,
      })
      setResult({
        analysis: data.analysis,
        nearbyServices: data.results,
        intent: data.intent,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'AI search failed')
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.analysis

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>AI Emergency Assistant</h1>
        <p>Describe what is happening in plain language. AILEA classifies the emergency and recommends nearby help.</p>
      </div>

      <section className="panel">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            analyze()
          }}
        >
          <div className="field">
            <label htmlFor="emergency-message">What is the emergency?</label>
            <textarea
              id="emergency-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Example: "My friend has fainted. Find the nearest hospital."'
            />
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze emergency'}
            </button>
            <button className="btn btn-secondary" type="button" disabled={loading} onClick={() => naturalSearch()}>
              Natural search
            </button>
          </div>
        </form>
        <p className="disclaimer">
          AILEA is an assistance tool and not a replacement for professional emergency services. If you are in immediate danger, call your local emergency number now.
        </p>
      </section>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {analysis && (
        <div className="grid-2" style={{ marginTop: '1rem' }}>
          <section className="panel">
            <h2>AI assessment</h2>
            <p>
              <strong>Emergency type:</strong> {analysis.emergencyType}
            </p>
            <p>
              <strong>Priority:</strong> {analysis.priority}
            </p>
            <p>
              <strong>Confidence:</strong> {Math.round((analysis.confidence || 0) * 100)}%
            </p>
            <p>
              <strong>Recommended services:</strong> {(analysis.recommendedServices || []).join(', ')}
            </p>
            <p>{analysis.summary}</p>
            <div className="alert alert-info">{analysis.suggestedAction}</div>
            <p className="service-meta">Engine: {analysis.engine || 'local'}</p>
          </section>
          <section className="panel">
            <h2>Recommended nearby</h2>
            <div className="service-list">
              {(result.nearbyServices || []).map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
              {!result.nearbyServices?.length && <p className="service-meta">No nearby matches for this classification.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
