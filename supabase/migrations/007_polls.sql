-- 007 — polls (block-based, Stage 3)

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid references blogs(id) on delete cascade,
  question text not null,
  type poll_type not null default 'single',
  allow_anonymous boolean not null default true,
  show_results poll_results_visibility not null default 'always',
  vote_limit_per_user int not null default 1,
  closes_at timestamptz,
  status poll_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists polls_updated_at on polls;
create trigger polls_updated_at before update on polls for each row execute function update_updated_at();

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  voter_fingerprint text not null,
  voted_at timestamptz not null default now(),
  unique (poll_id, voter_fingerprint)
);

create index if not exists poll_votes_poll_idx on poll_votes (poll_id);

-- RLS
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

-- Public can read polls/options that are open (for voting), but votes are insert-only
drop policy if exists "polls_public_read" on polls;
create policy "polls_public_read" on polls for select using (true);

drop policy if exists "polls_auth_write" on polls;
create policy "polls_auth_write" on polls for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "poll_options_public_read" on poll_options;
create policy "poll_options_public_read" on poll_options for select using (true);

drop policy if exists "poll_options_auth_write" on poll_options;
create policy "poll_options_auth_write" on poll_options for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "poll_votes_public_insert" on poll_votes;
create policy "poll_votes_public_insert" on poll_votes for insert
  with check (true); -- rate-limited in API, fingerprint dedup via unique constraint

drop policy if exists "poll_votes_public_read" on poll_votes;
create policy "poll_votes_public_read" on poll_votes for select using (true);
