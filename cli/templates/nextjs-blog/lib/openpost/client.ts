type OpenPostConfig = { url: string; token: string; projectId: string };

export function createOpenPostClient(config: OpenPostConfig) {
  const headers = { "X-OpenPost-Token": config.token, "X-OpenPost-Project": config.projectId };

  return {
    posts: {
      list: async (opts: { limit?: number; cursor?: string } = {}) => {
        const url = new URL(`${config.url}/api/v1/posts`);
        if (opts.limit) url.searchParams.set("limit", String(opts.limit));
        if (opts.cursor) url.searchParams.set("cursor", opts.cursor);
        const res = await fetch(url.toString(), { headers, next: { tags: ["posts"] } });
        if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
        return res.json();
      },
      getBySlug: async (slug: string) => {
        const res = await fetch(`${config.url}/api/v1/posts/${slug}`, { headers, next: { tags: [`post:${slug}`] } });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`);
        const j = await res.json();
        return j.data;
      },
    },
    categories: {
      list: async () => {
        const res = await fetch(`${config.url}/api/v1/categories`, { headers });
        return res.json();
      },
    },
  };
}
