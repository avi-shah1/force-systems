import { formatDate } from '../utils/format.js'
import './ClientList.css'

const STAGE_COLORS = {
  active:          { dot: '#4ade80', bg: '#0f2a1a', text: '#4ade80' },
  paused:          { dot: '#666',    bg: '#1a1a1a', text: '#888'    },
  onboarding:      { dot: '#60a5fa', bg: '#0a1a2e', text: '#60a5fa' },
  'awaiting-form': { dot: '#facc15', bg: '#2a2100', text: '#facc15' },
  warm:            { dot: '#fb923c', bg: '#2a1400', text: '#fb923c' },
}

const STAGE_LABELS = {
  active: 'Active',
  paused: 'Paused',
  onboarding: 'Onboarding',
  'awaiting-form': 'Awaiting Form',
  warm: 'Warm',
}

const GMB_LABELS = {
  'na':             { text: 'N/A',          color: '#555'    },
  'waiting-access': { text: 'Waiting',      color: '#facc15' },
  'needs-page':     { text: 'Needs Page',   color: '#f87171' },
  'verifying':      { text: 'Verifying',    color: '#fb923c' },
  'verified':       { text: 'Verified',     color: '#4ade80' },
  'access-given':   { text: 'Access Given', color: '#60a5fa' },
}

const DOMAIN_LABELS = {
  'na':             { text: 'N/A',          color: '#555'    },
  'waiting-access': { text: 'Waiting',      color: '#facc15' },
  'access-given':   { text: 'Access Given', color: '#60a5fa' },
  'need-to-buy':    { text: 'Need to Buy',  color: '#f87171' },
}

const IMAGES_LABELS = {
  'awaiting-client': { text: 'Awaiting', color: '#facc15' },
  'received':        { text: 'Received', color: '#4ade80' },
}

const TODAY = new Date().toISOString().slice(0, 10)

function formatDateOnly(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ClientList({ clients, onEdit, onDelete }) {
  if (clients.length === 0) {
    return (
      <div className="empty-state">
        <p>No clients yet.</p>
        <p>Click <strong>+ Add Client</strong> to get started.</p>
      </div>
    )
  }

  return (
    <div className="client-list">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={() => onEdit(client)}
          onDelete={() => onDelete(client.id)}
        />
      ))}
    </div>
  )
}

function ClientCard({ client, onEdit, onDelete }) {
  const stage = client.stage ?? 'active'
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.active
  const initials = client.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const checkIn = client.nextCheckIn
  const isOverdue = checkIn && checkIn < TODAY
  const isDueToday = checkIn && checkIn === TODAY
  const isDue = isOverdue || isDueToday

  const gmbInfo = GMB_LABELS[client.gmbStatus] ?? { text: client.gmbStatus || 'N/A', color: '#aaa' }
  const domainInfo = DOMAIN_LABELS[client.domainStatus] ?? { text: client.domainStatus || 'N/A', color: '#aaa' }
  const imagesInfo = IMAGES_LABELS[client.imagesStatus] ?? { text: client.imagesStatus || 'Awaiting', color: '#aaa' }

  return (
    <div className={`client-card${isDue ? ' client-card--due' : ''}`}>
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
          <div className={`client-checkin${isDue ? ' client-checkin--due' : ''}`}>
            {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : 'Next: '}
            {formatDateOnly(checkIn)}
          </div>
        )}

        {client.notes && (
          <div className="client-action">{client.notes.split('\n')[0]}</div>
        )}

        {client.paymentDue && (
          <div className="client-payment">{client.paymentDue}</div>
        )}

        <div className="client-workflow">
          <WorkflowBadge label="Form" done={client.onboardingFormDone} />
          <WorkflowBadge label={`Images: ${imagesInfo.text}`} color={imagesInfo.color} />
          <WorkflowBadge label={`GMB: ${gmbInfo.text}`} color={gmbInfo.color} />
          <WorkflowBadge label={`Domain: ${domainInfo.text}`} color={domainInfo.color} />
          <WorkflowBadge label="Marketing" done={client.marketingFormSent} />
        </div>

      </div>

      <div className="client-actions">
        <button className="btn-secondary" onClick={onEdit}>Edit</button>
        <button className="btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}

function WorkflowBadge({ label, done, color }) {
  const c = color ?? (done ? '#4ade80' : '#555')
  return (
    <span className="workflow-badge" style={{ color: c, borderColor: c + '44' }}>
      {label}
    </span>
  )
}
