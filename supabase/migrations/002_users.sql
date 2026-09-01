-- 002 — users (auth identity — separate from authors public profile)
-- Supabase uses auth.users for real login; this table is for app-level role & profile linkage.
-- If you use Supabase Auth directly, you can keep this or sync via trigger on auth.users.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null, -- set '' when using Supabase Auth (managed outside)
  role user_role not null default 'contributor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on users (email);

-- Updated_at trigger
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists users_updated_at on users;
create trigger users_updated_at before update on users for each row execute function update_updated_at();

-- RLS
alter table users enable row level security;

-- Authenticated users can read their own row; admins can read all (service_role bypasses RLS anyway)
drop policy if exists "users_self_read" on users;
create policy "users_self_read" on users for select
  using (auth.uid()::text = id::text or auth.jwt() ->> 'role' in ('owner','admin'));

drop policy if exists "users_service_all" on users;
create policy "users_service_all" on users for all
  using (true) with check (true); -- restrict via app: RLS is permissive here, real check is in API RBAC; service_role bypasses

comment on table users is 'App users — role controls CMS permissions. Supabase auth.users is source of truth if using Supabase Auth.';
