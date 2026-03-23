import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!

// ─── תיקון: ולידציה שה-secret קיים ───
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required')

const COOKIE_NAME = 'wfp_session'

export interface SessionPayload {
  id: number
  username: string
  name: string
  role: string
  company: string | null
}

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12) // ─── תיקון: מ-10 ל-12 rounds ───
}

// ─── תיקון #1: הסרת plain text fallback ───
// ─── תיקון #2: dummy hash למניעת timing attack ───
// bcrypt של מחרוזת קבועה — מחושב מראש כדי לא לחשב בכל request
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J3VGabAiG'

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  // אם אין hash (משתמש לא נמצא) — מריץ bcrypt בכל זאת למניעת timing attack
  // ואז מחזיר false
  if (!hash) {
    await bcrypt.compare(password, DUMMY_HASH) // timing protection
    return false
  }

  // ─── plain text fallback הוסר לחלוטין ───
  // רק bcrypt נתמך
  if (!hash.startsWith('$2')) {
    // hash לא תקין — יכול לקרות למשתמשים ישנים עם plain text בDB
    // מריצים dummy compare ומחזירים false עד שהסיסמה תתעדכן
    await bcrypt.compare(password, DUMMY_HASH)
    return false
  }

  return bcrypt.compare(password, hash)
}
