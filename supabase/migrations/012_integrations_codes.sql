-- 012 — integrations (project-scoped API credentials) + connection codes for CLI

-- Integrations: website connections (project-scoped API keys)
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null, -- e.g. "My Tech Website"
  token_hash text not null, -- store hash, not raw token
  token_prefix text not null, -- first 8 chars for display
  permissions text[] not null default '{READ_PUBLISHED_POSTS,READ_CATEGORIES,READ_TAGS,READ_AUTHORS,RECEIVE_WEBHOOKS}',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists integrations_project_idx on integrations(project_id);
create index if not exists integrations_token_hash_idx on integrations(token_hash);

-- Connection codes for CLI (short-lived, single-use)
create table if not exists connection_codes (
  code text primary key, -- e.g. OP-XXXX-XXXX
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at timestamptz,
  -- code is random, not secret; it authorizes CLI to start OAuth flow, not to access data directly
  check (code ~ '^OP-[A-Z0-9]{4}-[A-Z0-9]{4}$')
);
create index if not exists connection_codes_expires_idx on connection_codes(expires_at);

-- Authorization codes for CLI OAuth (short-lived, single-use, exchanged for integration token)
create table if not exists cli_auth_codes (
  code text primary key,
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at timestamptz
);

-- Audit log (admin actions)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null, -- e.g. user.approved, role.changed, webhook.created, integration.revoked
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_project_created_idx on audit_logs(project_id, created_at desc);

-- RLS
alter table integrations enable row level security;
alter table connection_codes enable row level security;
alter table cli_auth_codes enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "integrations_member_read" on integrations;
create policy "integrations_member_read" on integrations for select
  using (exists (select 1 from project_members where project_members.project_id = integrations.project_id and project_members.user_id = auth.uid()));

drop policy if exists "integrations_admin_write" on integrations;
create policy "integrations_admin_write" on integrations for all
  using (exists (select 1 from project_members where project_members.project_id = integrations.project_id and project_members.user_id = auth.uid() and project_members.role in ('owner','admin')))
  with check (exists (select 1 from project_members where project_members.project_id = integrations.project_id and project_members.user_id = auth.uid() and project_members.role in ('owner','admin')));

-- Connection codes: any authenticated member of project can create; anyone with code can read (for CLI discovery) but code is short-lived and single-use
drop policy if exists "codes_member_create" on connection_codes;
create policy "codes_member_create" on connection_codes for insert
  with check (exists (select 1 from project_members where project_members.project_id = connection_codes.project_id and project_members.user_id = auth.uid()));

drop policy if exists "codes_read" on connection_codes;
create policy "codes_read" on connection_codes for select using (true); -- CLI needs to discover project_id from code without auth (code itself is auth)

drop policy if exists "cli_codes_member" on cli_auth_codes;
create policy "cli_codes_member" on cli_auth_codes for all
  using (exists (select 1 from project_members where project_members.project_id = cli_auth_codes.project_id and project_members.user_id = auth.uid()));

drop policy if exists "audit_member_read" on audit_logs;
create policy "audit_member_read" on audit_logs for select
  using (project_id is null or exists (select 1 from project_members where project_members.project_id = audit_logs.project_id and project_members.user_id = auth.uid()));
