import { useState, useRef } from 'react'
import { useClients } from './hooks/useClients.js'
import ClientList from './components/ClientList.jsx'
import ClientModal from './components/ClientModal.jsx'
import StatCard from './components/StatCard.jsx'
import './App.css'

const TODAY = new Date().toISOString().slice(0, 10)

export default function App() {
  const { clients, addClient, updateClient, deleteClient, importClients } = useClients()
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const fileInputRef = useRef(null)

  const filtered = clients
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone ?? '').includes(search)
      const matchesStage = stageFilter === 'all' || c.stage === stageFilter
      return matchesSearch && matchesStage
    })
    .sort((a, b) => {
      if (!a.nextCheckIn && !b.nextCheckIn) return 0
      if (!a.nextCheckIn) return 1
      if (!b.nextCheckIn) return -1
      return a.nextCheckIn.localeCompare(b.nextCheckIn)
    })

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.stage === 'active').length,
    onboarding: clients.filter((c) => c.stage === 'onboarding' || c.stage === 'awaiting-form').length,
    due: clients.filter((c) => c.nextCheckIn && c.nextCheckIn <= TODAY).length,
  }

  function handleSave(data) {
    if (modal.mode === 'add') addClient(data)
    else updateClient(modal.client.id, data)
    setModal(null)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data)) throw new Error('Expected array')
        const msg = clients.length > 0
          ? `Replace all ${clients.length} existing clients with ${data.length} from file?`
          : null
        if (msg && !confirm(msg)) return
        importClients(data)
      } catch {
        alert('Could not parse JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Import JSON
            </button>
            <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
              + Add Client
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="stats-row">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} accent="green" />
          <StatCard label="Onboarding" value={stats.onboarding} accent="blue" />
          <StatCard label="Due Now" value={stats.due} accent="red" />
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
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">All stages</option>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="awaiting-form">Awaiting Form</option>
            <option value="warm">Warm</option>
            <option value="paused">Paused</option>
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
