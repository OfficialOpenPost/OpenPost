-- 001 — Extensions & Enums
-- Run first. Safe to re-run (IF NOT EXISTS).

-- Enable UUID generation
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  create type user_role as enum ('owner','admin','editor','author','contributor');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type post_status as enum ('draft','published','scheduled','archived','trash');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type poll_type as enum ('single','multiple');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type poll_status as enum ('draft','open','closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type poll_results_visibility as enum ('always','after_vote','after_close');
exception when duplicate_object then null;
end $$;
