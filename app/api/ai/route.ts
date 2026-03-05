import { NextRequest } from 'next/server'
import { ok, err, requireAuth } from '@/lib/api'

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { messages, system, max_tokens = 1000 } = body

  if (!messages?.length) return err('Missing messages')

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return err('AI not configured', 503)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens,
      system,
      messages,
    }),
  })

  const data = await response.json()
  if (!response.ok) return err(data?.error?.message || 'AI error', response.status)
  return ok(data)
}
