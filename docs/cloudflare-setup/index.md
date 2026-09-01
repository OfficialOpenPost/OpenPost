# Cloudflare R2 Media Storage Setup

OpenPost stores all uploaded media (blog featured images, in-article screenshots, author avatars, and downloadable assets) in **Cloudflare R2**.

Cloudflare R2 provides an S3-compatible API with **zero egress bandwidth fees**, making it extremely cost-effective for media-heavy blogs.

---

## 1. Create an R2 Bucket

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Click **R2 Object Storage** in the left sidebar.
3. Click **Create bucket**.
4. Name your bucket: `openpost-media` (or any custom name).
5. Set the location hint to **Automatic** or your nearest region (e.g. `APAC`, `EEUR`, `WNAM`).
6. Click **Create bucket**.

Inside your new bucket:
- Click **Create folder**.
- Name the folder: `Openpost-images`.
- Click **Create**.

---

## 2. Set Up a Custom Domain or Public URL

To serve images directly to website visitors with fast Cloudflare edge caching, enable a public domain:

1. Click your bucket → **Settings** tab.
2. Scroll to **Custom Domains** and click **Connect Domain**.
3. Enter your media subdomain (e.g. `media.yourdomain.com` or `cdn.yourdomain.com`).
4. Click **Continue** and confirm DNS record creation.

> [!TIP] Public Development URL
> You can also enable the **Public Development URL** (e.g. `https://pub-7091xxx.r2.dev`). This allows you to test media uploads instantly without having a custom domain configured.

Set the public URL in your `.env` file (ensure there is **no trailing slash**):

```env
R2_BUCKET_NAME=openpost-media
R2_PUBLIC_URL=https://media.yourdomain.com
```

---

## 3. Configure CORS Policy

To allow browsers to upload images directly to R2 from your local dev environment (`localhost:3000`) and production domain, you must add a CORS policy.

1. Go to Bucket → **Settings** tab.
2. Scroll to **CORS Policy** → Click **Add CORS Policy**.
3. Paste the following JSON policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "https://media.yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

4. Click **Save**.

---

## 4. Generate S3-Compatible API Tokens

To allow the OpenPost server to generate presigned upload URLs and delete files:

1. Go to Cloudflare Dashboard → **R2 Object Storage**.
2. In the right panel, click **Manage R2 API Tokens**.
3. Click **Create API Token**.
4. Set Token Name: `openpost-token`.
5. Permissions: **Object Read & Write**.
6. Bucket scope: Select your bucket `openpost-media`.
7. TTL: Leave blank for perpetual or set as desired.
8. Click **Create API Token**.

Copy the generated credentials and add them to `.env`:

```env
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
```

---

## 5. Automatic Client-Side WebP Optimization

When you drag and drop an image into the OpenPost Writing Studio or Media Library:
1. OpenPost's browser worker intercepts the raw image (`.png`, `.jpeg`, `.tiff`).
2. It scales down ultra-large dimensions and converts the image to modern **WebP format** at `0.82` quality.
3. The compressed image is uploaded to `Openpost-images/[checksum]-[timestamp].webp`.
4. Image dimensions (`width`, `height`), mime type, and file size are stored in the database for layout shift (CLS) prevention.

---

## 6. Verification

1. Start your local server: `npm run dev`.
2. Go to **Dashboard → Media** (`/dashboard/media`).
3. Drag and drop any image into the upload dropzone.
4. Verify that the image card appears with a preview thumbnail.
5. Right-click the image and open the URL in a new tab:
   ```
   https://media.yourdomain.com/Openpost-images/1709849204-header.webp
   ```
6. The image should load instantly with HTTP `200 OK`.
