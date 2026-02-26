-- ============================================================
-- WorkFlow Pro — Supabase Schema
-- הרץ קובץ זה ב-Supabase SQL Editor (פעם אחת)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Companies ──────────────────────────────────────────────
create table companies (
  id          text primary key,           -- e.g. 'techcorp'
  name        text not null,
  field       text,
  emoji       text default '🏢',
  color       text default '#6c63ff',
  sig_password text,                      -- סיסמת חתימה של מנכ"ל
  created_at  timestamptz default now()
);

-- ── Users ──────────────────────────────────────────────────
create table users (
  id            serial primary key,
  username      text unique not null,
  password_hash text not null,            -- bcrypt hash
  name          text not null,
  role          text not null check (role in ('admin','ceo','employee','worker')),
  company_id    text references companies(id) on delete set null,
  avatar        text default '💼',
  avatar_color  text default '#60a5fa',
  id_type       text default 'id' check (id_type in ('id','passport')),
  id_number     text,
  ceo_interface boolean default false,    -- ממשק עובד מורחב
  field_worker  boolean default false,    -- עובד שטח
  created_at    timestamptz default now()
);

-- ── Tasks ──────────────────────────────────────────────────
create table tasks (
  id            serial primary key,
  title         text not null,
  description   text,
  assigned_to   int references users(id) on delete set null,
  assigned_by   int references users(id) on delete set null,
  company_id    text references companies(id) on delete cascade,
  priority      text default 'medium' check (priority in ('high','medium','low')),
  status        text default 'open' check (status in ('open','done')),
  due_date      date,
  created_by_emp boolean default false,
  created_at    timestamptz default now()
);

-- ── Subtasks ───────────────────────────────────────────────
create table subtasks (
  id        serial primary key,
  task_id   int references tasks(id) on delete cascade,
  title     text not null,
  done      boolean default false,
  created_at timestamptz default now()
);

-- ── Worker Hours ───────────────────────────────────────────
create table worker_hours (
  id          serial primary key,
  worker_id   int references users(id) on delete cascade,
  work_date   date not null,
  start_time  time,
  end_time    time,
  hours       numeric(5,2),
  note        text,
  created_at  timestamptz default now(),
  unique(worker_id, work_date)
);

-- ── Signatures ─────────────────────────────────────────────
create table signatures (
  id          serial primary key,
  worker_id   int references users(id) on delete cascade,
  company_id  text references companies(id) on delete cascade,
  year        int not null,
  month       int not null,               -- 0-indexed (0=ינואר)
  type        text check (type in ('full','partial')),
  days        int[],                      -- ימים חתומים (לחלקי)
  signed_at   timestamptz default now(),
  unique(worker_id, year, month)
);

-- ── Requests (פניות פועלים) ────────────────────────────────
create table requests (
  id          serial primary key,
  worker_id   int references users(id) on delete cascade,
  worker_name text not null,
  company_id  text references companies(id) on delete cascade,
  type        text not null,              -- 'equipment','safety','schedule','payment','other'
  text        text not null,
  status      text default 'pending' check (status in ('pending','inprogress','done')),
  reply       text,
  created_at  timestamptz default now()
);

-- ── Notes ──────────────────────────────────────────────────
create table notes (
  id          serial primary key,
  user_id     int references users(id) on delete cascade,
  content     text,
  updated_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table companies    enable row level security;
alter table users        enable row level security;
alter table tasks        enable row level security;
alter table subtasks     enable row level security;
alter table worker_hours enable row level security;
alter table signatures   enable row level security;
alter table requests     enable row level security;
alter table notes        enable row level security;

-- כל הגישה דרך service_role (API Routes) — אין גישה ישירה מהדפדפן
-- ה-anon key משמש רק לאימות, כל שאר הפעולות דרך server-side

create policy "service_role full access" on companies    for all using (true);
create policy "service_role full access" on users        for all using (true);
create policy "service_role full access" on tasks        for all using (true);
create policy "service_role full access" on subtasks     for all using (true);
create policy "service_role full access" on worker_hours for all using (true);
create policy "service_role full access" on signatures   for all using (true);
create policy "service_role full access" on requests     for all using (true);
create policy "service_role full access" on notes        for all using (true);

-- ============================================================
-- Seed Data — נתוני דמו ראשוניים
-- ============================================================

insert into companies (id, name, field, emoji, color) values
  ('techcorp',  'TechCorp Solutions', 'פיתוח תוכנה',  '💻', '#60a5fa'),
  ('buildpro',  'BuildPro Construction', 'בנייה והנדסה', '🏗️', '#fb923c'),
  ('cleanit',   'CleanIt Services', 'ניקיון ותחזוקה', '🧹', '#4ade80');

-- סיסמאות: bcrypt של הסיסמאות המקוריות — בייצור תשנה אותן!
-- admin123, ceo123, ceo456, ceo789, emp123, emp456, emp789, emp321, wrk123, wrk456, wrk789, wrk321
-- בגרסת הדמו נשתמש ב-plain text בשדה password_hash ונמיר בהמשך
insert into users (username, password_hash, name, role, company_id, avatar, avatar_color) values
  ('admin',       'admin123',  'מנהל מערכת', 'admin',    null,        '👑', '#6c63ff'),
  ('ceo_techcorp','ceo123',    'יאיר כהן',   'ceo',      'techcorp',  '🏢', '#60a5fa'),
  ('ceo_buildpro','ceo456',    'מירי לוי',   'ceo',      'buildpro',  '🏢', '#fb923c'),
  ('ceo_cleanit', 'ceo789',    'רון אדר',    'ceo',      'cleanit',   '🏢', '#4ade80'),
  ('employee1',   'emp123',    'דוד לוי',    'employee', 'techcorp',  '💼', '#4ade80'),
  ('employee2',   'emp456',    'שרה רוזן',   'employee', 'techcorp',  '💼', '#fbbf24'),
  ('employee3',   'emp789',    'רון אבן',    'employee', 'buildpro',  '💼', '#f87171'),
  ('employee4',   'emp321',    'טל ברק',     'employee', 'cleanit',   '💼', '#60a5fa'),
  ('worker1',     'wrk123',    'יוסף כהן',   'worker',   'buildpro',  '🔧', '#fb923c'),
  ('worker2',     'wrk456',    'אחמד חסן',   'worker',   'buildpro',  '🔧', '#a78bfa'),
  ('worker3',     'wrk789',    'מיכאל ברג',  'worker',   'techcorp',  '🔧', '#34d399'),
  ('worker4',     'wrk321',    'ג׳ורג׳ מסיח','worker',   'cleanit',   '🔧', '#f472b6');
