import { useState } from 'react'
import { useClients } from './hooks/useClients.js'
import ClientList from './components/ClientList.jsx'
import ClientModal from './components/ClientModal.jsx'
import StatCard from './components/StatCard.jsx'
import './App.css'

export default function App() {
  const { clients, addClient, updateClient, deleteClient } = useClients()
  const [modal, setModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', client }
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    pending: clients.filter((c) => c.status === 'pending').length,
    closed: clients.filter((c) => c.status === 'closed').length,
  }

  function handleSave(data) {
    if (modal.mode === 'add') addClient(data)
    else updateClient(modal.client.id, data)
    setModal(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-name">Avi Shah</span>
            <span className="brand-divider">·</span>
            <span className="brand-sub">Force Systems</span>
          </div>
          <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
            + Add Client
          </button>
        </div>
      </header>

      <main className="main">
        <div className="stats-row">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} accent="green" />
          <StatCard label="Pending" value={stats.pending} accent="yellow" />
          <StatCard label="Closed" value={stats.closed} accent="gray" />
        </div>

        <div className="controls">
          <input
            className="search-input"
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <ClientList
          clients={filtered}
          onEdit={(client) => setModal({ mode: 'edit', client })}
          onDelete={deleteClient}
        />
      </main>

      {modal && (
        <ClientModal
          mode={modal.mode}
          initial={modal.client}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
