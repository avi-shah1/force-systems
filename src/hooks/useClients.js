import { useState, useEffect } from 'react'

const STORAGE_KEY = 'force_systems_clients'

export function useClients() {
  const [clients, setClients] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
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
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data },
    ])

  const updateClient = (id, data) =>
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))

  const deleteClient = (id) =>
    setClients((prev) => prev.filter((c) => c.id !== id))

  return { clients, addClient, updateClient, deleteClient }
}
