# Projects & Multi-Tenancy

OpenPost provides multi-project workspace isolation, allowing a single installation to manage multiple independent blogs, publication brands, or client websites.

---

## Multi-Project Isolation Architecture

Every content table in OpenPost includes a `project_id` foreign key referencing the `projects` table:
- `blogs.project_id`
- `categories.project_id`
- `tags.project_id`
- `authors.project_id`
- `media.project_id`
- `webhooks.project_id`
- `polls.project_id`

Unique constraints (such as post and category slugs) are scoped per-project:
```sql
ALTER TABLE categories ADD CONSTRAINT categories_project_id_slug_key UNIQUE (project_id, slug);
ALTER TABLE tags ADD CONSTRAINT tags_project_id_slug_key UNIQUE (project_id, slug);
```

This means two different projects in the same CMS instance can both have a category named `/engineering` without naming collisions.

---

## Managing Team Members & Invites

Project owners and admins can invite collaborators with specific roles:

### Supported Roles
1. **ADMIN**: Full access to project settings, integrations, webhooks, team invites, and content deletion.
2. **EDITOR**: Can create, edit, approve, and publish posts, categories, tags, and media.
3. **WRITER**: Can create and edit their own drafts; cannot publish directly without editor approval.
4. **CONTRIBUTOR**: Can submit drafts for review.

### Inviting a Teammate
1. Go to **Dashboard → Settings → Team Members**.
2. Click **Invite Member**.
3. Enter their email address and select their assigned role.
4. An invitation token is generated (valid for 7 days). When the teammate logs in, they are added to the project.

---

## Integration API Tokens

To connect frontends or background jobs without sharing user credentials, generate scoped Integration Tokens:

1. Go to **Dashboard → Settings → API Tokens**.
2. Click **Create Token**.
3. Assign a descriptive name (e.g. `Next.js Production Frontend`).
4. Select the permissions:
   - `READ_PUBLISHED_POSTS`
   - `READ_CATEGORIES`
   - `READ_TAGS`
   - `READ_AUTHORS`
   - `RECEIVE_WEBHOOKS`
5. Copy the generated secret token (`op_sec_...`).

> [!CAUTION] Secret Tokens
> Integration tokens are hashed using SHA-256 before being stored in the database. You will only be able to view the raw token once at the time of creation.
