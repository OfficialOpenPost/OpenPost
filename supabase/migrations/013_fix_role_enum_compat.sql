-- 013 — Fix user_role enum for Prisma UPPERCASE compatibility
-- For DBs created before 001 fix: add ADMIN/EDITOR/WRITER/OWNER if missing
-- Safe to re-run. Run after 012.

do $$ begin
  alter type user_role add value if not exists 'ADMIN';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type user_role add value if not exists 'EDITOR';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type user_role add value if not exists 'WRITER';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type user_role add value if not exists 'OWNER';
exception when duplicate_object then null;
end $$;

-- Note: existing RLS policies in 011/012 already patched to use lowercase ('owner','admin')
-- This file only ensures Prisma's `ADMIN` inserts don't throw 22P02
