import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function fillDemo() {
    setForm({
      name: 'Dr. Priya Sharma',
      email: 'priya.demo@ailea.app',
      phone: '+91-98230-99887',
      password: 'demo1234',
    })
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1 className="brand">Join AILEA</h1>
        <p className="tagline">Create your account for faster emergency assistance.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={6} required />
        </div>

        <div style={{ display: 'grid', gap: '0.65rem', marginTop: '1.25rem' }}>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Creating…' : 'Create account'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={fillDemo}
            style={{ fontSize: '0.85rem' }}
          >
            <ShieldCheck size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Fill Demo Details (Dr. Priya Sharma)
          </button>
        </div>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}

