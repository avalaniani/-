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

  // נסה את המודלים בסדר עדיפות — מהחדש לישן
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
  ]

  let lastError = ''
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify(geminiBody),
    })

    const data = await response.json()

    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '❌ לא התקבלה תגובה'
      return ok({ content: [{ type: 'text', text }] })
    }

    // אם המודל לא נמצא — נסה הבא
    if (data?.error?.message?.includes('not found')) {
      lastError = data.error.message
      continue
    }

    // שגיאה אחרת — החזר מיד
    return err(data?.error?.message || 'Gemini error', response.status)
  }

  return err('לא נמצא מודל זמין: ' + lastError, 503)
}
