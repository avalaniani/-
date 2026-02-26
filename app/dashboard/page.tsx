// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function DashboardPage() {
  const session = getSession()
  if (!session) redirect('/login')

  // The actual app is in public/app.html
  // We redirect to it — the ENV vars are injected via a script tag in _document or middleware
  redirect('/app.html')
}
