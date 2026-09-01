import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GalleryBlockView } from "../GalleryBlockView";

export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      layout: { default: "grid", parseHTML: (el) => el.getAttribute("data-layout") || "grid", renderHTML: (attrs) => ({ "data-layout": attrs.layout }) },
      images: {
        default: [{ src: "https://picsum.photos/seed/1/600/400" }, { src: "https://picsum.photos/seed/2/600/400" }],
        parseHTML: (el) => {
          try {
            const raw = el.getAttribute("data-images");
            return raw ? JSON.parse(raw) : undefined;
          } catch {
            return undefined;
          }
        },
        renderHTML: (attrs) => ({ "data-images": JSON.stringify(attrs.images) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "gallery", class: "my-6 grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-surface-raised" }), "Gallery — grid / carousel (add images in media library)"];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryBlockView);
  },

  addCommands() {
    return {
      setGallery:
        (attrs: Record<string, unknown>) =>
        ({ commands, editor }: any) => {
          const images = (attrs as any).images;
          if (Array.isArray(images) && images.length < 2) {
            if (images.length === 1) {
              return editor.chain().focus().setImage({ src: images[0].src }).run();
            }
            (attrs as any).images = [{ src: "https://picsum.photos/seed/1/600/400" }, { src: "https://picsum.photos/seed/2/600/400" }];
          }
          return commands.insertContent({ type: this.name, attrs });
        },
      updateGallery:
        (attrs: Record<string, unknown>) =>
        ({ commands }: any) =>
          commands.updateAttributes(this.name, attrs),
    } as any;
  },
});
