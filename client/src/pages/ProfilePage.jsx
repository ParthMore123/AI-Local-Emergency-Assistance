import { useState, useEffect } from 'react'
import { User, Phone, Plus, Trash2, HeartHandshake, ShieldAlert, PhoneCall } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { telHref } from '../utils/helpers'

const initialContactForm = {
  name: '',
  phone: '',
  relationship: 'Family',
  priority: 1,
  notifyOnSos: true,
}

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

  // Emergency contacts state
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [contactForm, setContactForm] = useState(initialContactForm)
  const [contactMsg, setContactMsg] = useState('')
  const [contactError, setContactError] = useState('')
  const [addingContact, setAddingContact] = useState(false)

  async function loadContacts() {
    setContactsLoading(true)
    try {
      const { data } = await api.get('/contacts')
      setContacts(data.contacts || [])
    } catch {
      /* non-blocking */
    } finally {
      setContactsLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  async function onSaveProfile(e) {
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
      setMessage('Profile settings saved successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function onAddContact(e) {
    e.preventDefault()
    setAddingContact(true)
    setContactError('')
    setContactMsg('')
    try {
      await api.post('/contacts', contactForm)
      setContactMsg(`Added ${contactForm.name} to your emergency contacts.`)
      setContactForm(initialContactForm)
      await loadContacts()
    } catch (err) {
      setContactError(err.response?.data?.message || 'Unable to add contact')
    } finally {
      setAddingContact(false)
    }
  }

  async function removeContact(id, name) {
    try {
      await api.delete(`/contacts/${id}`)
      setContactMsg(`Removed ${name || 'contact'}.`)
      await loadContacts()
    } catch (err) {
      setContactError(err.response?.data?.message || 'Unable to remove contact')
    }
  }

  async function toggleSosNotify(c) {
    try {
      await api.put(`/contacts/${c._id}`, { notifyOnSos: !c.notifyOnSos })
      await loadContacts()
    } catch (err) {
      setContactError(err.response?.data?.message || 'Unable to update contact')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1>Personal Profile & Emergency Contacts</h1>
        <p>Manage your account details and configure trusted emergency contacts for SOS alerts.</p>
      </div>

      <div className="grid-2">
        {/* Left Column: Profile & Settings */}
        <section className="panel">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <User size={18} />
            Profile Details
          </h2>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-info">{message}</div>}

          <form onSubmit={onSaveProfile}>
            <div className="field">
              <label htmlFor="pname">Full Name</label>
              <input
                id="pname"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="pemail">Email Address</label>
              <input id="pemail" value={user?.email || ''} disabled style={{ opacity: 0.75 }} />
            </div>

            <div className="field">
              <label htmlFor="pphone">Personal Mobile / Phone</label>
              <input
                id="pphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91-98765-43210"
              />
            </div>

            <div className="field">
              <label htmlFor="plang">Preferred Language</label>
              <select
                id="plang"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="mr">Marathi (मराठी - महाराष्ट्र)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
              </select>
            </div>

            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.65rem' }}>
              <input
                type="checkbox"
                checked={form.notifications}
                onChange={(e) => setForm({ ...form, notifications: e.target.checked })}
              />
              Enable emergency notifications & alert updates
            </label>

            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                checked={form.shareLocationOnSos}
                onChange={(e) => setForm({ ...form, shareLocationOnSos: e.target.checked })}
              />
              Share live GPS location with emergency contacts on SOS
            </label>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={logout}>
                Sign out
              </button>
            </div>
          </form>

          <p className="disclaimer" style={{ marginTop: '1.25rem' }}>
            Location is accessed only when needed and with your consent. Emergency sharing clearly logs who received your alerts.
          </p>
        </section>

        {/* Right Column: Emergency Contacts for Personal Profile */}
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={18} />
              Emergency Contacts ({contacts.length})
            </h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Add family, friends, or doctors to your profile. They will be immediately alerted with your location when SOS is activated.
          </p>

          {contactError && <div className="alert alert-error">{contactError}</div>}
          {contactMsg && <div className="alert alert-info">{contactMsg}</div>}

          {/* Add Contact Form */}
          <form
            onSubmit={onAddContact}
            style={{
              background: 'rgba(0,0,0,0.03)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              marginBottom: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Add New Emergency Contact
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="ec-name" style={{ fontSize: '0.8rem' }}>Name</label>
                <input
                  id="ec-name"
                  placeholder="e.g. Ramesh Patil"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="ec-phone" style={{ fontSize: '0.8rem' }}>Phone Number</label>
                <input
                  id="ec-phone"
                  placeholder="+91-98230-00000"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.65rem' }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="ec-rel" style={{ fontSize: '0.8rem' }}>Relationship</label>
                <select
                  id="ec-rel"
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                >
                  <option value="Family">Family / Relative</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Friend">Friend</option>
                  <option value="Doctor">Doctor / Physician</option>
                  <option value="Neighbor">Neighbor (Palghar)</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="ec-pri" style={{ fontSize: '0.8rem' }}>Priority (1 = Highest)</label>
                <select
                  id="ec-pri"
                  value={contactForm.priority}
                  onChange={(e) => setContactForm({ ...contactForm, priority: Number(e.target.value) })}
                >
                  <option value={1}>1 - Primary Emergency</option>
                  <option value={2}>2 - Secondary Contact</option>
                  <option value={3}>3 - Tertiary Contact</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={contactForm.notifyOnSos}
                onChange={(e) => setContactForm({ ...contactForm, notifyOnSos: e.target.checked })}
              />
              Notify this contact on SOS and share emergency location
            </label>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={addingContact}
              style={{ marginTop: '0.85rem' }}
            >
              {addingContact ? 'Adding Contact…' : 'Add to My Profile Contacts'}
            </button>
          </form>

          {/* List of Contacts */}
          <div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Saved Emergency Contacts</h3>
            {contactsLoading ? (
              <p className="service-meta">Loading contacts…</p>
            ) : contacts.length === 0 ? (
              <p className="service-meta">No emergency contacts added yet. Use the form above to add your first contact.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {contacts.map((c) => (
                  <div
                    key={c._id}
                    className="service-card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong>{c.name}</strong>
                        <span className="badge" style={{ fontSize: '0.75rem' }}>
                          {c.relationship} · Priority {c.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {c.phone}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: c.notifyOnSos ? '#16a34a' : '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.notifyOnSos ? (
                          <>
                            <ShieldAlert size={12} color="#16a34a" /> Receives instant SOS alerts
                          </>
                        ) : (
                          'Excluded from SOS alerts'
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <a
                        className="btn btn-secondary"
                        href={telHref(c.phone)}
                        title={`Call ${c.name}`}
                        style={{ padding: '6px 10px' }}
                      >
                        <PhoneCall size={14} />
                      </a>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => toggleSosNotify(c)}
                        title={c.notifyOnSos ? 'Disable SOS alerts for this contact' : 'Enable SOS alerts for this contact'}
                        style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      >
                        {c.notifyOnSos ? 'Disable SOS' : 'Enable SOS'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => removeContact(c._id, c.name)}
                        title={`Remove ${c.name}`}
                        style={{ padding: '6px 8px', color: '#dc2626' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
