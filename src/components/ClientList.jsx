import { useState } from 'react'
import DatePopover from './DatePopover.jsx'
import './ClientList.css'

const STAGE_COLORS = {
  active:          { dot: '#4ade80', bg: '#0f2a1a', text: '#4ade80' },
  paused:          { dot: '#666',    bg: '#1a1a1a', text: '#888'    },
  onboarding:      { dot: '#60a5fa', bg: '#0a1a2e', text: '#60a5fa' },
  'awaiting-form': { dot: '#facc15', bg: '#2a2100', text: '#facc15' },
  warm:            { dot: '#fb923c', bg: '#2a1400', text: '#fb923c' },
}

const STAGE_LABELS = {
  active:          'Active',
  paused:          'Paused',
  onboarding:      'Onboarding',
  'awaiting-form': 'Awaiting Form',
  warm:            'Warm',
}

const GMB_LABELS = {
  'na':             'N/A',
  'waiting-access': 'Waiting',
  'needs-page':     'Needs Page',
  'verifying':      'Verifying',
  'verified':       'Verified',
  'access-given':   'Access Given',
}

const DOMAIN_LABELS = {
  'na':             'N/A',
  'waiting-access': 'Waiting',
  'access-given':   'Access Given',
  'need-to-buy':    'Need to Buy',
}

const IMAGES_LABELS = {
  'awaiting-client': 'Awaiting',
  'received':        'Received',
  'stock':           'Stock',
  'from-gmb':        'From GMB',
  'from-website':    'From Website',
}

const GREEN = '#4ade80'
const RED   = '#f87171'
const GREY  = '#555'
const DONE_IMAGES = new Set(['received', 'stock', 'from-gmb', 'from-website'])
const ONBOARDING_STAGES = new Set(['onboarding', 'awaiting-form'])

function badgeColor(type, value) {
  if (type === 'images') return DONE_IMAGES.has(value) ? GREEN : RED
  if (type === 'gmb')    return value === 'access-given' ? GREEN : value === 'na' ? GREY : RED
  if (type === 'domain') return value === 'access-given' ? GREEN : value === 'na' ? GREY : RED
  return GREEN
}

const SECTIONS = [
  { key: 'active',     label: 'Active',     stages: new Set(['active']) },
  { key: 'onboarding', label: 'Onboarding', stages: new Set(['onboarding', 'awaiting-form']) },
  { key: 'warm',       label: 'Warm',       stages: new Set(['warm']) },
  { key: 'paused',     label: 'Paused',     stages: new Set(['paused']) },
]

const TODAY = new Date().toISOString().slice(0, 10)

function formatPaymentDisplay(paymentDue, currency) {
  const symbol = currency === 'GBP' ? '£' : '$'
  const trimmed = paymentDue.trim()
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `Payment Owed: ${symbol}${trimmed}`
  return `Payment Owed: ${trimmed}`
}

function formatDateOnly(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function ClientList({ clients, onEdit, onDelete, onUpdate, groupMode }) {
  if (clients.length === 0) {
    return (
      <div className="empty-state">
        <p>No clients found.</p>
        <p>Try adjusting your filters or <strong>add a new client</strong>.</p>
      </div>
    )
  }

  if (groupMode) {
    return <GroupedClientList clients={clients} onEdit={onEdit} onDelete={onDelete} onUpdate={onUpdate} />
  }

  return (
    <div className="client-list">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={() => onEdit(client)}
          onDelete={() => onDelete(client.id)}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}

function GroupedClientList({ clients, onEdit, onDelete, onUpdate }) {
  const [collapsed, setCollapsed] = useState({})

  const sections = SECTIONS
    .map(({ key, label, stages }) => ({
      key, label,
      clients: clients.filter((c) => stages.has(c.stage)),
    }))
    .filter((s) => s.clients.length > 0)

  function toggle(key) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="client-list">
      {sections.map(({ key, label, clients: sectionClients }) => (
        <div key={key} className="client-section">
          <button className="section-header" onClick={() => toggle(key)}>
            <span className="section-label">{label}</span>
            <span className="section-count">{sectionClients.length}</span>
            <span className="section-chevron">{collapsed[key] ? '▸' : '▾'}</span>
          </button>
          {!collapsed[key] && (
            <div className="section-cards">
              {sectionClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={() => onEdit(client)}
                  onDelete={() => onDelete(client.id)}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ClientCard({ client, onEdit, onDelete, onUpdate }) {
  const [popover, setPopover] = useState(null) // null | 'quickmove' | 'onboarding'

  const stage  = client.stage ?? 'active'
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.active
  const initials = client.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const checkIn    = client.nextCheckIn
  const isOverdue  = checkIn && checkIn < TODAY
  const isDueToday = checkIn && checkIn === TODAY

  const gmbText    = GMB_LABELS[client.gmbStatus]       ?? client.gmbStatus    ?? 'N/A'
  const domainText = DOMAIN_LABELS[client.domainStatus] ?? client.domainStatus ?? 'N/A'
  const imagesText = IMAGES_LABELS[client.imagesStatus] ?? client.imagesStatus ?? 'Awaiting'

  const isPaused      = stage === 'paused'
  const isOnboarding  = ONBOARDING_STAGES.has(stage)

  function handlePopoverSelect(date) {
    if (popover === 'quickmove') {
      onUpdate(client.id, { nextCheckIn: date })
    } else if (popover === 'onboarding') {
      onUpdate(client.id, { stage: 'active', nextCheckIn: date })
    }
    setPopover(null)
  }

  return (
    <>
      <div className={`client-card${isOverdue ? ' client-card--overdue' : isDueToday ? ' client-card--due-today' : ''}`}>
        <div className="client-avatar">{initials}</div>

        <div className="client-info">
          <div className="client-name-row">
            <span className="client-name">{client.name}</span>
            <span
              className="client-status"
              style={{ background: colors.bg, color: colors.text }}
            >
              <span className="status-dot" style={{ background: colors.dot }} />
              {STAGE_LABELS[stage] ?? stage}
            </span>
          </div>

          {checkIn && (
            <div className={`client-checkin${isOverdue ? ' client-checkin--overdue' : isDueToday ? ' client-checkin--today' : ''}`}>
              {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : 'Next: '}
              {formatDateOnly(checkIn)}
            </div>
          )}

          {client.notes && (
            <div className="client-action">{client.notes}</div>
          )}

          {client.paymentDue && (
            <div className="client-payment">
              {formatPaymentDisplay(client.paymentDue, client.currency)}
            </div>
          )}

          <div className="client-workflow">
            <WorkflowBadge label="Form"                     color={client.onboardingFormDone ? GREEN : RED} />
            <WorkflowBadge label={`Images: ${imagesText}`} color={badgeColor('images', client.imagesStatus)} />
            <WorkflowBadge label={`GMB: ${gmbText}`}       color={badgeColor('gmb',    client.gmbStatus)} />
            <WorkflowBadge label={`Domain: ${domainText}`} color={badgeColor('domain', client.domainStatus)} />
            <WorkflowBadge label="Marketing"                color={client.marketingFormSent ? GREEN : RED} />
          </div>
        </div>

        <div className="client-actions">
          <button className="btn-secondary" onClick={onEdit}>Edit</button>
          <button className="btn-danger"    onClick={onDelete}>Delete</button>
          {!isPaused && (
            <button className="btn-move" onClick={() => setPopover('quickmove')}>
              Quick Move
            </button>
          )}
          {isOnboarding && (
            <button className="btn-onboarding" onClick={() => setPopover('onboarding')}>
              Onboarding Done
            </button>
          )}
        </div>
      </div>

      {popover && (
        <DatePopover
          title={popover === 'onboarding' ? 'Set first check-in' : 'Move check-in to'}
          onSelect={handlePopoverSelect}
          onClose={() => setPopover(null)}
        />
      )}
    </>
  )
}

function WorkflowBadge({ label, color }) {
  return (
    <span className="workflow-badge" style={{ color, borderColor: color + '44' }}>
      {label}
    </span>
  )
}
