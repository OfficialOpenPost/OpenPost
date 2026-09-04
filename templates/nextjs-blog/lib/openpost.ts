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

async function fetchFromOpenPost<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${OPENPOST_URL}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(OPENPOST_TOKEN ? { Authorization: `Bearer ${OPENPOST_TOKEN}` } : {}),
    ...(OPENPOST_PROJECT_ID ? { "X-OpenPost-Project": OPENPOST_PROJECT_ID } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    next: {
      revalidate: 60, // ISR revalidation every 60 seconds
      tags: ["openpost-content"],
      ...options.next,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("NOT_FOUND");
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `OpenPost API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function getPosts(params: {
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  cursor?: string;
} = {}): Promise<{ posts: OpenPostArticle[]; nextCursor: string | null; hasMore: boolean }> {
  try {
    const sp = new URLSearchParams();
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.category) sp.set("category", params.category);
    if (params.tag) sp.set("tag", params.tag);
    if (params.author) sp.set("author", params.author);
    if (params.cursor) sp.set("cursor", params.cursor);

    const query = sp.toString() ? `?${sp.toString()}` : "";
    const res = await fetch(`${OPENPOST_URL}/api/v1/posts${query}`, {
      headers: {
        ...(OPENPOST_TOKEN ? { Authorization: `Bearer ${OPENPOST_TOKEN}` } : {}),
        ...(OPENPOST_PROJECT_ID ? { "X-OpenPost-Project": OPENPOST_PROJECT_ID } : {}),
      },
      next: { revalidate: 60, tags: ["openpost-posts"] },
    });

    if (!res.ok) return { posts: [], nextCursor: null, hasMore: false };
    const json = await res.json();
    return {
      posts: json.data || [],
      nextCursor: json.meta?.cursor || null,
      hasMore: json.meta?.hasMore || false,
    };
  } catch {
    return { posts: [], nextCursor: null, hasMore: false };
  }
}

export async function getPostBySlug(slug: string): Promise<OpenPostArticle | null> {
  try {
    return await fetchFromOpenPost<OpenPostArticle>(`/posts/${encodeURIComponent(slug)}`);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return null;
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

export interface OpenPostPollOption {
  id: string;
  label: string;
  votes: number;
  percentage?: number;
}

export interface OpenPostPoll {
  id: string;
  question: string;
  description?: string;
  type: string;
  status: string;
  totalVotes: number;
  options: OpenPostPollOption[];
  closesAt?: string | null;
  allowAnonymous?: boolean;
}

export async function getPoll(pollId: string): Promise<OpenPostPoll | null> {
  try {
    return await fetchFromOpenPost<OpenPostPoll>(`/polls/${pollId}`);
  } catch {
    return null;
  }
}

export function hasVotedInPoll(pollId: string): boolean {
  if (typeof window === "undefined" || !pollId) return false;
  return !!localStorage.getItem(`op_voted_${pollId}`);
}

export function recordLocalPollVote(pollId: string, optionId: string): void {
  if (typeof window === "undefined" || !pollId) return;
  localStorage.setItem(`op_voted_${pollId}`, optionId);
}

export async function submitPollVote(pollId: string, optionId: string): Promise<{ success: boolean; error?: string; alreadyVoted?: boolean }> {
  try {
    const res = await fetch(`${OPENPOST_URL}/api/v1/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: json.error?.message || "Failed to submit vote.",
        alreadyVoted: json.error?.code === "ALREADY_VOTED",
      };
    }
    recordLocalPollVote(pollId, optionId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}
