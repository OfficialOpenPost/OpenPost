import { Node, mergeAttributes } from "@tiptap/core";

export const SocialEmbed = Node.create({
  name: "socialEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      provider: { default: "twitter" },
      postId: { default: "" },
      url: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="socialEmbed"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "socialEmbed", class: "my-6 rounded-xl border border-border bg-surface p-6 text-center" }),
      `Social embed — ${node.attrs.provider} (resolved server-side via oEmbed, no raw HTML)`,
    ];
  },

  addCommands() {
    return {
      setSocialEmbed:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});
