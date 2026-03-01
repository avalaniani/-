import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, type SessionPayload } from './auth'

export const ok  = (data: unknown, status = 200) =>
  NextResponse.json(data, { status })

export const err = (msg: string, status = 400) =>
  NextResponse.json({ error: msg }, { status })

export function requireAuth(req: NextRequest): SessionPayload | NextResponse {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return err('Unauthorized', 401)
  const session = verifyToken(token)
  if (!session) return err('Unauthorized', 401)
  return session
}

export function requireRole(req: NextRequest, roles: string[]): SessionPayload | NextResponse {
  const session = requireAuth(req)
  if (session instanceof NextResponse) return session
  if (!roles.includes(session.role)) return err('Forbidden', 403)
  return session
}
