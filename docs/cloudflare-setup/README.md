# Cloudflare R2 Setup — for OpenPost Media

OpenPost stores all uploads (images, PDFs, video posters) in **Cloudflare R2** (S3-compatible, free egress via custom domain). This guide creates your own bucket + folder `Openpost-images` + domain `media.typely.in` so uploads go to *your* R2, not ours.

## 1. Create Bucket

1. https://dash.cloudflare.com → **R2 Object Storage** → **Create bucket**
2. Name: `openpost-media` (or any, but set `R2_BUCKET_NAME` to same)
3. Location: `APAC` (or closest) → **Create**

Inside the bucket, click **+ Create folder** → `Openpost-images` → **Create**. Leave it empty — first upload from `/dashboard/media` will appear here.

## 2. Custom Domain (for `https://media.typely.in/...` public URLs)

1. Bucket → **Settings** → **Custom Domains** → **Connect Domain**
2. Enter `media.typely.in` (or `cdn.yourdomain.com`) → **Continue** → Cloudflare adds DNS automatically
3. Wait until **Status: Active** (1–2 min). Keep **Public Development URL** `https://pub-7091…r2.dev` **Enabled** as fallback — it works even before custom domain.

Set in `.env` and Vercel/Netlify:
```env
R2_BUCKET_NAME=openpost-media
R2_PUBLIC_URL=https://media.typely.in   # exactly the Custom Domain https:// URL, no trailing slash, no /openpost-media
```

## 3. CORS (required for browser upload from localhost + production)

Bucket → **Settings** → **CORS Policy** → **Add CORS Policy** → paste:
```json
[
  {
    "AllowedOrigins": ["https://typely.in", "https://www.typely.in", "https://media.typely.in", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```
→ **Save** → wait 30s.

Without this, browser `POST https://<account>.r2.cloudflarestorage.com` is blocked → `Failed to fetch` → folder stays empty (we fallback to `blob:`).

## 4. API Token (for server upload)

1. R2 → **Manage R2 API Tokens** → **Create API Token**
2. Name: `openpost-media` → Permissions: **Object Read & Write** → Scope: **Apply to specific bucket → openpost-media** → **Create**
3. Copy **Access Key ID** → `R2_ACCESS_KEY_ID`, **Secret Access Key** → `R2_SECRET_ACCESS_KEY`, and top **Account ID** → `R2_ACCOUNT_ID` (32 hex, also in `S3 API: https://<account>.r2.cloudflarestorage.com/openpost-media`).

Set in `.env`:
```env
R2_ACCOUNT_ID=94219d85ba0cf03385c37bfd095c3839
R2_ACCESS_KEY_ID=d3e1ec2c3cd797ad73bb6cad81cefcdd
R2_SECRET_ACCESS_KEY=970af9be111dfdc0fe4ae3deb1dd03ba0e278549d4c7a7db91bb77a6b99250ea
```

## 5. Verify

```bash
git pull origin main
npx prisma generate
npm run dev
# login as devasishpalhkp@gmail.com → /dashboard/media → drag image
```
- `F12 → Network` → `POST https://<account>.r2.cloudflarestorage.com` → **204**
- R2 → `openpost-media/Openpost-images/` → new `.webp` appears
- Click it → `https://media.typely.in/Openpost-images/...webp` → **200** image (not 404)

If `404` → `R2_PUBLIC_URL` has extra `/openpost-media` path — remove it, keep only `https://media.typely.in`.
If `403` → token wrong bucket or `R2_ACCOUNT_ID` mismatch.
If `Failed to fetch` → CORS not saved or dev not restarted after `.env` change.
