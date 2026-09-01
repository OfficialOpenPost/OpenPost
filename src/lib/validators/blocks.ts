import { z } from "zod";

export const textBlockSchema = z.object({ type: z.literal("paragraph"), content: z.array(z.any()).optional() });
export const headingBlockSchema = z.object({ type: z.literal("heading"), attrs: z.object({ level: z.number().min(1).max(4) }) });
export const imageBlockSchema = z.object({ type: z.literal("image"), attrs: z.object({ src: z.string().url(), alt: z.string().nullable().optional(), caption: z.string().nullable().optional(), align: z.enum(["left", "center", "right"]).optional() }) });
export const calloutBlockSchema = z.object({ type: z.literal("callout"), attrs: z.object({ tone: z.enum(["info", "warning", "success", "note"]) }) });
export const galleryBlockSchema = z.object({ type: z.literal("gallery"), attrs: z.object({ layout: z.enum(["grid", "carousel"]), images: z.array(z.object({ src: z.string() })) }) });
export const pollBlockSchema = z.object({ type: z.literal("poll"), attrs: z.object({ pollId: z.string().uuid() }) });

export const blockSchema = z.discriminatedUnion("type", [textBlockSchema, headingBlockSchema, imageBlockSchema, calloutBlockSchema, galleryBlockSchema, pollBlockSchema]);
export const docSchema = z.object({ type: z.literal("doc"), version: z.number().optional(), content: z.array(blockSchema) });

export function validateDoc(doc: unknown) {
  return docSchema.safeParse(doc);
}
