import Link from "next/link";
import { Clock, Calendar, ArrowRight } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
    publishedAt: string;
    readingTime?: number | null;
    category?: { name: string; slug: string } | null;
    authors?: { name: string; slug: string }[] | null;
    seo?: { description?: string | null } | null;
  };
  variant?: "default" | "lead" | "compact" | "horizontal";
}

export function PostCard({ post, variant = "default" }: PostCardProps) {
  const author = post.authors?.[0];
  const date = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Variant: Lead Featured Split Card (matching Zentra horizontal showcase)
  if (variant === "lead") {
    return (
      <Link
        href={`/${post.slug}`}
        className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
      >
        {post.coverImage && (
          <div className="lg:col-span-5 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className={`${post.coverImage ? "lg:col-span-7" : "lg:col-span-12"} space-y-4 p-2 sm:p-4`}>
          {post.category && (
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              {post.category.name}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight font-display">
            {post.title}
          </h2>
          {post.seo?.description && (
            <p className="text-sm sm:text-base text-slate-600 line-clamp-3 leading-relaxed">
              {post.seo.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              {author && (
                <>
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {author.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-700">{author.name}</span>
                </>
              )}
            </div>
            <span>{date}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Standard 3-Column Card (matching Zentra grid cards)
  return (
    <Link
      href={`/${post.slug}`}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-3.5 border border-slate-100 shadow-2xs hover:shadow-md transition-all duration-300"
    >
      <div className="space-y-3">
        {post.coverImage && (
          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        {post.category && (
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block pt-1">
            {post.category.name}
          </span>
        )}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug font-display">
          {post.title}
        </h3>
        {post.seo?.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {post.seo.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {author && (
            <>
              <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                {author.name.charAt(0)}
              </div>
              <span className="font-semibold text-slate-700 truncate max-w-[110px]">{author.name}</span>
            </>
          )}
        </div>
        <span>{date}</span>
      </div>
    </Link>
  );
}
