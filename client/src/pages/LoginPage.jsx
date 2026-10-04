import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@ailea.app')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function fillDemo() {
    setEmail('demo@ailea.app')
    setPassword('demo1234')
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err) {
      if (err.response?.data?.errors?.length) {
        setError(err.response.data.errors.map((e) => e.msg).join('; '))
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Cannot connect to backend server. Please verify backend is running on port 5000.')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 className="brand">AILEA</h1>
          <p className="tagline">AI Local Emergency Assistance — Maharashtra & Palghar District</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div style={{ display: 'grid', gap: '0.65rem', marginTop: '1.25rem' }}>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            <LogIn size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={fillDemo}
            style={{ fontSize: '0.85rem' }}
          >
            <ShieldCheck size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Fill Demo Credentials (demo@ailea.app)
          </button>
        </div>

        <p style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>

        <p className="disclaimer">
          AILEA connects you to verified emergency services in Maharashtra & Palghar. Call 108 / 112 directly for critical emergencies.
        </p>
      </form>
    </div>
  )
}
