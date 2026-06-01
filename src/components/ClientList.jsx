import './ClientList.css'

const STATUS_COLORS = {
  active: { dot: '#4ade80', bg: '#0f2a1a', text: '#4ade80' },
  pending: { dot: '#facc15', bg: '#2a2100', text: '#facc15' },
  closed: { dot: '#666', bg: '#1a1a1a', text: '#888' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
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
  const status = client.status ?? 'pending'
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending
  const initials = client.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="client-card">
      <div className="client-avatar">{initials}</div>

      <div className="client-info">
        <div className="client-name-row">
          <span className="client-name">{client.name}</span>
          <span
            className="client-status"
            style={{ background: colors.bg, color: colors.text }}
          >
            <span className="status-dot" style={{ background: colors.dot }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="client-details">
          {client.email && (
            <span className="client-detail">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {client.email}
            </span>
          )}
          {client.phone && (
            <span className="client-detail">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.91 13.5 19.79 19.79 0 0 1 1.87 4.82 2 2 0 0 1 3.84 2.64h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6.09 6.09l1.72-1.08a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {client.phone}
            </span>
          )}
          {client.company && (
            <span className="client-detail">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {client.company}
            </span>
          )}
          <span className="client-detail client-detail--muted">
            Added {formatDate(client.createdAt)}
          </span>
        </div>

        {client.notes && (
          <p className="client-notes">{client.notes}</p>
        )}
      </div>

      <div className="client-actions">
        <button className="btn-secondary" onClick={onEdit}>Edit</button>
        <button className="btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}
