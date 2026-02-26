// lib/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import type { SessionPayload } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const COOKIE_NAME = 'wfp_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// ── Password helpers ────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Support plain-text passwords in demo/seed data
  if (!hash.startsWith('$2')) return plain === hash
  return bcrypt.compare(plain, hash)
}

// ── JWT helpers ─────────────────────────────────────────────
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

// ── Cookie helpers ──────────────────────────────────────────
export function setSessionCookie(payload: SessionPayload): void {
  const token = signToken(payload)
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE_NAME)
}

export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
