import { useState, useEffect } from 'react'

const STORAGE_KEY = 'force_systems_clients'

function migrate(c) {
  const out = { ...c }
  if (out.status !== undefined && out.stage === undefined) {
    const map = { active: 'active', pending: 'onboarding', closed: 'paused' }
    out.stage = map[out.status] ?? 'active'
    delete out.status
  }
  if (out.photosReceived !== undefined && out.imagesStatus === undefined) {
    out.imagesStatus = out.photosReceived ? 'received' : 'awaiting-client'
    delete out.photosReceived
  }
  if (out.qrMarketingGiven !== undefined && out.marketingFormSent === undefined) {
    out.marketingFormSent = Boolean(out.qrMarketingGiven)
    delete out.qrMarketingGiven
  }
  if (out.stage === undefined) out.stage = 'active'
  if (out.onboardingFormDone === undefined) out.onboardingFormDone = false
  if (out.imagesStatus === undefined) out.imagesStatus = 'awaiting-client'
  if (out.gmbStatus === undefined) out.gmbStatus = 'na'
  if (out.domainStatus === undefined) out.domainStatus = 'na'
  if (out.marketingFormSent === undefined) out.marketingFormSent = false
  if (out.paymentDue === undefined) out.paymentDue = ''
  if (out.currency === undefined) out.currency = 'USD'
  if (out.nextCheckIn === undefined) out.nextCheckIn = null
  if (out.notes === undefined) out.notes = ''
  // Merge action into notes (one-time migration — action is cleared to '' afterwards)
  if (out.action) {
    out.notes = [out.action, out.notes].filter(Boolean).join('\n')
    out.action = ''
  }
  if (out.action === undefined) out.action = ''
  return out
}

export function useClients() {
  const [clients, setClients] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
      return stored.map(migrate)
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  }, [clients])

  const addClient = (data) =>
    setClients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      },
    ])

  const updateClient = (id, data) =>
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      )
    )

  const deleteClient = (id) =>
    setClients((prev) => prev.filter((c) => c.id !== id))

  const importClients = (incoming) =>
    setClients(incoming.map(migrate))

  return { clients, addClient, updateClient, deleteClient, importClients }
}
