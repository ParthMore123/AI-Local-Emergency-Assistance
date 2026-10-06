import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation } from 'react-router-dom'
import api from '../api/client'
import { useLocationCtx } from '../context/LocationContext'
import ServiceCard from '../components/ServiceCard'

const DEMO_SCENARIOS = [
  {
    icon: '🚨',
    title: 'Cardiac Distress',
    text: 'Severe chest pain radiating to left arm and difficulty breathing near Palghar Railway Station.',
  },
  {
    icon: '🚗',
    title: 'Highway Crash',
    text: 'Two-wheeler collision on Manor-Palghar Highway with head injury and bleeding, need trauma ambulance.',
  },
  {
    icon: '🔥',
    title: 'Industrial Fire',
    text: 'Heavy smoke and electrical fire spreading at Boisar MIDC warehouse, need fire rescue.',
  },
  {
    icon: '💊',
    title: 'Urgent Pharmacy',
    text: 'Urgent requirement for 24-hour emergency pharmacy for pediatric nebulizer and insulin in Palghar West.',
  },
  {
    icon: '🚔',
    title: 'Security Distress',
    text: 'Car breakdown at midnight on dark road near Kelve with suspicious persons approaching.',
  },
]

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

          <div style={{ margin: '0.75rem 0 1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              ⚡ Try Demo Emergency Scenarios:
            </span>
            <div className="chip-row" style={{ marginTop: '0.4rem' }}>
              {DEMO_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.title}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setMessage(scenario.text)
                    analyze(scenario.text)
                  }}
                  title="Click to fill and run AI analysis"
                >
                  {scenario.icon} {scenario.title}
                </button>
              ))}
            </div>
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
