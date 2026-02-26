'use client'
// app/login/LoginForm.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'שגיאה בכניסה')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '14px',
    fontFamily: 'Heebo, sans-serif',
    color: '#1e293b',
    background: '#f8fafc',
    outline: 'none',
    direction: 'ltr',
  }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
          שם משתמש
        </label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="username"
          style={inputStyle}
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
          סיסמה
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ ...inputStyle, paddingLeft: '40px' }}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #f0c0c8', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#c0506a' }}>
          ❌ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#a0a0b0' : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '13px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '4px',
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '⏳ נכנס...' : '🔐 כניסה למערכת'}
      </button>

      {/* Demo credentials hint */}
      <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
        דמו: admin / admin123 • ceo_techcorp / ceo123 • worker1 / wrk123
      </div>
    </form>
  )
}
