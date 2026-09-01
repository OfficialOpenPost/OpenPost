import { createOpenPostClient } from "../../../lib/openpost/client";
import { notFound } from "next/navigation";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = createOpenPostClient({
    url: process.env.OPENPOST_URL!,
    token: process.env.OPENPOST_TOKEN!,
    projectId: process.env.OPENPOST_PROJECT_ID!,
  });
  const post = await client.posts.getBySlug(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="mt-2 text-sm text-gray-500">/{post.slug} · {post.status}</p>
      <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: post.content?.html ?? "" }} />
    </div>
  );
}
