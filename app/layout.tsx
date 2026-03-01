import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WorkFlow Pro',
  description: 'מערכת ניהול עובדים ופועלים',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
