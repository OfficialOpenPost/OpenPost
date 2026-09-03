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
  variant?: "default" | "horizontal" | "compact" | "lead" | "bento";
  ranking?: number;
}

export function PostCard({ post, variant = "default", ranking }: PostCardProps) {
  const author = post.authors?.[0];
  const date = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Variant: Lead Spotlight (Hero Big Feature)
  if (variant === "lead") {
    return (
      <Link
        href={`/${post.slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm mag-card transition-all duration-300"
      >
        <div className="grid lg:grid-cols-12 gap-0">
          {post.coverImage && (
            <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-100 relative min-h-[300px] lg:min-h-[420px]">
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent lg:hidden" />
            </div>
          )}
          <div className={`${post.coverImage ? "lg:col-span-5" : "lg:col-span-12"} p-8 sm:p-10 flex flex-col justify-between space-y-6`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                {post.category && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-[#6C63FF] uppercase tracking-wider">
                    {post.category.name}
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-400">Featured Story</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-[#6C63FF] transition-colors leading-[1.2] font-display">
                {post.title}
              </h2>
              {post.seo?.description && (
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {post.seo.description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#4F46E5] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                      {author.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{author.name}</p>
                      <p className="text-[10px] text-slate-400">{date}</p>
                    </div>
                  </div>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 rounded-full px-2.5 py-1">
                <Clock className="h-3 w-3 text-slate-400" /> {post.readingTime || 4} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Variant: Bento Grid Card (Overlay gradient style)
  if (variant === "bento") {
    return (
      <Link
        href={`/${post.slug}`}
        className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 p-6 sm:p-8 min-h-[340px] mag-card transition-all duration-300"
      >
        {post.coverImage ? (
          <>
            <img
              src={post.coverImage}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" />
        )}

        <div className="relative z-10 space-y-3">
          {post.category && (
            <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
              {post.category.name}
            </span>
          )}
          <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-200 transition-colors leading-snug font-display line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 font-medium">
            {author && <span>By {author.name}</span>}
            <span>&bull;</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingTime || 3} min read</span>
          </div>
        </div>
      </Link>
    );
  }

  // Variant: Horizontal Story Card
  if (variant === "horizontal") {
    return (
      <Link
        href={`/${post.slug}`}
        className="group flex flex-col sm:flex-row gap-5 p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs mag-card transition-all duration-200"
      >
        {post.coverImage && (
          <div className="sm:w-56 shrink-0 aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between min-w-0 space-y-3">
          <div className="space-y-2">
            {post.category && (
              <span className="text-[11px] font-bold text-[#6C63FF] uppercase tracking-wider">
                {post.category.name}
              </span>
            )}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#6C63FF] transition-colors line-clamp-2 leading-snug font-display">
              {post.title}
            </h3>
            {post.seo?.description && (
              <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {post.seo.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {author && <span className="font-bold text-slate-700">{author.name}</span>}
              <span>&bull;</span>
              <span>{date}</span>
            </div>
            <span className="flex items-center gap-1 font-semibold text-slate-500">
              <Clock className="h-3 w-3 text-slate-400" /> {post.readingTime || 3} min
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Variant: Compact Trending Card (with optional ranking number)
  if (variant === "compact") {
    return (
      <Link
        href={`/${post.slug}`}
        className="group flex items-start gap-4 p-3.5 rounded-2xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition duration-150"
      >
        {ranking !== undefined && (
          <span className="text-2xl sm:text-3xl font-black text-slate-200 group-hover:text-[#6C63FF] transition font-display shrink-0 w-8">
            0{ranking}
          </span>
        )}
        {post.coverImage && (
          <div className="w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          {post.category && (
            <span className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-wider block">
              {post.category.name}
            </span>
          )}
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#6C63FF] transition line-clamp-2 leading-snug font-display">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{date}</span>
            <span>&bull;</span>
            <span>{post.readingTime || 3} min read</span>
          </div>
        </div>
      </Link>
    );
  }

  // Default Grid Card
  return (
    <Link
      href={`/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs mag-card transition-all duration-300"
    >
      {post.coverImage && (
        <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {post.category && (
            <span className="absolute top-3.5 left-3.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[10px] font-black text-slate-900 uppercase tracking-wider shadow-sm">
              {post.category.name}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-6 space-y-3">
        {!post.coverImage && post.category && (
          <span className="text-[11px] font-bold text-[#6C63FF] uppercase tracking-wider">
            {post.category.name}
          </span>
        )}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#6C63FF] transition-colors line-clamp-2 leading-snug font-display">
          {post.title}
        </h3>
        {post.seo?.description && (
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {post.seo.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {author && (
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#4F46E5] flex items-center justify-center text-[10px] font-bold text-white">
                  {author.name.charAt(0)}
                </div>
                <span className="font-bold text-slate-700 truncate max-w-[100px]">{author.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>{date}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold text-slate-500">
              <Clock className="h-3 w-3" />{post.readingTime || 3}m
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
