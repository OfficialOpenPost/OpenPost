import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await db.author.findFirst({ where: { slug } }).catch(() => null);
  if (!author) return { title: "Author not found" };
  const title = `${author.name} — Author Archive`;
  const description = author.bio?.slice(0, 155) || `Posts by ${author.name}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [],
    },
    alternates: { canonical: `/authors/${author.slug}` },
  };
}

export default async function AuthorArchivePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || "1", 10) || 1);
  const take = 12;
  const skip = (page - 1) * take;

  const author = await db.author.findFirst({
    where: { slug },
    include: {
      photo: { select: { variants: true } },
    },
  }).catch(() => null);

  if (!author) notFound();

  const where: any = {
    status: "published",
    authors: { some: { authorId: author!.id } },
  };

  const [posts, total] = await Promise.all([
    db.blog.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        readingTime: true,
        wordCount: true,
        featuredImage: { select: { variants: true } },
        category: { select: { name: true, slug: true } },
      },
    }).catch(() => []),
    db.blog.count({ where }).catch(() => 0),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));
  const social = (author!.socialLinks as any) || {};

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link href="/blog" className="text-sm text-brand hover:underline">← Back to Blog</Link>

      <div className="mt-6 flex gap-6 items-start border border-border rounded-2xl p-6 bg-white">
        {author!.photo ? (
          <img src={(author!.photo.variants as any)?.publicUrl || ""} alt={author!.name} className="h-20 w-20 rounded-2xl object-cover border border-border" />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand to-orange text-white flex items-center justify-center font-bold text-xl">
            {author!.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-navy">{author!.name}</h1>
          <p className="font-mono text-xs text-brand">/{author!.slug}</p>
          {author!.bio && <p className="mt-3 text-sm text-text-secondary">{author!.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {author!.website && <a href={author!.website} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline"><span>↗</span> {author!.website}</a>}
            {social.twitter && <span className="rounded-full bg-surface-raised px-2 py-1">𝕏 {social.twitter}</span>}
            {social.linkedin && <span className="rounded-full bg-surface-raised px-2 py-1">in {social.linkedin}</span>}
            {author!.email && <span className="text-text-tertiary">{author!.email}</span>}
          </div>
          <p className="mt-3 text-xs text-text-tertiary">{total} published {total === 1 ? "post" : "posts"}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {posts.map((p: any) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="rounded-2xl border border-border bg-white p-5 hover:border-brand/20 hover:shadow-md transition">
            {p.featuredImage && <img src={(p.featuredImage.variants as any)?.publicUrl || ""} alt="" className="h-36 w-full object-cover rounded-xl mb-3" />}
            <h3 className="font-bold text-navy line-clamp-2">{p.title}</h3>
            <p className="mt-1 text-xs text-text-tertiary">{p.category?.name ? `${p.category.name} • ` : ""}{p.readingTime} min • {new Date(p.publishedAt!).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
      {posts.length === 0 && <p className="mt-10 text-center text-sm text-text-tertiary">No published posts by this author yet.</p>}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/authors/${slug}?page=${n}`}
              className={`h-9 w-9 flex items-center justify-center rounded-xl border text-sm font-bold ${n === page ? "bg-navy text-white border-navy" : "bg-white border-border hover:bg-surface-raised"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
