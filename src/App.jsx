import { useState, useRef } from 'react'
import { useClients } from './hooks/useClients.js'
import ClientList from './components/ClientList.jsx'
import ClientModal from './components/ClientModal.jsx'
import StatCard from './components/StatCard.jsx'
import './App.css'

const TODAY = new Date().toISOString().slice(0, 10)
const REVIEW_KEY = 'force_systems_last_review'

function daysSinceReview() {
  const stored = localStorage.getItem(REVIEW_KEY)
  if (!stored) return Infinity
  return Math.floor((Date.now() - new Date(stored).getTime()) / 86400000)
}

function matchesStage(client, filter) {
  if (filter === 'all') return true
  if (filter === 'onboarding') return client.stage === 'onboarding' || client.stage === 'awaiting-form'
  return client.stage === filter
}

export default function App() {
  const { clients, addClient, updateClient, deleteClient, importClients } = useClients()
  const [modal, setModal]               = useState(null)
  const [search, setSearch]             = useState('')
  const [stageFilter, setStageFilter]   = useState('all')
  const [dueNowFilter, setDueNowFilter] = useState(false)
  const [gmbFilter, setGmbFilter]       = useState(false)
  const [domainFilter, setDomainFilter] = useState(false)
  const [marketingFilter, setMarketingFilter] = useState(false)
  const [imagesFilter, setImagesFilter] = useState('all')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [reviewAge] = useState(daysSinceReview)
  const fileInputRef = useRef(null)

  const showBanner = !bannerDismissed && reviewAge >= 10

  function handleStatCard(card) {
    if (card === 'total') {
      setStageFilter('all')
      setDueNowFilter(false)
    } else if (card === 'due') {
      setDueNowFilter((v) => !v)
    } else {
      if (!dueNowFilter && stageFilter === card) {
        setStageFilter('all')
      } else {
        setStageFilter(card)
        setDueNowFilter(false)
      }
    }
  }

  function handleDropdownChange(val) {
    setStageFilter(val)
    setDueNowFilter(false)
  }

  function handleBannerFilter(type) {
    if (type === 'gmb')       setGmbFilter(true)
    if (type === 'domain')    setDomainFilter(true)
    if (type === 'marketing') setMarketingFilter(true)
  }

  function handleDoneReviewing() {
    localStorage.setItem(REVIEW_KEY, new Date().toISOString())
    setBannerDismissed(true)
  }

  const filtered = clients
    .filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        const hit =
          c.name.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').includes(search)
        if (!hit) return false
      }
      if (dueNowFilter) {
        if (!c.nextCheckIn || c.nextCheckIn > TODAY) return false
      } else {
        if (!matchesStage(c, stageFilter)) return false
      }
      if (gmbFilter       && c.gmbStatus    === 'access-given') return false
      if (domainFilter    && c.domainStatus === 'access-given') return false
      if (marketingFilter && c.marketingFormSent)               return false
      if (imagesFilter !== 'all' && c.imagesStatus !== imagesFilter) return false
      return true
    })
    .sort((a, b) => {
      if (!a.nextCheckIn && !b.nextCheckIn) return 0
      if (!a.nextCheckIn) return 1
      if (!b.nextCheckIn) return -1
      return a.nextCheckIn.localeCompare(b.nextCheckIn)
    })

  const stats = {
    total:      clients.length,
    active:     clients.filter((c) => c.stage === 'active').length,
    onboarding: clients.filter((c) => c.stage === 'onboarding' || c.stage === 'awaiting-form').length,
    warm:       clients.filter((c) => c.stage === 'warm').length,
    paused:     clients.filter((c) => c.stage === 'paused').length,
    due:        clients.filter((c) => c.nextCheckIn && c.nextCheckIn <= TODAY).length,
  }

  const reviewCounts = {
    gmb:       clients.filter((c) => c.gmbStatus    !== 'access-given' && c.gmbStatus    !== 'na').length,
    domain:    clients.filter((c) => c.domainStatus !== 'access-given' && c.domainStatus !== 'na').length,
    marketing: clients.filter((c) => !c.marketingFormSent).length,
  }

  const activeCard = dueNowFilter ? 'due'
    : stageFilter === 'all' ? 'total'
    : stageFilter

  const groupMode = !dueNowFilter && stageFilter === 'all'

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

  const dropdownValue = dueNowFilter ? 'all' : stageFilter

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
        {showBanner && (
          <div className="review-banner">
            <div className="review-banner-body">
              <p className="review-banner-heading">Time for a review</p>
              <div className="review-banner-counts">
                <button className="review-count-btn" onClick={() => handleBannerFilter('gmb')}>
                  <strong>{reviewCounts.gmb}</strong> missing GMB access
                </button>
                <button className="review-count-btn" onClick={() => handleBannerFilter('domain')}>
                  <strong>{reviewCounts.domain}</strong> missing domain access
                </button>
                <button className="review-count-btn" onClick={() => handleBannerFilter('marketing')}>
                  <strong>{reviewCounts.marketing}</strong> missing marketing form
                </button>
              </div>
            </div>
            <button className="btn-secondary review-done-btn" onClick={handleDoneReviewing}>
              Done reviewing
            </button>
          </div>
        )}

        <div className="stats-row">
          <StatCard
            label="Total" value={stats.total}
            selected={activeCard === 'total'}
            onClick={() => handleStatCard('total')}
          />
          <StatCard
            label="Active" value={stats.active} accent="green"
            selected={activeCard === 'active'}
            onClick={() => handleStatCard('active')}
          />
          <StatCard
            label="Onboarding" value={stats.onboarding} accent="blue"
            selected={activeCard === 'onboarding'}
            onClick={() => handleStatCard('onboarding')}
          />
          <StatCard
            label="Warm" value={stats.warm} accent="orange"
            selected={activeCard === 'warm'}
            onClick={() => handleStatCard('warm')}
          />
          <StatCard
            label="Paused" value={stats.paused} accent="gray"
            selected={activeCard === 'paused'}
            onClick={() => handleStatCard('paused')}
          />
          <StatCard
            label="Due Now" value={stats.due} accent="red"
            selected={activeCard === 'due'}
            onClick={() => handleStatCard('due')}
          />
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
            value={dropdownValue}
            onChange={(e) => handleDropdownChange(e.target.value)}
          >
            <option value="all">All stages</option>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="warm">Warm</option>
            <option value="paused">Paused</option>
          </select>
          <button
            className={`filter-toggle${gmbFilter ? ' filter-toggle--active' : ''}`}
            onClick={() => setGmbFilter((v) => !v)}
          >
            GMB outstanding
          </button>
          <button
            className={`filter-toggle${domainFilter ? ' filter-toggle--active' : ''}`}
            onClick={() => setDomainFilter((v) => !v)}
          >
            Domain outstanding
          </button>
          <button
            className={`filter-toggle${marketingFilter ? ' filter-toggle--active' : ''}`}
            onClick={() => setMarketingFilter((v) => !v)}
          >
            Marketing outstanding
          </button>
          <select
            className="filter-select"
            value={imagesFilter}
            onChange={(e) => setImagesFilter(e.target.value)}
          >
            <option value="all">All images</option>
            <option value="awaiting-client">Awaiting client</option>
            <option value="received">Received</option>
            <option value="stock">Stock</option>
            <option value="from-gmb">From GMB</option>
            <option value="from-website">From website</option>
          </select>
        </div>

        <ClientList
          clients={filtered}
          onEdit={(client) => setModal({ mode: 'edit', client })}
          onDelete={deleteClient}
          onUpdate={updateClient}
          groupMode={groupMode}
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
