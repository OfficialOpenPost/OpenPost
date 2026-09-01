# Cron & Health Checks API Reference

Manage background publishing automation and monitor system availability.

---

## 1. Scheduled Post Publishing Cron

`GET /api/cron/publish`

Queries the database for all blog posts where `status = 'scheduled'` and `scheduledAt <= NOW()`. For each matching post, it:
1. Updates the status to `published`.
2. Sets `publishedAt` to the current timestamp.
3. Automatically triggers configured **Webhooks** (sending `post.publish` events to downstream frontends or deploy hooks).

### Authentication
If `CRON_SECRET` is set in your `.env`, this endpoint requires a Bearer token:

```bash
curl -X GET "https://your-openpost-domain.com/api/cron/publish" \
  -H "Authorization: Bearer your-cron-secret-here"
```

### Example Response (`200 OK`)

```json
{
  "success": true,
  "publishedCount": 2,
  "posts": [
    {
      "id": "7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
      "title": "Announcing Product 2.0",
      "slug": "announcing-product-2-0",
      "publishedAt": "2026-09-01T15:00:00.000Z"
    }
  ],
  "timestamp": "2026-09-01T15:00:02.140Z"
}
```

---

## Setting Up the Publishing Cron

### Option A: Vercel Cron (Recommended for Vercel)
Add a `crons` entry to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option B: GitHub Actions Workflow
Create `.github/workflows/publish-cron.yml`:

```yaml
name: Publish Scheduled Posts
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger OpenPost Cron
        run: |
          curl -s -X GET "https://your-openpost-domain.com/api/cron/publish" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option C: Linux Crontab (Self-Hosted)

```bash
*/5 * * * * curl -s -X GET "https://your-openpost-domain.com/api/cron/publish" -H "Authorization: Bearer your-cron-secret" > /dev/null 2>&1
```

---

## 2. System Health Check

`GET /api/health`

Performs an availability probe to verify that the server is online.

### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/health"
```

### Example Response (`200 OK`)

```json
{
  "status": "healthy",
  "timestamp": "2026-09-01T15:00:00.000Z",
  "uptimeSeconds": 86420,
  "version": "1.0.0"
}
```
