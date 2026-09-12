import { useEffect, useState } from 'react'
import { Phone, Trash2 } from 'lucide-react'
import api from '../api/client'
import { telHref } from '../utils/helpers'

const emptyForm = {
  name: '',
  phone: '',
  relationship: 'Family',
  priority: 1,
  notifyOnSos: true,
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/contacts')
      setContacts(data.contacts)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/contacts', form)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add contact')
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/contacts/${id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete contact')
    }
  }

  async function toggleNotify(contact) {
    try {
      await api.put(`/contacts/${contact._id}`, { notifyOnSos: !contact.notifyOnSos })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update contact')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Emergency contacts</h1>
        <p>Choose who can receive your location and SOS alerts. Sharing is explicit and opt-in.</p>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2>Add trusted contact</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="cname">Name</label>
              <input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="cphone">Phone</label>
              <input id="cphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="crel">Relationship</label>
              <select id="crel" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                <option>Family</option>
                <option>Friend</option>
                <option>Colleague</option>
                <option>Neighbor</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="cpri">Priority (1 = highest)</label>
              <input
                id="cpri"
                type="number"
                min={1}
                max={5}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </div>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.85rem' }}>
              <input type="checkbox" checked={form.notifyOnSos} onChange={(e) => setForm({ ...form, notifyOnSos: e.target.checked })} />
              Notify on SOS / share emergency location
            </label>
            <button className="btn btn-primary" type="submit">
              Save contact
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Your contacts</h2>
          {loading ? (
            <p className="service-meta">Loading…</p>
          ) : (
            <div className="service-list">
              {contacts.map((c) => (
                <div key={c._id} className="service-card">
                  <div>
                    <strong>{c.name}</strong>
                    <div className="service-meta">
                      {c.relationship} · Priority {c.priority}
                    </div>
                    <div className="service-meta">{c.phone}</div>
                    <div className="service-meta">{c.notifyOnSos ? 'Receives SOS alerts' : 'Not notified on SOS'}</div>
                  </div>
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    <a className="btn btn-secondary" href={telHref(c.phone)} aria-label={`Call ${c.name}`}>
                      <Phone size={14} /> Call
                    </a>
                    <button className="btn btn-secondary" type="button" onClick={() => toggleNotify(c)}>
                      {c.notifyOnSos ? 'Disable SOS' : 'Enable SOS'}
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => remove(c._id)} aria-label={`Delete ${c.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {!contacts.length && <p className="service-meta">No contacts yet.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
