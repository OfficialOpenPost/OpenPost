import { Node, mergeAttributes } from "@tiptap/core";

export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      layout: { default: "grid", parseHTML: (el) => el.getAttribute("data-layout") || "grid", renderHTML: (attrs) => ({ "data-layout": attrs.layout }) },
      images: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "gallery", class: "my-6 grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-surface-raised" }), "Gallery — grid / carousel (add images in media library)"];
  },

  addCommands() {
    return {
      setGallery:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any;
  },
});
