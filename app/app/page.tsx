import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default function AppPage() {
  // אם אין session — הפנה לדף הראשי (שם מוצג מסך login)
  // ה-app.html מטפל ב-login בעצמו
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <script dangerouslySetInnerHTML={{
          __html: `window.location.replace('/app.html')`
        }} />
      </body>
    </html>
  )
}
