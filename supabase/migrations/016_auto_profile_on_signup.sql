-- 016 — Auto-create profile + users row on auth.users signup
-- So new users don't need to run manual SQL — they appear as pending, admin approves
-- Also covers your Openpost-images R2 prefix already in use (no DB change)

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, status)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'pending')
  on conflict (id) do update set email = excluded.email;

  insert into public.users (id, email, name, password_hash, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), '', 'contributor')
  on conflict (id) do nothing;

  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth.users without profiles (for your devasishpalhkp@gmail.com etc. - already done, but safe)
insert into public.profiles (id, email, display_name, status)
select id, email, split_part(email, '@', 1), 'approved'
from auth.users
on conflict (id) do nothing;

insert into public.users (id, email, name, password_hash, role)
select id, email, split_part(email, '@', 1), '', 'contributor'
from auth.users
on conflict (id) do nothing;

comment on function public.handle_new_user() is 'Auto-creates profiles + users on signup — new users appear as pending';
