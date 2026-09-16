/**
 * General-purpose in-memory TTL cache for database queries.
 * Optimizes repeated reads (dashboard stats, blog lists, user lists, etc.)
 * 
 * Usage:
 *   const data = await queryCache.getOrSet("blogs:list:project123", 30_000, () =>
 *     db.blog.findMany({ where: { projectId: "project123" } })
 *   );
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 500;

export const queryCache = {
  async getOrSet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = store.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    const data = await fetcher();

    // Evict expired entries if store is full
    if (store.size >= MAX_ENTRIES) {
      for (const [k, v] of store.entries()) {
        if (v.expiresAt <= now) store.delete(k);
      }
      // If still full, delete oldest 10%
      if (store.size >= MAX_ENTRIES) {
        const entries = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
        for (let i = 0; i < Math.floor(MAX_ENTRIES * 0.1); i++) {
          store.delete(entries[i][0]);
        }
      }
    }

    store.set(key, { data, expiresAt: now + ttlMs });
    return data;
  },

  invalidate(prefix: string) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  clear() {
    store.clear();
  },
};
