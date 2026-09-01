import { db } from "../src/lib/db";
import { getS3Client, uploadBuffer, deleteObject, getPublicUrl } from "../src/lib/storage";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "../src/lib/env";

async function main() {
  console.log("==================================================");
  console.log("🔍 OPENPOST SYSTEM CONNECTION & INTEGRITY AUDIT");
  console.log("==================================================\n");

  // 1. SUPABASE POSTGRES CONNECTION TEST
  console.log("1️⃣ Testing Supabase / Postgres Database Connection...");
  try {
    const userCount = await db.user.count();
    const blogCount = await db.blog.count();
    const publishedBlogCount = await db.blog.count({ where: { status: "published" } });
    const categoryCount = await db.category.count();
    const tagCount = await db.tag.count();
    const mediaCount = await db.media.count();
    const projectCount = await db.project.count();

    console.log("   ✅ Supabase DB Connection: SUCCESSFUL!");
    console.log(`      • Users in DB: ${userCount}`);
    console.log(`      • Projects in DB: ${projectCount}`);
    console.log(`      • Total Blogs: ${blogCount} (${publishedBlogCount} published)`);
    console.log(`      • Categories: ${categoryCount}`);
    console.log(`      • Tags: ${tagCount}`);
    console.log(`      • Media Items: ${mediaCount}`);
  } catch (err: any) {
    console.error("   ❌ Supabase DB Connection FAILED:", err.message);
  }

  console.log("\n2️⃣ Testing Cloudflare R2 Storage Connection...");
  const s3 = getS3Client();
  const bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;

  if (!s3 || !bucket) {
    console.warn("   ⚠️ Cloudflare R2 Credentials missing or incomplete in .env:");
    console.log(`      • R2_ACCOUNT_ID: ${Boolean(process.env.R2_ACCOUNT_ID)}`);
    console.log(`      • R2_ACCESS_KEY_ID: ${Boolean(process.env.R2_ACCESS_KEY_ID)}`);
    console.log(`      • R2_SECRET_ACCESS_KEY: ${Boolean(process.env.R2_SECRET_ACCESS_KEY)}`);
    console.log(`      • R2_BUCKET_NAME: ${bucket || "NOT SET"}`);
    console.log(`      • R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL || "NOT SET"}`);
  } else {
    try {
      console.log(`   • S3 Endpoint configured, testing bucket "${bucket}"...`);
      const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }));
      console.log("   ✅ Cloudflare R2 Connection: SUCCESSFUL!");
      console.log(`      • Bucket contents count sampled: ${listRes.KeyCount ?? 0}`);

      // Test upload and delete of a temporary test probe
      const testKey = `openpost-media/test-probe-${Date.now()}.txt`;
      const testBuffer = Buffer.from("OpenPost R2 Probe Test");
      console.log(`   • Testing upload probe: ${testKey}...`);
      const uploadRes = await uploadBuffer(testKey, testBuffer, "text/plain");
      console.log(`   ✅ Probe Uploaded! Public URL: ${uploadRes.url}`);

      console.log(`   • Testing delete probe...`);
      await deleteObject(testKey);
      console.log(`   ✅ Probe Deleted successfully from R2!`);
    } catch (r2Err: any) {
      console.error("   ❌ Cloudflare R2 Connection FAILED:", r2Err.message);
    }
  }

  console.log("\n==================================================");
  console.log("🎯 CONNECTION AUDIT COMPLETED");
  console.log("==================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during audit:", err);
  process.exit(1);
});
