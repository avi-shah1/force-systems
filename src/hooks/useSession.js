import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// Returns:
//   undefined  — still checking (avoids a flash of the login screen)
//   null       — confirmed signed-out
//   Session    — signed-in session object

export function useSession() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Resolve the initial session from storage immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
    })

    // Keep state in sync for sign-in (magic link) and sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  return session
}
