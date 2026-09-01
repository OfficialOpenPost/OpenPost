-- 015 — Fix users.name column for Prisma (was missing)
alter table users add column if not exists name text default 'User';
-- Backfill
update users set name = split_part(email, '@', 1) where name is null or name = 'User';
-- Make not null after backfill (optional)
do $$ begin
  alter table users alter column name set not null;
exception when others then null;
end $$;
