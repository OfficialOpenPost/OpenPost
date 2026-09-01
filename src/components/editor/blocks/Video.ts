import { Node, mergeAttributes } from "@tiptap/core";

export const VideoBlock = Node.create({
  name: "videoBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="videoBlock"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    if (!node.attrs.src) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-type": "videoBlock", class: "my-6 rounded-xl border-2 border-dashed border-border p-8 text-center bg-surface-raised" }), "Video block — upload or paste URL (200MB cap, no transcoding)"];
    }
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "videoBlock", class: "my-6 overflow-hidden rounded-xl border border-border" }), ["video", { src: node.attrs.src, poster: node.attrs.poster, controls: "true", class: "w-full" }]];
  },

  addCommands() {
    return {
      setVideo:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});
