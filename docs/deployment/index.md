# Deployment & Self-Hosting Guide

OpenPost can be deployed effortlessly to managed serverless platforms like **Vercel** or self-hosted on your own Linux VPS / Kubernetes cluster using **Docker**.

---

## 1. Deploying to Vercel (Recommended)

Vercel provides zero-configuration Next.js deployments, global edge caching, and serverless scalability.

### Step 1: Push to GitHub
Push your OpenPost repository to your GitHub account:

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
# Use Supabase Transaction/Session pooler URL on port 6543 for serverless environments
DATABASE_URL="postgresql://postgres.ref:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://yourref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXT_PUBLIC_APP_URL="https://yourdomain.vercel.app"
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"
CRON_SECRET="your-32-char-random-secret"
```

> **Note on Scheduled Publishing:** OpenPost includes a pre-configured `vercel.json` with a 1-minute cron triggering `/api/cron/publish`. When `CRON_SECRET` is set in your Vercel Environment Variables, Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` to securely run scheduled publishing.

### Step 4: Deploy
Click **Deploy**. Vercel will run `prisma generate` and `next build` to launch your instance globally with zero downtime.

---

## 2. Self-Hosting with Docker Compose

For complete data sovereignty on your own VPS (DigitalOcean, Hetzner, AWS EC2, or Linode), use Docker Compose.

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
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:dbpassword@db:5432/openpost?schema=public
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET_NAME=${R2_BUCKET_NAME}
      - R2_PUBLIC_URL=${R2_PUBLIC_URL}
      - CRON_SECRET=${CRON_SECRET}
    command: sh -c "npm install && npx prisma db push && npm run build && npm start"
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: openpost-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dbpassword
      POSTGRES_DB: openpost
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

### Starting the Stack

```bash
docker compose up -d
```

Check the container logs:

```bash
docker compose logs -f app
```

---

## 3. Production Hardening Checklist

- [ ] Enable **HTTPS / SSL** on your custom domain via Cloudflare or Let's Encrypt.
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are never exposed in client bundles.
- [ ] Configure the [Scheduled Posts Cron](/docs/api/cron-health) to automatically publish queued posts.
- [ ] Set up custom domain CNAME records for Cloudflare R2 media.
