import { createOpenPostClient } from "../../lib/openpost/client";

export default async function BlogPage() {
  const client = createOpenPostClient({
    url: process.env.OPENPOST_URL!,
    token: process.env.OPENPOST_TOKEN!,
    projectId: process.env.OPENPOST_PROJECT_ID!,
  });
  const { data: posts } = await client.posts.list({ limit: 10 });

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold">Blog</h1>
      <div className="mt-6 space-y-4">
        {posts?.map((p: any) => (
          <a key={p.id} href={`/blog/${p.slug}`} className="block border rounded p-4 hover:bg-gray-50">
            <h2 className="font-bold">{p.title}</h2>
            <p className="text-sm text-gray-500">/{p.slug}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
