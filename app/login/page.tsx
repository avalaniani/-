// app/login/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LoginForm from './LoginForm'

export default function LoginPage() {
  // Already logged in? → go to dashboard
  const session = getSession()
  if (session) redirect('/dashboard')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>WorkFlow Pro</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>מערכת ניהול עובדים ופועלים</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
