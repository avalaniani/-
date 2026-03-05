import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ok, err, requireAuth } from '@/lib/api'

export async function POST(req: NextRequest) {
  const session = requireAuth(req)
  if ('status' in session) return session

  const body = await req.json()
  const { messages, system, max_tokens = 1000 } = body
  if (!messages?.length) return err('Missing messages')

  // שלוף את מפתח ה-Gemini של החברה מ-Supabase
  let geminiKey: string | null = null

  if (session.company) {
    const { data: company } = await supabase
      .from('companies')
      .select('gemini_key')
      .eq('id', session.company)
      .single()
    geminiKey = company?.gemini_key || null
  }

  // fallback למפתח גלובלי (אם הוגדר ב-Vercel env)
  if (!geminiKey) geminiKey = process.env.GEMINI_API_KEY || null
  if (!geminiKey) return err('מפתח AI לא הוגדר לחברה זו. בקש ממנהל החברה להוסיף מפתח Gemini בהגדרות.', 503)

  // המרת פורמט → Gemini
  const geminiContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const geminiBody: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: { maxOutputTokens: max_tokens, temperature: 0.7 },
  }
  if (system) {
    geminiBody.systemInstruction = { parts: [{ text: system }] }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiBody),
  })

  const data = await response.json()
  if (!response.ok) return err(data?.error?.message || 'Gemini error', response.status)

  // החזר בפורמט Anthropic (שה-frontend מצפה לו)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '❌ לא התקבלה תגובה'
  return ok({ content: [{ type: 'text', text }] })
}
