'use client'
// app/dashboard/DashboardShell.tsx
//
// This component bridges the existing HTML/JS app with the Next.js/Supabase backend.
// It renders an iframe-free version: the existing JS logic is preserved but all
// DATA reads/writes are replaced with fetch() calls to /api/* endpoints.
//
// Strategy: inject the full HTML app as a blob URL so we can pass the initialData
// to it via postMessage, and receive mutation events back.

import { useEffect, useRef } from 'react'
import type { SessionPayload } from '@/types'

interface Props {
  session: SessionPayload
  initialData: {
    companies: unknown[]
    users: unknown[]
    tasks: unknown[]
    requests: unknown[]
  }
}

export default function DashboardShell({ session, initialData }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    // Send initial data + session to the iframe app once it's ready
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'APP_READY') {
        iframe.contentWindow?.postMessage({
          type: 'INIT_DATA',
          session,
          data: initialData,
        }, '*')
      }

      // Handle API mutations from the iframe app
      if (event.data?.type === 'API_REQUEST') {
        const { requestId, method, endpoint, body } = event.data
        try {
          const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
          })
          const data = await res.json()
          iframe.contentWindow?.postMessage({
            type: 'API_RESPONSE',
            requestId,
            ok: res.ok,
            status: res.status,
            data,
          }, '*')
        } catch (err) {
          iframe.contentWindow?.postMessage({
            type: 'API_RESPONSE',
            requestId,
            ok: false,
            status: 500,
            data: { error: 'Network error' },
          }, '*')
        }
      }

      // Logout request from app
      if (event.data?.type === 'LOGOUT') {
        await fetch('/api/auth', { method: 'DELETE' })
        window.location.href = '/login'
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [session, initialData])

  return (
    <iframe
      ref={iframeRef}
      src="/app.html"
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="WorkFlow Pro App"
    />
  )
}
