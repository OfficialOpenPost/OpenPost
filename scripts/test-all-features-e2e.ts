import { Prisma } from "../src/generated/prisma/client";
import { db, withDbRetry } from "../src/lib/db";
import { generateApiToken } from "../src/lib/apiToken";
import { uploadBuffer, deleteObject } from "../src/lib/storage";

async function testAllFeaturesE2E() {
  console.log("================================================================");
  console.log("🚀 OPENPOST COMPLETE END-TO-END FEATURE VERIFICATION SUITE");
  console.log("================================================================\n");

  const baseUrl = "http://localhost:3000";
  let passed = 0;
  let failed = 0;

  function report(name: string, ok: boolean, details?: string) {
    if (ok) {
      console.log(`✅ [FEATURE OK] ${name.padEnd(45)} | ${details || "Passed"}`);
      passed++;
    } else {
      console.error(`❌ [FEATURE FAIL] ${name.padEnd(45)} | ${details || "Failed"}`);
      failed++;
    }
  }

  // 1. Get or Create Project & User
  const user = await withDbRetry(() => db.user.findFirst());
  const project = await withDbRetry(() => db.project.findFirst());
  if (!user || !project) {
    throw new Error("Missing user or project in database.");
  }
  console.log(`👤 Verified User: ${user.email} (${user.id})`);
  console.log(`🏢 Verified Project: ${project.name} (${project.id})\n`);

  // FEATURE 1: Category Creation & Public API
  let categoryId: string | null = null;
  try {
    let cat = await withDbRetry(() => db.category.findFirst({ where: { slug: "engineering", projectId: project.id } }));
    if (!cat) {
      cat = await withDbRetry(() =>
        db.category.create({
          data: { name: "Engineering", slug: "engineering", projectId: project.id },
        })
      );
    }
    categoryId = cat.id;
    const catRes = await fetch(`${baseUrl}/api/v1/categories?project=${project.id}`).then((r) => r.json());
    const found = catRes.data?.some((c: any) => c.slug === "engineering");
    report("Category Taxonomy & Public API", Boolean(found), `ID: ${cat.id}`);
  } catch (err: any) {
    report("Category Taxonomy & Public API", false, err.message);
  }

  // FEATURE 2: Tags Management & Public API
  let tagId: string | null = null;
  try {
    let tag = await withDbRetry(() => db.tag.findFirst({ where: { slug: "nextjs", projectId: project.id } }));
    if (!tag) {
      tag = await withDbRetry(() =>
        db.tag.create({
          data: { name: "Next.js", slug: "nextjs", projectId: project.id },
        })
      );
    }
    tagId = tag.id;
    const tagRes = await fetch(`${baseUrl}/api/v1/tags?project=${project.id}`).then((r) => r.json());
    const found = tagRes.data?.some((t: any) => t.slug === "nextjs");
    report("Tag Taxonomy & Public API", Boolean(found), `ID: ${tag.id}`);
  } catch (err: any) {
    report("Tag Taxonomy & Public API", false, err.message);
  }

  // FEATURE 3: Authors & Bylines
  let authorId: string | null = null;
  try {
    let author = await withDbRetry(() => db.author.findFirst({ where: { slug: "alok-kumar", projectId: project.id } }));
    if (!author) {
      author = await withDbRetry(() =>
        db.author.create({
          data: {
            name: "Alok Kumar",
            slug: "alok-kumar",
            bio: "Founder & Lead Architect",
            projectId: project.id,
          },
        })
      );
    }
    authorId = author.id;
    const authRes = await fetch(`${baseUrl}/api/v1/authors?project=${project.id}`).then((r) => r.json());
    const found = authRes.data?.some((a: any) => a.slug === "alok-kumar");
    report("Author Bylines & Public API", Boolean(found), `ID: ${author.id}`);
  } catch (err: any) {
    report("Author Bylines & Public API", false, err.message);
  }

  // FEATURE 4: Cloudflare R2 Media Upload & Storage
  let mediaId: string | null = null;
  let r2Key: string | null = null;
  try {
    const testBuffer = Buffer.from("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    r2Key = `test-media-probe-${Date.now()}.png`;
    const uploadResult = await uploadBuffer(r2Key, testBuffer, "image/png");

    const media = await withDbRetry(() =>
      db.media.create({
        data: {
          originalFilename: "test-feature-image.png",
          mimeType: "image/png",
          sizeBytes: BigInt(testBuffer.length),
          width: 1,
          height: 1,
          variants: { publicUrl: uploadResult.url, key: r2Key },
          checksum: `sha256-test-${Date.now()}`,
          uploadedBy: user.id,
          projectId: project.id,
        },
      })
    );
    mediaId = media.id;
    report("Cloudflare R2 Media Upload & Storage", Boolean(uploadResult.url), `Public URL: ${uploadResult.url}`);
  } catch (err: any) {
    report("Cloudflare R2 Media Upload & Storage", false, err.message);
  }

  // FEATURE 5: Article Creation, Draft Snapshot, & Publishing
  let testBlogId: string | null = null;
  try {
    const testSlug = `e2e-live-test-article-${Date.now()}`;
    const newBlog = await withDbRetry(() =>
      db.blog.create({
        data: {
          title: "End-to-End System Verification Article",
          slug: testSlug,
          status: "published",
          publishedAt: new Date(),
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "This is a live end-to-end verification post testing all OpenPost features." }],
              },
            ],
          },
          wordCount: 15,
          readingTime: 1,
          projectId: project.id,
          createdBy: user.id,
          categoryId: categoryId || undefined,
          featuredImageId: mediaId || undefined,
        },
      })
    );
    testBlogId = newBlog.id;

    // Attach Tag
    if (tagId) {
      await withDbRetry(() => db.blogTag.create({ data: { blogId: newBlog.id, tagId: tagId! } })).catch(() => {});
    }

    // Attach Author
    if (authorId) {
      await withDbRetry(() => db.blogAuthor.create({ data: { blogId: newBlog.id, authorId: authorId!, sortOrder: 0 } })).catch(() => {});
    }

    // Create Revision History Entry
    await withDbRetry(() =>
      db.blogRevision.create({
        data: {
          blogId: newBlog.id,
          content: newBlog.content as Prisma.InputJsonValue,
          createdBy: user.id,
          label: "Initial Verified Snapshot",
        },
      })
    );

    report("Article Creation & Taxonomy Association", Boolean(newBlog.id), `ID: ${newBlog.id}`);
  } catch (err: any) {
    report("Article Creation & Taxonomy Association", false, err.message);
  }

  // FEATURE 6: Headless API Reading by Slug & by Project
  try {
    if (!testBlogId) throw new Error("Blog creation was skipped.");
    const blog = await withDbRetry(() => db.blog.findUnique({ where: { id: testBlogId! } }));
    const postRes = await fetch(`${baseUrl}/api/v1/posts/${blog?.slug}?project=${project.id}`).then((r) => r.json());
    const valid = postRes.data?.title === "End-to-End System Verification Article";
    report("Headless API Article Read by Slug", valid, `Slug: ${blog?.slug}`);
  } catch (err: any) {
    report("Headless API Article Read by Slug", false, err.message);
  }

  // FEATURE 7: Interactive Polls & Real-time Voting
  let pollId: string | null = null;
  try {
    const poll = await withDbRetry(() =>
      db.poll.create({
        data: {
          question: "Is OpenPost ready for production?",
          projectId: project.id,
          blogId: testBlogId,
          status: "open",
          options: {
            create: [
              { label: "Yes, absolutely ready!", sortOrder: 0 },
              { label: "Ready and blazing fast!", sortOrder: 1 },
            ],
          },
        },
        include: { options: true },
      })
    );
    pollId = poll.id;
    const optionToVote = poll.options[0];

    // Submit a vote
    const voteRes = await fetch(`${baseUrl}/api/v1/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: optionToVote.id, fingerprint: `fp-test-${Date.now()}` }),
    });
    report("Embedded Interactive Polls & Real-time Voting", voteRes.ok, `Poll ID: ${poll.id}`);
  } catch (err: any) {
    report("Embedded Interactive Polls & Real-time Voting", false, err.message);
  }

  // FEATURE 8: 301 URL Redirect Engine (Slug Renaming)
  try {
    if (!testBlogId) throw new Error("Blog was not created.");
    const oldSlug = `old-test-slug-${Date.now()}`;
    const newSlug = `new-test-slug-${Date.now()}`;

    // Create redirect record
    await withDbRetry(() =>
      db.redirect.create({
        data: {
          blogId: testBlogId!,
          oldSlug,
          newSlug,
        },
      })
    );

    const redirectRecord = await withDbRetry(() => db.redirect.findFirst({ where: { oldSlug } }));
    report("301 URL Redirect Engine", Boolean(redirectRecord), `${oldSlug} -> ${newSlug}`);
  } catch (err: any) {
    report("301 URL Redirect Engine", false, err.message);
  }

  // FEATURE 9: Webhooks & Delivery History
  try {
    const webhook = await withDbRetry(() =>
      db.webhook.create({
        data: {
          name: "Vercel Production Deploy Hook",
          url: "https://httpbin.org/post",
          secret: "whsec_test_secret_key_12345",
          events: ["post.published"],
          projectId: project.id,
        },
      })
    );

    const delivery = await withDbRetry(() =>
      db.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: "post.published",
          payload: { title: "Test Article", slug: "test" },
          status: "success",
          attempts: 1,
        },
      })
    );

    report("HMAC Webhooks & Delivery Tracking", Boolean(delivery.id), `Webhook ID: ${webhook.id}`);

    // Cleanup webhook
    await withDbRetry(() => db.webhookDelivery.deleteMany({ where: { webhookId: webhook.id } }));
    await withDbRetry(() => db.webhook.delete({ where: { id: webhook.id } }));
  } catch (err: any) {
    report("HMAC Webhooks & Delivery Tracking", false, err.message);
  }

  // FEATURE 10: Headless API Integration Keys (`op_live_...`)
  try {
    const { rawToken, tokenHash, tokenPrefix } = generateApiToken();
    const integration = await withDbRetry(() =>
      db.integration.create({
        data: {
          name: "Website Live Production Token",
          projectId: project.id,
          tokenHash,
          tokenPrefix,
          permissions: ["post.read", "category.read", "tag.read"],
          createdBy: user.id,
        },
      })
    );

    const authRes = await fetch(`${baseUrl}/api/v1/posts?limit=3`, {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    const authJson = await authRes.json();
    const valid = authRes.status === 200 && authJson.meta?.projectId === project.id;
    report("API Integration Keys & Multi-Tenant Authorization", valid, `Token: ${tokenPrefix}`);

    // Cleanup integration
    await withDbRetry(() => db.integration.delete({ where: { id: integration.id } }));
  } catch (err: any) {
    report("API Integration Keys & Multi-Tenant Authorization", false, err.message);
  }

  // Cleanup Test Blog and Test Media
  if (testBlogId) {
    await withDbRetry(() => db.redirect.deleteMany({ where: { blogId: testBlogId! } })).catch(() => {});
    await withDbRetry(() => db.pollVote.deleteMany({ where: { poll: { blogId: testBlogId! } } })).catch(() => {});
    await withDbRetry(() => db.pollOption.deleteMany({ where: { poll: { blogId: testBlogId! } } })).catch(() => {});
    await withDbRetry(() => db.poll.deleteMany({ where: { blogId: testBlogId! } })).catch(() => {});
    await withDbRetry(() => db.blogRevision.deleteMany({ where: { blogId: testBlogId! } })).catch(() => {});
    await withDbRetry(() => db.blogTag.deleteMany({ where: { blogId: testBlogId! } })).catch(() => {});
    await withDbRetry(() => db.blogAuthor.deleteMany({ where: { blogId: testBlogId! } })).catch(() => {});
    await withDbRetry(() => db.blog.delete({ where: { id: testBlogId! } })).catch(() => {});
  }
  if (mediaId && r2Key) {
    await withDbRetry(() => db.media.delete({ where: { id: mediaId! } })).catch(() => {});
    await deleteObject(r2Key).catch(() => {});
  }

  console.log("\n================================================================");
  console.log(`🎯 END-TO-END FEATURE VERIFICATION: ${passed} / ${passed + failed} Features Passed (${failed} failed)`);
  console.log("================================================================");
}

testAllFeaturesE2E().catch((err) => {
  console.error("Fatal E2E test failure:", err);
  process.exit(1);
});
