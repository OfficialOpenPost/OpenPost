import { Node, mergeAttributes } from "@tiptap/core";

function parseEmbedUrl(url: string): { provider: string; videoId: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.searchParams.get("v") || u.pathname.slice(1);
      if (id) return { provider: "youtube", videoId: id.split("?")[0] };
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { provider: "vimeo", videoId: id };
    }
  } catch {}
  return null;
}

export const EmbedBlock = Node.create({
  name: "embedBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      provider: { default: null },
      videoId: { default: null },
      url: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embedBlock"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    if (!node.attrs.provider || !node.attrs.videoId) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-type": "embedBlock", class: "my-6 rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-tertiary" }), "Embed — paste YouTube/Vimeo URL (server resolves provider + ID, no raw iframe)"];
    }
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "embedBlock", "data-provider": node.attrs.provider, "data-video-id": node.attrs.videoId, class: "my-6 overflow-hidden rounded-xl border border-border bg-navy aspect-video flex items-center justify-center text-white" }), `${node.attrs.provider}: ${node.attrs.videoId} (rendered via trusted template)`];
  },

  addCommands() {
    return {
      setEmbed:
        (attrs: { url: string }) =>
        ({ commands }: any) => {
          const parsed = parseEmbedUrl(attrs.url);
          if (!parsed) return false;
          return commands.insertContent({ type: "embedBlock", attrs: { ...parsed, url: attrs.url } });
        },
    } as any;
  },
});
