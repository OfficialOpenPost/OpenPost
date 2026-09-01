// Redirect handling for slug changes (PRD §21)
// Changing slug of published post creates old_slug -> new_slug 301

export interface RedirectRecord {
  oldSlug: string;
  newSlug: string;
  blogId: string;
  createdAt: Date;
}

// In production, these are stored in `redirects` table and checked at request time
// Frontend/API should issue 301 if oldSlug is requested

export function createRedirect(oldSlug: string, newSlug: string, blogId: string): RedirectRecord {
  if (oldSlug === newSlug) throw new Error("Old and new slug are identical");
  return { oldSlug, newSlug, blogId, createdAt: new Date() };
}

export function resolveRedirect(slug: string, redirects: RedirectRecord[]): string | null {
  const r = redirects.find((x) => x.oldSlug === slug);
  return r ? r.newSlug : null;
}
