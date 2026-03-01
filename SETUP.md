# WorkFlow Pro — מדריך התקנה

## דרישות
- Node.js 18+
- חשבון Supabase
- חשבון Vercel

## שלב 1 — Supabase
1. כנס ל-supabase.com → הפרויקט שלך
2. SQL Editor → הרץ את `schema.sql` (אם עוד לא עשית)
3. Settings → API → העתק:
   - **Project URL**
   - **service_role** key (לא anon!)

## שלב 2 — Environment Variables ב-Vercel
Vercel → הפרויקט → Settings → Environment Variables:

| שם | ערך |
|---|---|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role) |
| `JWT_SECRET` | מחרוזת רנדומלית ארוכה |

## שלב 3 — העלאה ל-GitHub
העלה את כל התיקייה (חוץ מ-node_modules ו-.env.local).
Vercel יזהה Next.js ויבנה אוטומטית.

## פיתוח מקומי
```bash
cp .env.local.template .env.local
# מלא את הערכים ב-.env.local
npm install
npm run dev
```

## מבנה הפרויקט
```
app/
  api/          ← API Routes (רץ בשרת — קוד מוסתר)
    auth/       ← login, logout, session
    users/      ← CRUD משתמשים
    tasks/      ← CRUD משימות
    hours/      ← שעות פועלים
    signatures/ ← חתימות
    requests/   ← פניות פועלים
    companies/  ← ניהול חברות
    notes/      ← הערות אישיות
  app/          ← redirect ל-app.html
lib/
  supabase.ts   ← Supabase client (שרת בלבד)
  auth.ts       ← JWT + bcrypt
  api.ts        ← response helpers
public/
  app.html      ← האפליקציה הראשית (UI בלבד)
middleware.ts   ← הגנה על API routes
```
