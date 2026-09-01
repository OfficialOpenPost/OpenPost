# Troubleshooting & FAQs

This guide details common setup pitfalls, error codes, and step-by-step solutions for OpenPost CMS.

---

## 1. Supabase & Database Connection Issues

### Issue A: "Can't reach database server at `aws-0-xxx.pooler.supabase.com:6543`"
- **Cause**: Port `6543` is the Transaction Pooler, which requires a paid IPv4 addon if your network does not support IPv6.
- **Solution**: Use the **Session Pooler on Port `5432`** ($0 free IPv4 support).
  ```env
  # Correct: Port 5432
  DATABASE_URL="postgresql://postgres.ref:password@aws-0-region.pooler.supabase.com:5432/postgres"
  ```

### Issue B: "Invalid database password / Authentication failed"
- **Cause**: Special characters in your password (like `@`, `#`, `$`, `%`) break URI parsing.
- **Solution**: URL-encode special characters in your `DATABASE_URL`:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

---

## 2. Cloudflare R2 & Media Upload Errors

### Issue A: "CORS error / Failed to fetch on upload"
- **Cause**: Your R2 bucket lacks a CORS policy for `localhost:3000` or your production domain.
- **Solution**: In Cloudflare Dashboard → R2 → Bucket → **Settings** → **CORS Policy**, add:
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

### Issue B: "Image URL returns 404 Not Found"
- **Cause**: `R2_PUBLIC_URL` has an extra bucket path appended.
- **Solution**: Ensure `R2_PUBLIC_URL` contains only the domain name with no trailing slash and no bucket path:
  ```env
  # Correct:
  R2_PUBLIC_URL=https://media.yourdomain.com
  # Incorrect:
  R2_PUBLIC_URL=https://media.yourdomain.com/openpost-media/
  ```

### Issue C: "403 Forbidden on upload"
- **Cause**: The R2 API token does not have Object Read & Write permissions on the selected bucket.
- **Solution**: Re-generate the API token in Cloudflare with **Object Read & Write** permissions scoped to your bucket.

---

## 3. User Signups & Foreign Key Constraints

### Issue: "insert or update on table 'media' violates foreign key constraint `media_uploaded_by_fkey`"
- **Cause**: The logged-in user signed up via Supabase Auth, but their record has not been approved in the `profiles` table or synced to `users`.
- **Solution**: In your Supabase **SQL Editor**, run the following SQL query:
  ```sql
  UPDATE profiles SET status = 'approved' WHERE email = 'your-email@domain.com';
  UPDATE users SET role = 'admin' WHERE email = 'your-email@domain.com';
  ```

---

## 4. Build & Deployment Questions

### Question: "Will `npm run build` fail in CI/CD without a live database?"
- **Answer**: No! OpenPost is designed with a resilient build architecture. All static generation paths gracefully fall back to mock data during `npm run build`, ensuring CI/CD pipelines succeed even before your production database is connected.

---

## Need Further Help?

- Open an issue on our [GitHub Repository](https://github.com/OfficialOpenPost/OpenPost).
- Check our [API Reference](/docs/api/overview) for endpoint documentation.
