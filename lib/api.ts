import { NextResponse } from 'next/server'
import { getSession, type SessionPayload } from './auth'

export const ok  = (data: unknown, status = 200) =>
  NextResponse.json(data, { status })

export const err = (msg: string, status = 400) =>
  NextResponse.json({ error: msg }, { status })

export function requireAuth(): SessionPayload | NextResponse {
  const session = getSession()
  if (!session) return err('Unauthorized', 401)
  return session
}

export function requireRole(roles: string[]): SessionPayload | NextResponse {
  const session = getSession()
  if (!session) return err('Unauthorized', 401)
  if (!roles.includes(session.role)) return err('Forbidden', 403)
  return session
}
