import { useState } from 'react'
import './ClientModal.css'

const EMPTY = {
  name: '',
  company: '',
  email: '',
  phone: '',
  stage: 'active',
  onboardingFormDone: false,
  imagesStatus: 'awaiting-client',
  gmbStatus: 'na',
  domainStatus: 'na',
  marketingFormSent: false,
  paymentDue: '',
  nextCheckIn: '',
  action: '',
  notes: '',
}

export default function ClientModal({ mode, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    nextCheckIn: initial?.nextCheckIn ?? '',
  })
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    onSave({ ...form, name: form.name.trim(), nextCheckIn: form.nextCheckIn || null })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'add' ? 'New Client' : 'Edit Client'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <Field label="Name *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Full name"
              autoFocus
            />
          </Field>

          <div className="form-row">
            <Field label="Company">
              <input
                type="text"
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="Company name"
              />
            </Field>
            <Field label="Stage">
              <select value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="awaiting-form">Awaiting Form</option>
                <option value="warm">Warm</option>
                <option value="paused">Paused</option>
              </select>
            </Field>
          </div>

          <div className="form-row">
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@example.com"
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <Field label="Next Check-in">
              <input
                type="date"
                value={form.nextCheckIn ?? ''}
                onChange={(e) => set('nextCheckIn', e.target.value)}
              />
            </Field>
            <Field label="Payment Due">
              <input
                type="text"
                value={form.paymentDue}
                onChange={(e) => set('paymentDue', e.target.value)}
                placeholder="e.g. Owes $147"
              />
            </Field>
          </div>

          <Field label="Action / Next Step">
            <input
              type="text"
              value={form.action}
              onChange={(e) => set('action', e.target.value)}
              placeholder="e.g. Send payment link"
            />
          </Field>

          <div className="form-divider" />

          <div className="form-row">
            <Field label="GMB Status">
              <select value={form.gmbStatus} onChange={(e) => set('gmbStatus', e.target.value)}>
                <option value="na">N/A</option>
                <option value="waiting-access">Waiting for Access</option>
                <option value="needs-page">Needs Page</option>
                <option value="verifying">Verifying</option>
                <option value="verified">Verified</option>
                <option value="access-given">Access Given</option>
              </select>
            </Field>
            <Field label="Domain Status">
              <select value={form.domainStatus} onChange={(e) => set('domainStatus', e.target.value)}>
                <option value="na">N/A</option>
                <option value="waiting-access">Waiting for Access</option>
                <option value="access-given">Access Given</option>
              </select>
            </Field>
          </div>

          <div className="form-row">
            <Field label="Images Status">
              <select value={form.imagesStatus} onChange={(e) => set('imagesStatus', e.target.value)}>
                <option value="awaiting-client">Awaiting Client</option>
                <option value="received">Received</option>
              </select>
            </Field>
            <Field label="Checklist">
              <div className="form-checks">
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={form.onboardingFormDone}
                    onChange={(e) => set('onboardingFormDone', e.target.checked)}
                  />
                  Onboarding Form Done
                </label>
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={form.marketingFormSent}
                    onChange={(e) => set('marketingFormSent', e.target.checked)}
                  />
                  Marketing Form Sent
                </label>
              </div>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any notes about this client..."
              rows={3}
            />
          </Field>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              {mode === 'add' ? 'Add Client' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}
