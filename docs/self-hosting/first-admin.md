# First Admin — Secure Bootstrap via Supabase

Normal signup creates `profiles.status = 'pending'` — no admin. To create the first admin:

1. Create user via Supabase Auth: Dashboard → Authentication → Add user → email/password → copy UUID.
2. Run SQL in SQL Editor (replace UUID and email):

```sql
-- Insert profile as approved admin and create membership
insert into profiles (id, email, display_name, status) values ('<UUID>', 'admin@example.com', 'Admin', 'approved')
on conflict (id) do update set status='approved';

-- Ensure project exists (or create one)
insert into projects (id, name, slug, owner_id) values (gen_random_uuid(), 'Tech Blog', 'tech-blog', '<UUID>')
on conflict do nothing;

-- Make member admin
insert into project_members (project_id, user_id, role)
select id, '<UUID>', 'ADMIN' from projects where slug='tech-blog'
on conflict do nothing;

-- Also set legacy users.role for API fallback
update users set role='ADMIN' where id='<UUID>';
```

3. Login at `/login` → you will see Dashboard, not `/pending-approval`.

**Why not public admin?** No endpoint allows `role=admin` from browser; `project_members.role` is validated server-side via `requireRole('ADMIN')` and RLS `project_members` check.

**Alternative:** After first admin exists, go to Dashboard → Settings → Users → Pending → Approve → choose Project + Role (Writer/Editor/Admin).
