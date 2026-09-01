import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FloatingImageView } from "@/components/editor/floating/FloatingImageView";

export type FloatPosition = "none" | "left" | "right";
export type LayoutMode = "inline" | "left" | "right" | "center" | "wide";
export type WrapMode = "square" | "tight" | "top-bottom";
export type ShadowLevel = "none" | "sm" | "md" | "lg" | "xl";

export interface FloatingImageAttributes {
  src: string;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  width?: number | string;
  height?: number | string | null;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  aspectRatio?: number | null;
  lockAspectRatio?: boolean;
  layout?: LayoutMode;
  float?: FloatPosition;
  wrapMode?: WrapMode;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  borderColor?: string;
  borderRadius?: number;
  shadow?: ShadowLevel;
  opacity?: number;
  rotation?: number;
  link?: string | null;
  openLinkInNewTab?: boolean;
  isDecorative?: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: FloatingImageAttributes) => ReturnType;
      setFloatingImage: (options: FloatingImageAttributes) => ReturnType;
      updateFloatingImage: (options: Partial<FloatingImageAttributes>) => ReturnType;
    };
  }
}

export const FloatingImageNode = Node.create({
  name: "image", // Named "image" for full compatibility with existing posts, markdown, and drag-drop
  group: "block",
  inline: false,
  atom: true,
  draggable: true,
  selectable: true,
  isolating: false,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (el) => el.querySelector("img")?.getAttribute("src") || el.getAttribute("src") || "",
        renderHTML: (attrs) => ({ src: attrs.src }),
      },
      alt: {
        default: null,
        parseHTML: (el) => el.querySelector("img")?.getAttribute("alt") || el.getAttribute("alt") || null,
        renderHTML: (attrs) => (attrs.alt ? { alt: attrs.alt } : {}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.querySelector("img")?.getAttribute("title") || el.getAttribute("title") || null,
        renderHTML: (attrs) => (attrs.title ? { title: attrs.title } : {}),
      },
      caption: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-caption") || null,
        renderHTML: (attrs) => (attrs.caption ? { "data-caption": attrs.caption } : {}),
      },
      width: {
        default: 380,
        parseHTML: (el) => {
          const v = el.getAttribute("data-width") || el.style.width;
          if (!v) return 380;
          if (v.endsWith("%") || v.endsWith("px")) return v;
          const num = Number(v);
          return Number.isFinite(num) ? num : 380;
        },
        renderHTML: (attrs) => ({ "data-width": String(attrs.width || 380) }),
      },
      height: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-height") || null,
        renderHTML: (attrs) => (attrs.height ? { "data-height": String(attrs.height) } : {}),
      },
      naturalWidth: {
        default: null,
        parseHTML: (el) => Number(el.getAttribute("data-natural-width")) || null,
        renderHTML: (attrs) => (attrs.naturalWidth ? { "data-natural-width": String(attrs.naturalWidth) } : {}),
      },
      naturalHeight: {
        default: null,
        parseHTML: (el) => Number(el.getAttribute("data-natural-height")) || null,
        renderHTML: (attrs) => (attrs.naturalHeight ? { "data-natural-height": String(attrs.naturalHeight) } : {}),
      },
      aspectRatio: {
        default: null,
        parseHTML: (el) => Number(el.getAttribute("data-aspect-ratio")) || null,
        renderHTML: (attrs) => (attrs.aspectRatio ? { "data-aspect-ratio": String(attrs.aspectRatio) } : {}),
      },
      lockAspectRatio: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-lock-aspect") !== "false",
        renderHTML: (attrs) => ({ "data-lock-aspect": String(attrs.lockAspectRatio !== false) }),
      },
      layout: {
        default: "center" as LayoutMode,
        parseHTML: (el) => (el.getAttribute("data-layout") as LayoutMode) || "center",
        renderHTML: (attrs) => ({ "data-layout": attrs.layout || "center" }),
      },
      float: {
        default: "none" as FloatPosition,
        parseHTML: (el) => (el.getAttribute("data-float") as FloatPosition) || "none",
        renderHTML: (attrs) => ({ "data-float": attrs.float || "none" }),
      },
      wrapMode: {
        default: "square" as WrapMode,
        parseHTML: (el) => (el.getAttribute("data-wrap-mode") as WrapMode) || "square",
        renderHTML: (attrs) => ({ "data-wrap-mode": attrs.wrapMode || "square" }),
      },
      marginTop: {
        default: 6,
        parseHTML: (el) => Number(el.getAttribute("data-margin-top")) || 6,
      },
      marginRight: {
        default: 20,
        parseHTML: (el) => Number(el.getAttribute("data-margin-right")) || 20,
      },
      marginBottom: {
        default: 12,
        parseHTML: (el) => Number(el.getAttribute("data-margin-bottom")) || 12,
      },
      marginLeft: {
        default: 20,
        parseHTML: (el) => Number(el.getAttribute("data-margin-left")) || 20,
      },
      borderWidth: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-border-width")) || 0,
      },
      borderStyle: {
        default: "solid",
        parseHTML: (el) => el.getAttribute("data-border-style") || "solid",
      },
      borderColor: {
        default: "#E2E8F0",
        parseHTML: (el) => el.getAttribute("data-border-color") || "#E2E8F0",
      },
      borderRadius: {
        default: 12,
        parseHTML: (el) => Number(el.getAttribute("data-border-radius")) || 12,
      },
      shadow: {
        default: "sm" as ShadowLevel,
        parseHTML: (el) => (el.getAttribute("data-shadow") as ShadowLevel) || "sm",
      },
      opacity: {
        default: 1,
        parseHTML: (el) => Number(el.getAttribute("data-opacity")) || 1,
      },
      rotation: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-rotation")) || 0,
      },
      link: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-link") || null,
      },
      openLinkInNewTab: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-open-new-tab") !== "false",
      },
      isDecorative: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-decorative") === "true",
      },
    };
  },

  parseHTML() {
    return [
      { tag: "figure[data-floating-image]" },
      { tag: "figure[data-float]" },
      { tag: "img[src]" },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs;
    const isLeft = a.float === "left" || a.layout === "left";
    const isRight = a.float === "right" || a.layout === "right";
    const isWide = a.layout === "wide";

    let floatStyle = "display:block;margin:2rem auto;text-align:center;";
    if (isLeft) {
      floatStyle = `float:left;clear:none;display:block;margin:${a.marginTop ?? 6}px ${a.marginRight ?? 20}px ${a.marginBottom ?? 12}px 0;`;
    } else if (isRight) {
      floatStyle = `float:right;clear:none;display:block;margin:${a.marginTop ?? 6}px 0 ${a.marginBottom ?? 12}px ${a.marginLeft ?? 20}px;`;
    } else if (isWide) {
      floatStyle = "display:block;width:100%;clear:both;margin:2rem 0;";
    }

    const figureAttrs = mergeAttributes(HTMLAttributes, {
      class: "openpost-floating-image",
      style: `${floatStyle}max-width:100%;`,
      "data-floating-image": "true",
      "data-float": a.float,
      "data-layout": a.layout,
    });

    const imgAttrs: Record<string, string> = {
      src: a.src,
      alt: a.isDecorative ? "" : a.alt || "",
      style: `width:100%;height:auto;display:block;border-radius:${a.borderRadius ?? 12}px;`,
    };
    if (a.title) imgAttrs.title = a.title;

    const children: any[] = [["img", imgAttrs]];
    if (a.caption) {
      children.push([
        "figcaption",
        { class: "openpost-fi-caption", style: "text-align:center;font-size:0.875rem;color:#64748B;margin-top:0.5rem;" },
        a.caption,
      ]);
    }

    return ["figure", figureAttrs, ...children];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingImageView);
  },

  addCommands() {
    return {
      setImage:
        (options: FloatingImageAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              width: 380,
              layout: "center",
              float: "none",
              ...options,
            },
          });
        },

      setFloatingImage:
        (options: FloatingImageAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              width: 380,
              layout: "center",
              float: "none",
              ...options,
            },
          });
        },

      updateFloatingImage:
        (options: Partial<FloatingImageAttributes>) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options);
        },
    };
  },
});
