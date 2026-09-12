import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    language: user?.preferences?.language || 'en',
    notifications: user?.preferences?.notifications !== false,
    shareLocationOnSos: user?.preferences?.shareLocationOnSos !== false,
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        preferences: {
          language: form.language,
          notifications: form.notifications,
          shareLocationOnSos: form.shareLocationOnSos,
        },
      })
      await refreshUser()
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Profile & settings</h1>
        <p>Manage personal details, privacy, and notification preferences.</p>
      </div>

      <section className="panel" style={{ maxWidth: 560 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={onSave}>
          <div className="field">
            <label htmlFor="pname">Name</label>
            <input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="pemail">Email</label>
            <input id="pemail" value={user?.email || ''} disabled />
          </div>
          <div className="field">
            <label htmlFor="pphone">Phone</label>
            <input id="pphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="plang">Language</label>
            <select id="plang" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
            </select>
          </div>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.65rem' }}>
            <input
              type="checkbox"
              checked={form.notifications}
              onChange={(e) => setForm({ ...form, notifications: e.target.checked })}
            />
            Enable notifications
          </label>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={form.shareLocationOnSos}
              onChange={(e) => setForm({ ...form, shareLocationOnSos: e.target.checked })}
            />
            Share location with SOS contacts when SOS is activated
          </label>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </form>
        <p className="disclaimer">
          Location is only accessed when needed and with your permission. Emergency sharing shows who receives it and when it started.
        </p>
      </section>
    </div>
  )
}
