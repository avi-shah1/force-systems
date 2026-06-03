import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import './LoginPage.css'

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-name">Avi Shah</span>
          <span className="login-brand-divider">·</span>
          <span className="login-brand-sub">Force Systems</span>
        </div>

        {sent ? (
          <div className="login-sent">
            <p className="login-sent-heading">Check your email</p>
            <p className="login-sent-body">
              We sent a magic link to <strong>{email}</strong>.
              Click it to sign in — you can close this tab.
            </p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
