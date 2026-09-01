-- 011 — projects, profiles, memberships, integrations (new, preserves existing tables)

-- Profile status for approval flow
do $$ begin
  create type profile_status as enum ('pending','approved','rejected','suspended');
exception when duplicate_object then null;
end $$;

-- User profiles (extends auth.users via id)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  status profile_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  owner_id uuid not null references profiles(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_owner_idx on projects(owner_id);
create index if not exists projects_slug_idx on projects(slug);

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at before update on projects for each row execute function update_updated_at();
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();

-- Project members (user can belong to many projects)
create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists project_members_user_idx on project_members(user_id);

-- Alter existing content tables to add project_id (nullable first, then backfill, then not null)
alter table categories add column if not exists project_id uuid references projects(id) on delete cascade;
alter table tags add column if not exists project_id uuid references projects(id) on delete cascade;
alter table authors add column if not exists project_id uuid references projects(id) on delete cascade;
alter table media add column if not exists project_id uuid references projects(id) on delete cascade;
alter table blogs add column if not exists project_id uuid references projects(id) on delete cascade;
alter table webhooks add column if not exists project_id uuid references projects(id) on delete cascade;
alter table polls add column if not exists project_id uuid references projects(id) on delete cascade;

create index if not exists categories_project_idx on categories(project_id);
create index if not exists tags_project_idx on tags(project_id);
create index if not exists authors_project_idx on authors(project_id);
create index if not exists media_project_idx on media(project_id);
create index if not exists blogs_project_idx on blogs(project_id);
create index if not exists blogs_project_slug_idx on blogs(project_id, slug);
create index if not exists webhooks_project_idx on webhooks(project_id);

-- Unique slug per project (allow same slug across projects)
drop index if exists blogs_slug_idx;
create unique index if not exists blogs_project_slug_unique on blogs(project_id, slug) where slug is not null;

-- Pending invites (admin approves)
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  project_id uuid not null references projects(id) on delete cascade,
  role user_role not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz
);
create index if not exists invites_token_idx on invites(token);
create index if not exists invites_email_idx on invites(email);

-- RLS
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table invites enable row level security;

-- Profiles: users can read own, admin can read all via service_role; pending users can only see /pending-approval
drop policy if exists "profiles_self_read" on profiles;
create policy "profiles_self_read" on profiles for select using (auth.uid() = id);
drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);
-- Service role bypasses for admin operations

-- Projects: members can read their projects
drop policy if exists "projects_member_read" on projects;
create policy "projects_member_read" on projects for select
  using (exists (select 1 from project_members where project_members.project_id = projects.id and project_members.user_id = auth.uid()));

drop policy if exists "projects_owner_write" on projects;
create policy "projects_owner_write" on projects for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Project members: members can read their memberships
drop policy if exists "members_self_read" on project_members;
create policy "members_self_read" on project_members for select
  using (user_id = auth.uid() or exists (select 1 from project_members pm where pm.project_id = project_members.project_id and pm.user_id = auth.uid() and pm.role in ('owner','admin','ADMIN')));

-- Invites: admin of project can manage
drop policy if exists "invites_admin" on invites;
create policy "invites_admin" on invites for all
  using (exists (select 1 from project_members where project_members.project_id = invites.project_id and project_members.user_id = auth.uid() and project_members.role in ('owner','admin','ADMIN')))
  with check (exists (select 1 from project_members where project_members.project_id = invites.project_id and project_members.user_id = auth.uid() and project_members.role in ('owner','admin','ADMIN')));

comment on table projects is 'One OpenPost install can host many isolated blog projects (Sanity-like). Every blog, media, category, etc must have project_id.';
