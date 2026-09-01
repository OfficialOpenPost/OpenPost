import { z } from "zod";

// Base
export const paragraphSchema = z.object({ type: z.literal("paragraph"), content: z.array(z.any()).optional(), attrs: z.any().optional() });
export const headingBlockSchema = z.object({ type: z.literal("heading"), attrs: z.object({ level: z.number().min(1).max(4) }).passthrough().optional(), content: z.array(z.any()).optional() });
export const imageBlockSchema = z.object({ type: z.literal("image"), attrs: z.object({ src: z.string().url(), alt: z.string().nullable().optional(), caption: z.string().nullable().optional(), align: z.enum(["left", "center", "right"]).optional(), width: z.number().optional(), layout: z.string().optional() }).passthrough().optional() });
export const calloutBlockSchema = z.object({ type: z.literal("callout"), attrs: z.object({ tone: z.enum(["info", "warning", "success", "note"]) }).passthrough().optional(), content: z.array(z.any()).optional() });
export const galleryBlockSchema = z.object({
  type: z.literal("gallery"),
  attrs: z.object({ layout: z.enum(["grid", "carousel"]).optional(), images: z.array(z.object({ src: z.string() })).min(2, "Gallery requires at least 2 images"), items: z.array(z.any()).optional() }).passthrough().optional(),
});
export const pollBlockSchema = z.object({
  type: z.union([z.literal("poll"), z.literal("pollBlock")]),
  attrs: z.object({ pollId: z.string().uuid().nullable().optional(), poll_id: z.string().uuid().optional(), question: z.string().optional() }).passthrough().optional(),
});
export const faqBlockSchema = z.object({
  type: z.literal("faq"),
  attrs: z.object({ items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1).optional(), question: z.string().optional() }).passthrough().optional(),
});
export const accordionBlockSchema = z.object({
  type: z.literal("accordion"),
  attrs: z.object({ items: z.array(z.object({ title: z.string().min(1), content: z.string().min(1) })).min(1).optional() }).passthrough().optional(),
});
export const buttonBlockSchema = z.object({
  type: z.literal("buttonBlock"),
  attrs: z.object({ label: z.string().min(1).max(50), url: z.string().url().or(z.string().startsWith("/")), variant: z.enum(["primary", "secondary", "outline"]).optional() }).passthrough().optional(),
});
export const downloadBlockSchema = z.object({
  type: z.literal("downloadBlock"),
  attrs: z.object({ fileName: z.string().min(1), fileSize: z.string().optional(), url: z.string().url().or(z.string().min(1)) }).passthrough().optional(),
});
export const socialEmbedSchema = z.object({
  type: z.literal("socialEmbed"),
  attrs: z.object({ provider: z.enum(["twitter", "x", "linkedin", "instagram", "facebook"]).optional(), postId: z.string().optional(), url: z.string().url().or(z.string().min(1)).optional() }).passthrough().optional(),
});
export const videoBlockSchema = z.object({
  type: z.literal("videoBlock"),
  attrs: z.object({ src: z.string().url().nullable().optional(), poster: z.string().url().nullable().optional() }).passthrough().optional(),
});
export const embedBlockSchema = z.object({
  type: z.literal("embedBlock"),
  attrs: z.object({ provider: z.enum(["youtube", "vimeo"]).nullable().optional(), videoId: z.string().nullable().optional(), url: z.string().url().nullable().optional() }).passthrough().optional(),
});
export const codeBlockSchema = z.object({ type: z.literal("codeBlock"), attrs: z.object({ language: z.string().optional() }).passthrough().optional(), content: z.array(z.any()).optional() });
export const blockquoteSchema = z.object({ type: z.literal("blockquote"), content: z.array(z.any()).optional(), attrs: z.any().optional() });
export const horizontalRuleSchema = z.object({ type: z.literal("horizontalRule"), attrs: z.any().optional() });

// Keep legacy alias for paragraph
export const textBlockSchema = paragraphSchema;

export const blockSchema = z.discriminatedUnion("type", [
  paragraphSchema,
  headingBlockSchema,
  imageBlockSchema,
  calloutBlockSchema,
  galleryBlockSchema,
  pollBlockSchema,
  faqBlockSchema,
  accordionBlockSchema,
  buttonBlockSchema,
  downloadBlockSchema,
  socialEmbedSchema,
  videoBlockSchema,
  embedBlockSchema,
  codeBlockSchema,
  blockquoteSchema,
  horizontalRuleSchema,
]);
export const docSchema = z.object({ type: z.literal("doc"), version: z.number().optional(), content: z.array(blockSchema) });

export function validateDoc(doc: unknown) {
  return docSchema.safeParse(doc);
}

// Helper to enforce gallery min-2 at runtime
export function enforceGalleryMin2(doc: any) {
  if (!doc?.content) return doc;
  const fixed = { ...doc, content: doc.content.map((n: any) => n.type === "gallery" && Array.isArray(n.attrs?.images) && n.attrs.images.length < 2 ? { ...n, type: "image", attrs: { src: n.attrs.images[0]?.src ?? "" } } : n) };
  return fixed;
}
