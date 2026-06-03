import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

// ── Field-name mapping ────────────────────────────────────────────────────────
// Postgres columns are snake_case; the rest of the app uses camelCase.
// toRow() and fromRow() are the only two places that know about this mapping.

function fromRow(row) {
  return {
    id:                 row.id,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    name:               row.name,
    company:            row.company,
    email:              row.email,
    phone:              row.phone,
    stage:              row.stage,
    onboardingFormDone: row.onboarding_form_done,
    imagesStatus:       row.images_status,
    gmbStatus:          row.gmb_status,
    domainStatus:       row.domain_status,
    marketingFormSent:  row.marketing_form_sent,
    paymentDue:         row.payment_due,
    currency:           row.currency,
    nextCheckIn:        row.next_check_in ?? null,
    notes:              row.notes,
  }
}

// Maps only the keys that are present in obj — safe for both full inserts
// and partial updates (e.g. { nextCheckIn: date } from Quick Move).
const JS_TO_PG = {
  id:                 'id',
  createdAt:          'created_at',
  updatedAt:          'updated_at',
  name:               'name',
  company:            'company',
  email:              'email',
  phone:              'phone',
  stage:              'stage',
  onboardingFormDone: 'onboarding_form_done',
  imagesStatus:       'images_status',
  gmbStatus:          'gmb_status',
  domainStatus:       'domain_status',
  marketingFormSent:  'marketing_form_sent',
  paymentDue:         'payment_due',
  currency:           'currency',
  nextCheckIn:        'next_check_in',
  notes:              'notes',
}

function toRow(obj) {
  const row = {}
  for (const [jsKey, pgKey] of Object.entries(JS_TO_PG)) {
    if (jsKey in obj) row[pgKey] = obj[jsKey] ?? null
  }
  return row
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULTS = {
  company:            '',
  email:              '',
  phone:              '',
  stage:              'active',
  onboardingFormDone: false,
  imagesStatus:       'awaiting-client',
  gmbStatus:          'na',
  domainStatus:       'na',
  marketingFormSent:  false,
  paymentDue:         '',
  currency:           'USD',
  nextCheckIn:        null,
  notes:              '',
}

// ── Normalise (used only by importClients) ────────────────────────────────────
// Handles old localStorage exports that may carry renamed/removed fields.

function normalise(c) {
  const out = { ...c }

  // Old field-name migrations from the localStorage era
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
  if (out.action) {
    out.notes = [out.action, out.notes ?? ''].filter(Boolean).join('\n')
    delete out.action
  }

  // Fill missing fields with defaults
  if (!out.id)                         out.id                 = crypto.randomUUID()
  if (!out.createdAt)                  out.createdAt          = new Date().toISOString()
  if (!out.updatedAt)                  out.updatedAt          = new Date().toISOString()
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (out[k] == null) out[k] = v
  }
  return out
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Suppresses realtime events during bulk import (delete-all + insert-all
  // reuses the same UUIDs, so a late DELETE event would corrupt the new state).
  const suppressRealtimeRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    // Initial fetch
    supabase
      .from('clients')
      .select('*')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('useClients fetch:', error.message)
          setError(error.message)
        } else {
          setClients((data ?? []).map(fromRow))
        }
        setLoading(false)
      })

    // Real-time subscription — picks up changes made by other sessions
    const channel = supabase
      .channel('clients-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          if (suppressRealtimeRef.current) return

          if (payload.eventType === 'INSERT') {
            // Guard against our own insert arriving here before addClient's
            // setClients call, which would cause a duplicate entry.
            setClients((prev) => {
              if (prev.some((c) => c.id === payload.new.id)) return prev
              return [...prev, fromRow(payload.new)]
            })
          } else if (payload.eventType === 'UPDATE') {
            setClients((prev) =>
              prev.map((c) => c.id === payload.new.id ? fromRow(payload.new) : c)
            )
          } else if (payload.eventType === 'DELETE') {
            // payload.old only carries the primary key with default replica identity
            setClients((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  const addClient = useCallback(async (data) => {
    const now = new Date().toISOString()
    const client = {
      id:        crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...DEFAULTS,
      ...data,
    }
    const { data: row, error } = await supabase
      .from('clients')
      .insert(toRow(client))
      .select()
      .single()
    if (error) {
      console.error('useClients addClient:', error.message)
      setError(error.message)
      return
    }
    // Guard against the realtime INSERT arriving before this call
    setClients((prev) => {
      if (prev.some((c) => c.id === row.id)) return prev
      return [...prev, fromRow(row)]
    })
  }, [])

  const updateClient = useCallback(async (id, data) => {
    // toRow handles partial objects — only present keys are sent to Postgres
    const updates = toRow({ ...data, updatedAt: new Date().toISOString() })
    const { data: row, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('useClients updateClient:', error.message)
      setError(error.message)
      return
    }
    setClients((prev) => prev.map((c) => c.id === id ? fromRow(row) : c))
  }, [])

  const deleteClient = useCallback(async (id) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('useClients deleteClient:', error.message)
      setError(error.message)
      return
    }
    setClients((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // Replaces all rows — used by the Import JSON button.
  // Suppresses realtime events for the duration: the bulk delete+insert reuses
  // the same UUIDs, so a stale DELETE event arriving after the new rows are set
  // would incorrectly remove a client from state.
  const importClients = useCallback(async (incoming) => {
    suppressRealtimeRef.current = true
    const rows = incoming.map(normalise).map(toRow)

    const { error: delErr } = await supabase
      .from('clients')
      .delete()
      .not('id', 'is', null)
    if (delErr) {
      console.error('useClients importClients (delete):', delErr.message)
      setError(delErr.message)
      suppressRealtimeRef.current = false
      return
    }

    const { data, error: insErr } = await supabase
      .from('clients')
      .insert(rows)
      .select()
    if (insErr) {
      console.error('useClients importClients (insert):', insErr.message)
      setError(insErr.message)
      suppressRealtimeRef.current = false
      return
    }

    setClients((data ?? []).map(fromRow))
    suppressRealtimeRef.current = false
  }, [])

  return { clients, loading, error, addClient, updateClient, deleteClient, importClients }
}
