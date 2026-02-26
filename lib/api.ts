// lib/api.ts
import { NextResponse } from 'next/server'
import { getSession } from './auth'
import type { SessionPayload } from '@/types'

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Require a valid session — returns session or 401 response
export function requireAuth(): SessionPayload | NextResponse {
  const session = getSession()
  if (!session) return err('Unauthorized', 401)
  return session
}

// Require a specific role (or array of roles)
export function requireRole(
  session: SessionPayload,
  roles: string | string[]
): NextResponse | null {
  const allowed = Array.isArray(roles) ? roles : [roles]
  
  // Compute effective role (same logic as frontend)
  let effectiveRole = session.role
  if (session.role === 'employee' && session.ceoInterface) effectiveRole = 'ceo'
  if (session.role === 'employee' && session.fieldWorker) effectiveRole = 'fieldWorker'

  if (!allowed.includes(effectiveRole) && !allowed.includes(session.role)) {
    return err('Forbidden', 403)
  }
  return null
}
