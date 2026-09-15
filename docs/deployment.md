# Deployment & Self-Hosting Guide

OpenPost can be deployed to managed serverless platforms like **Vercel** or self-hosted on your own Linux VPS using **Docker**.

---

## 1. Deploying to Vercel (Recommended)

Vercel provides zero-configuration Next.js deployments, global edge caching, and serverless scalability.

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure OpenPost instance"
git push origin main
```

### Step 2: Import Project in Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Select your `OpenPost` GitHub repository.
3. Framework Preset: **Next.js**.

### Step 3: Add Environment Variables

In the Vercel project configuration, add your production environment variables:

```env
# Supabase Transaction/Session pooler URL (port 6543 for serverless)
DATABASE_URL="postgresql://postgres.ref:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://yourref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# App URL
NEXT_PUBLIC_APP_URL="https://yourdomain.vercel.app"

# Cloudflare R2
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"

# Cron Secret (for scheduled publishing)
CRON_SECRET="your-32-char-random-secret"

# Optional
REQUIRE_EMAIL_VERIFICATION="true"
BOOTSTRAP_ADMIN_EMAIL="admin@yourdomain.com"
BOOTSTRAP_ADMIN_PASSWORD="StrongPassword123"
```

### Step 4: Deploy

Click **Deploy**. Vercel runs `prisma generate` and `next build` automatically.

### Scheduled Publishing

OpenPost includes `vercel.json` with a cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "0 0 * * *"
    }
  ]
}
```

- **Hobby tier**: Limited to `0 0 * * *` (daily). Use [cron-job.org](https://cron-job.org) or GitHub Actions for per-minute checks.
- **Pro tier**: Change to `* * * * *` for per-minute publishing.

The cron endpoint requires `Authorization: Bearer <CRON_SECRET>` header.

---

## 2. Self-Hosting with Docker Compose

For complete data sovereignty on your own VPS (DigitalOcean, Hetzner, AWS EC2, Linode).

### Production `compose.yml`

```yaml
version: "3.8"

services:
  app:
    image: node:20-alpine
    container_name: openpost-app
    restart: always
    working_dir: /app
    volumes:
      - ./:/app
      - node_modules:/app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/openpost?schema=public
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET_NAME=${R2_BUCKET_NAME}
      - R2_PUBLIC_URL=${R2_PUBLIC_URL}
      - CRON_SECRET=${CRON_SECRET}
    command: sh -c "npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npm start"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s

  db:
    image: postgres:15-alpine
    container_name: openpost-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: openpost
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  node_modules:
  pgdata:
```

### `.env` file for Docker

```env
POSTGRES_PASSWORD=your-strong-db-password
NEXT_PUBLIC_SUPABASE_URL=https://yourref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=openpost-media
R2_PUBLIC_URL=https://media.yourdomain.com
CRON_SECRET=your-32-char-random-secret
```

### Starting the Stack

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f app

# Check health
curl http://localhost:3000/api/health

# Stop
docker compose down

# Stop and remove volumes (DESTROYS DATA)
docker compose down -v
```

### First-Time Setup

After the containers are running:

1. Open `http://localhost:3000/setup` to create the initial OWNER account.
2. Or use the CLI: `npx openpost-cli bootstrap --email admin@example.com --password StrongPass123`.

---

## 3. Self-Hosting Without Docker (Manual)

On a Linux VPS with Node.js 18+ installed:

```bash
# Clone the repository
git clone https://github.com/OfficialOpenPost/OpenPost.git
cd OpenPost

# Install dependencies
npm ci

# Set up environment
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Build for production
npm run build

# Start the server
npm start
```

### Running as a Service (systemd)

Create `/etc/systemd/system/openpost.service`:

```ini
[Unit]
Description=OpenPost CMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/openpost
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable openpost
sudo systemctl start openpost
```

---

## 4. Reverse Proxy (Nginx)

For production deployments with custom domains:

```nginx
server {
    listen 80;
    server_name cms.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cms.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/cms.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

---

## 5. Cloudflare R2 Media Setup

1. Create an R2 bucket in Cloudflare Dashboard.
2. Generate an API token with **Object Read & Write** permissions.
3. Set up a custom domain for public media access (e.g., `media.yourdomain.com`).
4. Add a CORS policy to the bucket:

```json
[
  {
    "AllowedOrigins": ["https://cms.yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 6. Supabase Setup

1. Create a new Supabase project.
2. Go to **Settings → Database** and copy the connection string.
3. For Vercel/serverless: Use the **Transaction Pooler** on port `6543`.
4. For Docker/self-hosted: Use the direct connection on port `5432`.
5. Run the migration files in order from `supabase/migrations/` via the SQL Editor.
6. Go to **Authentication → Providers** and enable Email/Password.

---

## 7. Cron Scheduler Setup

OpenPost needs a cron job to publish scheduled posts. Options:

### Option A: Vercel Cron (Recommended for Vercel)
Already configured in `vercel.json`. See Section 1.

### Option B: cron-job.org (Free)
1. Create a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job:
   - URL: `https://yourdomain.com/api/cron/publish`
   - Method: `POST`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Every minute

### Option C: GitHub Actions
```yaml
name: Publish Scheduled Posts
on:
  schedule:
    - cron: '* * * * *'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Publish
        run: |
          curl -X POST https://yourdomain.com/api/cron/publish \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 8. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | Optional | Direct DB connection (bypasses pooler) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of your OpenPost instance |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | ✅ | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 API secret key |
| `R2_BUCKET_NAME` | ✅ | R2 bucket name |
| `R2_PUBLIC_URL` | ✅ | Public URL for R2 media |
| `CRON_SECRET` | ✅ | Secret for cron endpoint auth |
| `REQUIRE_EMAIL_VERIFICATION` | Optional | Set `true` to require email verification |
| `BOOTSTRAP_ADMIN_EMAIL` | Optional | Auto-create admin on first run |
| `BOOTSTRAP_ADMIN_PASSWORD` | Optional | Password for bootstrap admin |

---

## 9. Production Hardening Checklist

- [ ] Enable **HTTPS/SSL** via Cloudflare or Let's Encrypt
- [ ] Set strong `POSTGRES_PASSWORD` (20+ characters)
- [ ] Set strong `CRON_SECRET` (32+ random characters)
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is never in client bundles
- [ ] Configure R2 CORS policy for your domains only
- [ ] Set up automated database backups (Supabase handles this)
- [ ] Configure monitoring (health endpoint: `/api/health`)
- [ ] Set `REQUIRE_EMAIL_VERIFICATION=true` in production
- [ ] Remove or disable `/setup` after initial admin creation
- [ ] Review and remove any test/demo data

---

## 10. Updating OpenPost

```bash
# Pull latest changes
git pull origin main

# Install updated dependencies
npm ci

# Regenerate Prisma client
npx prisma generate

# Push any schema changes (safe, additive only)
npx prisma db push

# Rebuild
npm run build

# Restart the server
# If using Docker:
docker compose up -d --build
# If using systemd:
sudo systemctl restart openpost
# If using Vercel:
# Just push to git — Vercel auto-deploys
```

---

## 11. Backup & Recovery

### Database Backup (Supabase)
Supabase provides automatic daily backups. For manual backups:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
psql $DATABASE_URL < backup_20250115.sql
```

### Media Backup (R2)
Use `rclone` or the Cloudflare CLI to sync your R2 bucket:

```bash
rclone sync r2:openpost-media ./backup-media
```
