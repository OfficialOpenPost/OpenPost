export type UserRole = "owner" | "admin" | "editor" | "author" | "contributor";

export type PostStatus = "draft" | "published" | "scheduled" | "archived" | "trash";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photoId: string | null;
  socialLinks: Record<string, string>;
  website: string | null;
  email: string | null;
  linkedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  seo: SeoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  variants: MediaVariants;
  altTextDefault: string | null;
  checksum: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface MediaVariants {
  original: string;
  webp?: Record<number, string>;
  avif?: Record<number, string>;
  thumbnail: string;
}

export interface MediaUsage {
  mediaId: string;
  blogId: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: JsonDoc;
  schemaVersion: number;
  status: PostStatus;
  featuredImageId: string | null;
  categoryId: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  createdBy: string;
  seo: SeoMetadata;
  wordCount: number;
  readingTime: number;
}

export interface BlogRevision {
  id: string;
  blogId: string;
  content: JsonDoc;
  createdAt: Date;
  createdBy: string;
  label: string | null;
}

export interface SeoMetadata {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  og?: {
    title?: string;
    description?: string;
    image?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface JsonDoc {
  type: "doc";
  version: number;
  content: JsonNode[];
}

export interface JsonNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
  marks?: JsonMark[];
  text?: string;
}

export interface JsonMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface Redirect {
  id: string;
  oldSlug: string;
  newSlug: string;
  blogId: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  meta?: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
}
