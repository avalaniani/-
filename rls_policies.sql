-- ============================================================
-- WorkFlow Pro — RLS Policies (מחליף את allow_all)
-- הרץ ב-Supabase SQL Editor
-- ============================================================

-- ── 1. הסר את ה-allow_all הישן ────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['companies','users','tasks','subtasks','worker_hours','signatures','requests','notes']
  loop
    execute format('drop policy if exists "allow_all" on %I', t);
  end loop;
end $$;

-- ── 2. פונקציה עזר — מחזירה את company_id של המשתמש הנוכחי ──
-- האפליקציה מעבירה את ה-user_id דרך Supabase headers
create or replace function current_user_id()
returns int language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::int
$$;

create or replace function current_user_company()
returns text language sql stable as $$
  select company_id from users where id = current_user_id()
$$;

create or replace function current_user_role()
returns text language sql stable as $$
  select role from users where id = current_user_id()
$$;

-- ── 3. COMPANIES ──────────────────────────────────────────
-- קריאה: admin רואה הכל, שאר רואים רק את החברה שלהם
create policy "companies_select" on companies for select using (
  current_user_role() = 'admin' or id = current_user_company()
);
-- כתיבה: רק admin
create policy "companies_insert" on companies for insert with check (
  current_user_role() = 'admin'
);
create policy "companies_update" on companies for update using (
  current_user_role() = 'admin' or 
  (current_user_role() in ('ceo','employee') and id = current_user_company())
);
create policy "companies_delete" on companies for delete using (
  current_user_role() = 'admin'
);

-- ── 4. USERS ──────────────────────────────────────────────
-- קריאה: admin הכל, ceo/employee את החברה, worker את עצמו
-- חשוב: password_hash מוסתר דרך view נפרד (ראה סוף)
create policy "users_select" on users for select using (
  current_user_role() = 'admin'
  or id = current_user_id()
  or (current_user_role() in ('ceo','employee') and company_id = current_user_company())
);
create policy "users_insert" on users for insert with check (
  current_user_role() in ('admin','ceo','employee')
);
create policy "users_update" on users for update using (
  current_user_role() = 'admin'
  or id = current_user_id()
  or (current_user_role() in ('ceo','employee') and company_id = current_user_company())
);
create policy "users_delete" on users for delete using (
  current_user_role() = 'admin'
  or (current_user_role() in ('ceo','employee') and company_id = current_user_company())
);

-- ── 5. TASKS ──────────────────────────────────────────────
create policy "tasks_select" on tasks for select using (
  current_user_role() = 'admin'
  or company_id = current_user_company()
  or assigned_to = current_user_id()
);
create policy "tasks_insert" on tasks for insert with check (
  current_user_role() = 'admin'
  or company_id = current_user_company()
);
create policy "tasks_update" on tasks for update using (
  current_user_role() = 'admin'
  or company_id = current_user_company()
  or assigned_to = current_user_id()
);
create policy "tasks_delete" on tasks for delete using (
  current_user_role() = 'admin'
  or company_id = current_user_company()
);

-- ── 6. SUBTASKS ───────────────────────────────────────────
create policy "subtasks_select" on subtasks for select using (
  exists (
    select 1 from tasks t where t.id = task_id
    and (t.company_id = current_user_company() or t.assigned_to = current_user_id() or current_user_role() = 'admin')
  )
);
create policy "subtasks_insert" on subtasks for insert with check (
  exists (
    select 1 from tasks t where t.id = task_id
    and (t.company_id = current_user_company() or current_user_role() = 'admin')
  )
);
create policy "subtasks_update" on subtasks for update using (
  exists (
    select 1 from tasks t where t.id = task_id
    and (t.company_id = current_user_company() or t.assigned_to = current_user_id() or current_user_role() = 'admin')
  )
);
create policy "subtasks_delete" on subtasks for delete using (
  exists (
    select 1 from tasks t where t.id = task_id
    and (t.company_id = current_user_company() or current_user_role() = 'admin')
  )
);

-- ── 7. WORKER_HOURS ───────────────────────────────────────
create policy "hours_select" on worker_hours for select using (
  current_user_role() = 'admin'
  or worker_id = current_user_id()
  or exists (
    select 1 from users u where u.id = worker_id
    and u.company_id = current_user_company()
  )
);
create policy "hours_insert" on worker_hours for insert with check (
  worker_id = current_user_id()
  or current_user_role() in ('admin','ceo','employee')
);
create policy "hours_update" on worker_hours for update using (
  worker_id = current_user_id()
  or current_user_role() in ('admin','ceo','employee')
);
create policy "hours_delete" on worker_hours for delete using (
  worker_id = current_user_id()
  or current_user_role() in ('admin','ceo','employee')
);

-- ── 8. SIGNATURES ─────────────────────────────────────────
create policy "signatures_select" on signatures for select using (
  current_user_role() = 'admin'
  or worker_id = current_user_id()
  or company_id = current_user_company()
);
create policy "signatures_insert" on signatures for insert with check (
  worker_id = current_user_id()
  or current_user_role() in ('admin','ceo','employee')
);
create policy "signatures_update" on signatures for update using (
  worker_id = current_user_id()
  or current_user_role() in ('admin','ceo','employee')
);
create policy "signatures_delete" on signatures for delete using (
  current_user_role() in ('admin','ceo','employee')
  or worker_id = current_user_id()
);

-- ── 9. REQUESTS ───────────────────────────────────────────
create policy "requests_select" on requests for select using (
  current_user_role() = 'admin'
  or worker_id = current_user_id()
  or company_id = current_user_company()
);
create policy "requests_insert" on requests for insert with check (
  worker_id = current_user_id()
  or current_user_role() in ('admin','ceo','employee')
);
create policy "requests_update" on requests for update using (
  current_user_role() in ('admin','ceo','employee')
  or worker_id = current_user_id()
);
create policy "requests_delete" on requests for delete using (
  current_user_role() in ('admin','ceo')
  or current_user_role() = 'admin'
);

-- ── 10. NOTES ─────────────────────────────────────────────
create policy "notes_select" on notes for select using (
  user_id = current_user_id() or current_user_role() = 'admin'
);
create policy "notes_insert" on notes for insert with check (
  user_id = current_user_id()
);
create policy "notes_update" on notes for update using (
  user_id = current_user_id()
);
create policy "notes_delete" on notes for delete using (
  user_id = current_user_id() or current_user_role() = 'admin'
);

-- ============================================================
-- ✅ RLS מוכן!
-- עכשיו צריך לעדכן את האפליקציה לשלוח app.user_id בכל קריאה
-- ============================================================

-- ── פונקציה: set_user_context ─────────────────────────────
-- האפליקציה קוראת לה אחרי כל login כדי לאמר ל-Postgres מי מחובר
create or replace function set_user_context(p_user_id int)
returns void language plpgsql security definer as $$
begin
  perform set_config('app.user_id', p_user_id::text, false);
end;
$$;

-- ── View: users_safe — בלי password_hash ─────────────────
-- האפליקציה תקרא מ-view זה במקום מהטבלה הישירה
create or replace view users_safe as
  select id, username, name, role, company_id, avatar, avatar_color,
         id_type, id_number, ceo_interface, field_worker, created_at
  from users;

-- תן גישה ל-anon ל-view
grant select on users_safe to anon;
