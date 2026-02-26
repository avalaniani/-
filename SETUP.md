# 🚀 WorkFlow Pro — מדריך הגדרה מלא

## שלב 1: הגדרת Supabase

### 1.1 הרצת ה-Schema
1. פתח את **Supabase Dashboard** → SQL Editor
2. העתק את כל תוכן הקובץ `supabase/schema.sql`
3. לחץ **Run** — זה יצור את כל הטבלאות ונתוני הדמו

### 1.2 בדיקה
ב-Supabase → Table Editor, תראה את הטבלאות:
- `companies` (3 חברות)
- `users` (12 משתמשים)
- `tasks`, `subtasks`, `worker_hours`, `signatures`, `requests`, `notes`

---

## שלב 2: הגדרת משתני סביבה

### ב-Vercel (כבר הגדרת 3 מתוך 4):
```
SUPABASE_URL          ✅ כבר מוגדר
SUPABASE_ANON_KEY     ✅ כבר מוגדר  
SUPABASE_SERVICE_ROLE_KEY ✅ כבר מוגדר
JWT_SECRET            ❌ צריך להוסיף!
```

### הוסף JWT_SECRET ב-Vercel:
```bash
# צור מחרוזת אקראית:
openssl rand -base64 32
# העתק את התוצאה והוסף כ-Environment Variable בשם JWT_SECRET
```

### לפיתוח מקומי:
```bash
cp .env.local.template .env.local
# ערוך את .env.local עם הערכים האמיתיים
```

---

## שלב 3: פיתוח מקומי

```bash
# התקן dependencies
npm install

# הפעל server מקומי
npm run dev

# פתח http://localhost:3000
```

---

## שלב 4: העלאה ל-Vercel

### אפשרות א׳ — Vercel CLI:
```bash
npm install -g vercel
vercel --prod
```

### אפשרות ב׳ — GitHub:
1. `git init && git add . && git commit -m "initial"`
2. `git remote add origin YOUR_GITHUB_REPO`
3. `git push -u origin main`
4. ב-Vercel → Import Project → בחר את ה-repo

---

## שלב 5: הגדרת הקובץ app.html

העתק את הקובץ `workflow-pro-v9.html` לתיקייה `public/` בשם `app.html`:
```bash
cp /path/to/workflow-pro-v9.html public/app.html
```

ואז הוסף בתחילת הסקריפט הראשי ב-`app.html` את הגשר:

```javascript
// בתחילת ה-<script> הראשי, לפני כל קוד אחר:
(function() {
  // Signal to parent that app is ready
  window.parent.postMessage({ type: 'APP_READY' }, '*');
  
  // Listen for init data from Next.js
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'INIT_DATA') {
      // Replace in-memory DATA with server data
      DATA.companies = e.data.data.companies.map(mapCompany);
      DATA.users = e.data.data.users.map(mapUser);
      DATA.tasks = e.data.data.tasks.map(mapTask);
      DATA.requests = e.data.data.requests;
      currentUser = e.data.data.users.find(u => u.id === e.data.session.userId);
      // Re-login with the fetched user
      if (currentUser) login(currentUser);
    }
  });

  // Override logout to notify parent
  const _logout = window.logout;
  window.logout = function() {
    window.parent.postMessage({ type: 'LOGOUT' }, '*');
  };
})();
```

---

## ארכיטקטורה

```
Browser
  └── /dashboard (Next.js Server Component)
        ├── Loads initial data from Supabase (server-side)
        └── DashboardShell (Client Component)
              ├── Renders <iframe src="/app.html">
              ├── Sends data via postMessage
              └── Proxies API calls to /api/*
                    └── Supabase (service_role key — server only)
```

## משתמשי דמו

| משתמש | סיסמה | תפקיד |
|-------|-------|-------|
| admin | admin123 | מנהל מערכת |
| ceo_techcorp | ceo123 | מנכ"ל TechCorp |
| ceo_buildpro | ceo456 | מנכ"ל BuildPro |
| employee1 | emp123 | עובד TechCorp |
| worker1 | wrk123 | פועל BuildPro |
| worker2 | wrk456 | פועל BuildPro |

---

## שלב הבא: חיבור מלא

השלב הבא יהיה לחבר את כל הפעולות ב-`app.html` (הוספת פועל, שינוי שעות וכו׳)
לקריאות `/api/*` במקום לשינויים ב-`DATA` בזיכרון.

ראה `lib/api.ts` לכל ה-endpoints הזמינים.
