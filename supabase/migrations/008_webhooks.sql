-- 008 — webhooks (Sanity-like, Stage 2 extra)

create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  events text[] not null, -- e.g. {post.publish,post.update,post.delete}
  secret text,
  is_active boolean not null default true,
  filter text, -- GROQ-like: category == 'seo'
  retry_count int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists webhooks_active_idx on webhooks (is_active);

drop trigger if exists webhooks_updated_at on webhooks;
create trigger webhooks_updated_at before update on webhooks for each row execute function update_updated_at();

create table if not exists webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references webhooks(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists webhook_deliveries_webhook_created_idx on webhook_deliveries (webhook_id, created_at);

-- RLS: only authenticated can manage webhooks; service_role bypasses
alter table webhooks enable row level security;
alter table webhook_deliveries enable row level security;

drop policy if exists "webhooks_auth" on webhooks;
create policy "webhooks_auth" on webhooks for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "deliveries_auth" on webhook_deliveries;
create policy "deliveries_auth" on webhook_deliveries for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
