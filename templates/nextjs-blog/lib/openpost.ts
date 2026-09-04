export interface OpenPostArticle {
  id: string;
  title: string;
  slug: string;
  content?: any;
  status: string;
  publishedAt: string;
  readingTime: number;
  wordCount: number;
  coverImage?: string;
  category?: { id: string; name: string; slug: string; description?: string };
  authors?: Array<{
    id: string;
    name: string;
    slug: string;
    bio?: string;
    photoId?: string;
    socialLinks?: any;
  }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
  polls?: Array<{
    id: string;
    question: string;
    type: string;
    status: string;
    totalVotes: number;
    options: Array<{ id: string; label: string; votes: number }>;
  }>;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
  };
}

export interface OpenPostCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface OpenPostTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface OpenPostAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  email?: string;
  website?: string;
  social?: Record<string, string>;
  photoId?: string;
  postCount?: number;
}

const OPENPOST_URL = (
  process.env.NEXT_PUBLIC_OPENPOST_URL ||
  process.env.OPENPOST_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const OPENPOST_TOKEN = process.env.OPENPOST_TOKEN || "";
const OPENPOST_PROJECT_ID = process.env.OPENPOST_PROJECT_ID || "";

// In-Memory Fast Cache with TTL for ultra-fast repeat renders & navigation
const memoryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds in-memory cache

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached(key: string, data: any, ttlMs: number = CACHE_TTL_MS) {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

async function fetchFromOpenPost<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const cacheKey = `ep:${endpoint}`;
  const cached = getCached<T>(cacheKey);
  if (cached !== null) return cached;

  const url = `${OPENPOST_URL}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(OPENPOST_TOKEN ? { Authorization: `Bearer ${OPENPOST_TOKEN}` } : {}),
    ...(OPENPOST_PROJECT_ID ? { "X-OpenPost-Project": OPENPOST_PROJECT_ID } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s resilient timeout for serverless wake-up

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      next: {
        revalidate: 60, // ISR 60s
        tags: ["openpost-content"],
        ...options.next,
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("NOT_FOUND");
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenPost API error: ${res.status}`);
    }

    const json = await res.json();
    setCached(cacheKey, json.data);
    return json.data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.message === "NOT_FOUND") {
      throw err;
    }
    if (retries > 0) {
      console.warn(`[OpenPost] Retrying request to ${endpoint} after error:`, err.message || err);
      return fetchFromOpenPost<T>(endpoint, options, retries - 1);
    }
    console.error(`[OpenPost] Error fetching from ${endpoint}:`, err.message || err);
    throw err;
  }
}

export async function getPosts(params: {
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  cursor?: string;
} = {}): Promise<{ posts: OpenPostArticle[]; nextCursor: string | null; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.category) sp.set("category", params.category);
  if (params.tag) sp.set("tag", params.tag);
  if (params.author) sp.set("author", params.author);
  if (params.cursor) sp.set("cursor", params.cursor);

  const query = sp.toString() ? `?${sp.toString()}` : "";
  const cacheKey = `posts:${query}`;
  const cached = getCached<{ posts: OpenPostArticle[]; nextCursor: string | null; hasMore: boolean }>(cacheKey);
  if (cached !== null) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s resilient timeout

  try {
    const res = await fetch(`${OPENPOST_URL}/api/v1/posts${query}`, {
      headers: {
        ...(OPENPOST_TOKEN ? { Authorization: `Bearer ${OPENPOST_TOKEN}` } : {}),
        ...(OPENPOST_PROJECT_ID ? { "X-OpenPost-Project": OPENPOST_PROJECT_ID } : {}),
      },
      signal: controller.signal,
      next: { revalidate: 60, tags: ["openpost-posts"] },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return { posts: [], nextCursor: null, hasMore: false };
    const json = await res.json();
    const result = {
      posts: json.data || [],
      nextCursor: json.meta?.cursor || null,
      hasMore: json.meta?.hasMore || false,
    };
    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[OpenPost] Error fetching posts:", err.message || err);
    return { posts: [], nextCursor: null, hasMore: false };
  }
}

export async function getPostBySlug(slug: string): Promise<OpenPostArticle | null> {
  const cacheKey = `post:${slug}`;
  const cached = getCached<OpenPostArticle>(cacheKey);
  if (cached !== null) return cached;

  try {
    const post = await fetchFromOpenPost<OpenPostArticle>(`/posts/${encodeURIComponent(slug)}`);
    if (post) setCached(cacheKey, post);
    return post;
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return null;
    console.error(`[OpenPost] Failed to fetch post by slug "${slug}":`, err.message || err);
    return null;
  }
}

export async function getCategories(): Promise<OpenPostCategory[]> {
  try {
    return await fetchFromOpenPost<OpenPostCategory[]>("/categories");
  } catch {
    return [];
  }
}

export async function getTags(): Promise<OpenPostTag[]> {
  try {
    return await fetchFromOpenPost<OpenPostTag[]>("/tags");
  } catch {
    return [];
  }
}

export async function getAuthors(): Promise<OpenPostAuthor[]> {
  try {
    return await fetchFromOpenPost<OpenPostAuthor[]>("/authors");
  } catch {
    return [];
  }
}

export async function getAuthorBySlug(slug: string): Promise<OpenPostAuthor | null> {
  try {
    return await fetchFromOpenPost<OpenPostAuthor>(`/authors/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function searchPosts(q: string): Promise<OpenPostArticle[]> {
  if (!q.trim()) return [];
  try {
    const res = await fetchFromOpenPost<OpenPostArticle[]>(`/search?q=${encodeURIComponent(q)}`);
    return res || [];
  } catch {
    return [];
  }
}


export async function getPoll(id: string): Promise<any | null> {
  try {
    return await fetchFromOpenPost<any>(`/polls/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function submitPollVote(pollId: string, optionId: string): Promise<any> {
  const url = `${OPENPOST_URL}/api/v1/polls/${encodeURIComponent(pollId)}/vote`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OPENPOST_TOKEN ? { Authorization: `Bearer ${OPENPOST_TOKEN}` } : {}),
      ...(OPENPOST_PROJECT_ID ? { "X-OpenPost-Project": OPENPOST_PROJECT_ID } : {}),
    },
    body: JSON.stringify({ optionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to submit vote");
  }
  return await res.json();
}

