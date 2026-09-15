# Troubleshooting Guide

This guide covers common setup issues, error messages, and their solutions.

---

## 1. Database Connection Issues

### "Can't reach database server at `aws-0-xxx.pooler.supabase.com:6543`"

**Cause:** Port `6543` is the Transaction Pooler, which may require IPv4 support.

**Solution:** Use the **Session Pooler on port `5432`** instead:

```env
DATABASE_URL="postgresql://postgres.ref:password@aws-0-region.pooler.supabase.com:5432/postgres"
```

### "Invalid database password / Authentication failed"

**Cause:** Special characters in your password (`@`, `#`, `$`, `%`) break URI parsing.

**Solution:** URL-encode special characters in `DATABASE_URL`:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `/` | `%2F` |

### "Connection refused" (Docker)

**Cause:** The database container isn't ready yet when the app starts.

**Solution:** The `compose.yml` includes health checks with `depends_on: condition: service_healthy`. If you're seeing this, increase the `start_period` in the health check or add a retry loop.

---

## 2. Cloudflare R2 & Media Upload Errors

### "CORS error / Failed to fetch on upload"

**Cause:** Your R2 bucket lacks a CORS policy for your domain.

**Solution:** In Cloudflare Dashboard → R2 → Bucket → **Settings** → **CORS Policy**, add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### "Image URL returns 404 Not Found"

**Cause:** `R2_PUBLIC_URL` has an extra bucket path appended.

**Solution:** Ensure `R2_PUBLIC_URL` contains only the domain:

```env
# Correct:
R2_PUBLIC_URL=https://media.yourdomain.com

# Incorrect:
R2_PUBLIC_URL=https://media.yourdomain.com/openpost-media/
```

### "403 Forbidden on upload"

**Cause:** The R2 API token doesn't have Object Read & Write permissions.

**Solution:** Regenerate the API token in Cloudflare with **Object Read & Write** permissions scoped to your bucket.

### "File too large" or upload silently fails

**Cause:** Default body size limit is reached.

**Solution:** OpenPost uses presigned URLs for uploads, so body size limits shouldn't apply. If you're using a reverse proxy (Nginx), increase:

```nginx
client_max_body_size 50M;
```

---

## 3. User Signups & Foreign Key Errors

### "insert or update on table 'media' violates foreign key constraint `media_uploaded_by_fkey`"

**Cause:** The user signed up via Supabase Auth but their record hasn't been approved/synced.

**Solution:** In Supabase SQL Editor:

```sql
-- Approve the user
UPDATE profiles SET status = 'approved' WHERE email = 'your-email@domain.com';

-- Optionally make them admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@domain.com';
```

### "new row violates row-level security policy"

**Cause:** The user's session is valid but they don't have permission for the operation.

**Solution:** Check the user's role and project membership:

```sql
SELECT pm.role, pm.project_id, p.status, p.email
FROM project_members pm
JOIN profiles p ON p.id = pm.user_id
WHERE p.email = 'user@example.com';
```

---

## 4. Build & Deployment Issues

### "npm run build" fails in CI/CD without a live database

**Answer:** OpenPost is designed with a resilient build architecture. Static generation paths fall back to mock data during `npm run build`, so CI/CD pipelines succeed even without a live database connection.

### Build fails with "prisma generate" error

**Solution:** Run `npx prisma generate` manually before building:

```bash
npx prisma generate
npm run build
```

### "Middleware" deprecation warning

**Warning:** `The "middleware" file convention is deprecated. Please use "proxy" instead.`

**Status:** This is a Next.js 16 deprecation notice. OpenPost's middleware works correctly. The migration to the `proxy` convention is optional and does not affect functionality.

### Vercel deployment fails with timeout

**Cause:** The build is timing out due to large dependencies.

**Solution:** Ensure `node_modules` is not committed. Check `package.json` for unnecessary large dependencies. Vercel's default build timeout is 45 minutes — if exceeded, contact Vercel support.

---

## 5. Authentication Issues

### "Invalid login credentials"

**Cause:** Email/password mismatch or the user doesn't exist.

**Solution:**
1. Verify the user exists: `SELECT * FROM profiles WHERE email = 'user@example.com';`
2. Check profile status: must be `approved` (not `pending` or `suspended`).
3. If using Supabase Auth, ensure the user has confirmed their email.

### Session expires immediately

**Cause:** `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is incorrect.

**Solution:** Verify these match your Supabase project settings exactly.

### "PENDING_APPROVAL" error on login

**Cause:** The user's profile status is `pending`.

**Solution:** Approve them in the dashboard (Team & Invites) or via SQL:

```sql
UPDATE profiles SET status = 'approved' WHERE email = 'user@example.com';
```

---

## 6. API Issues

### "FORBIDDEN" or "UNAUTHORIZED" on API calls

**Solution:**
1. Verify the API token is valid and not revoked.
2. Ensure `X-OpenPost-Project` header matches your project ID.
3. Check the token has the required permissions.

### CORS errors from external website

**Cause:** Your OpenPost instance doesn't allow cross-origin requests.

**Solution:** Add CORS headers in your deployment (Nginx, Vercel config, or middleware).

### Posts not appearing in public API

**Cause:** Posts are in `draft` status.

**Solution:** Publish the posts via the dashboard or API. Only `status: "published"` posts are returned by the public v1 API.

---

## 7. Scheduled Publishing Issues

### Posts not publishing automatically

**Solution:**
1. Verify the cron endpoint is being called: check your cron service logs.
2. Test the endpoint manually:
   ```bash
   curl -X POST https://yourdomain.com/api/cron/publish \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
3. Check that posts have `status: "scheduled"` and `scheduledAt` in the past.
4. For Vercel Hobby tier, the cron runs daily at midnight — use cron-job.org for more frequent checks.

---

## 8. Performance Issues

### Editor loads slowly

**Solution:**
1. Check your internet connection (Tiptap loads from CDN).
2. Clear browser cache.
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct.

### Large posts are slow to save

**Cause:** Very large posts (10,000+ words with many images) take longer to serialize.

**Solution:** This is normal. The autosave system uses a debounce to prevent excessive saves. Manual saves with Ctrl+S are immediate.

### Images load slowly

**Solution:**
1. Ensure `R2_PUBLIC_URL` points to a Cloudflare custom domain (not the r2.dev URL).
2. Enable Cloudflare proxy (orange cloud) on your R2 custom domain.
3. Consider using Cloudflare Polish for automatic image optimization.

---

## 9. Docker-Specific Issues

### "Cannot find module" after npm install

**Solution:** The `node_modules` volume may be stale:

```bash
docker compose down
docker volume rm openpost_node_modules
docker compose up -d --build
```

### Database connection refused from app container

**Solution:** Ensure the `db` container is healthy:

```bash
docker compose ps
docker compose logs db
```

### Container keeps restarting

**Solution:** Check the logs:

```bash
docker compose logs -f app
```

Common causes:
- Missing environment variables
- Database not ready
- Port 3000 already in use

---

## 10. Common Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| `401 UNAUTHORIZED` | Not authenticated | Log in again, check session |
| `403 FORBIDDEN` | Authenticated but not authorized | Check role and project membership |
| `404 NOT_FOUND` | Resource doesn't exist | Check the ID/slug, verify project scope |
| `409 CONFLICT` | Duplicate resource | Slug already exists in this project |
| `429 TOO_MANY_REQUESTS` | Rate limited | Wait and retry |
| `500 INTERNAL_SERVER_ERROR` | Server error | Check server logs |

---

## Need Further Help?

- **Email:** [officialopenpost@outlook.com](mailto:officialopenpost@outlook.com) — we reply within 24 hours
- **GitHub:** [github.com/OfficialOpenPost/OpenPost](https://github.com/OfficialOpenPost/OpenPost)
- **API Reference:** [/docs/api/overview](/docs/api/overview)
