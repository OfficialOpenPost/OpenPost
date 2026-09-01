import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageCardView } from "../ImageCardView";

export const ImageBlock = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: { default: null, parseHTML: (el) => el.getAttribute("alt"), renderHTML: (attrs) => (attrs.alt ? { alt: attrs.alt } : {}) },
      caption: { default: null, parseHTML: (el) => el.getAttribute("data-caption"), renderHTML: (attrs) => (attrs.caption ? { "data-caption": attrs.caption } : {}) },
      align: { default: "center", parseHTML: (el) => el.getAttribute("data-align") || "center", renderHTML: (attrs) => ({ "data-align": attrs.align }) },
      layout: { default: "center", parseHTML: (el) => el.getAttribute("data-layout") || "center", renderHTML: (attrs) => ({ "data-layout": attrs.layout }) },
      width: { default: "100%", parseHTML: (el) => el.style.width || "100%", renderHTML: (attrs) => ({ style: `width: ${attrs.width}` }) },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageCardView);
  },
});
