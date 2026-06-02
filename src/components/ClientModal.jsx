import { useState } from 'react'
import './ClientModal.css'

const GMB_OPTIONS = [
  { value: 'na',             label: 'N/A'              },
  { value: 'waiting-access', label: 'Waiting for Access' },
  { value: 'needs-page',     label: 'Needs Page'       },
  { value: 'verifying',      label: 'Verifying'        },
  { value: 'verified',       label: 'Verified'         },
  { value: 'access-given',   label: 'Access Given'     },
]

const DOMAIN_OPTIONS = [
  { value: 'na',             label: 'N/A'              },
  { value: 'waiting-access', label: 'Waiting for Access' },
  { value: 'access-given',   label: 'Access Given'     },
  { value: 'need-to-buy',    label: 'Need to Buy'      },
]

const IMAGES_OPTIONS = [
  { value: 'awaiting-client', label: 'Awaiting Client' },
  { value: 'received',        label: 'Received'        },
]

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

          <Field label="Notes / Next step">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="First line = summary shown on card. Add more lines for extra notes."
              rows={4}
            />
          </Field>

          <div className="form-divider" />

          <div className="form-row">
            <Field label="GMB Status">
              <OtherableSelect
                value={form.gmbStatus}
                onChange={(v) => set('gmbStatus', v)}
                options={GMB_OPTIONS}
              />
            </Field>
            <Field label="Domain Status">
              <OtherableSelect
                value={form.domainStatus}
                onChange={(v) => set('domainStatus', v)}
                options={DOMAIN_OPTIONS}
              />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Images Status">
              <OtherableSelect
                value={form.imagesStatus}
                onChange={(v) => set('imagesStatus', v)}
                options={IMAGES_OPTIONS}
              />
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

function OtherableSelect({ value, onChange, options }) {
  const isKnown = options.some((o) => o.value === value)
  const [customMode, setCustomMode] = useState(!isKnown)

  function handleSelectChange(e) {
    if (e.target.value === '__other__') {
      setCustomMode(true)
      onChange('')
    } else {
      setCustomMode(false)
      onChange(e.target.value)
    }
  }

  return (
    <>
      <select value={customMode ? '__other__' : value} onChange={handleSelectChange}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value="__other__">Other...</option>
      </select>
      {customMode && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type custom value..."
          autoFocus
        />
      )}
    </>
  )
}
