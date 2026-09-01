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

    const widthStr = typeof a.width === "number" ? `${a.width}px` : String(a.width || "340px");
    const formattedWidth = widthStr.endsWith("%") || widthStr.endsWith("px") ? widthStr : `${widthStr}px`;
    const borderRadius = a.borderRadius ?? 10;
    const shadowMap: Record<string, string> = {
      none: "none",
      sm: "0 1px 3px rgba(0,0,0,0.07)",
      md: "0 4px 12px rgba(0,0,0,0.09)",
      lg: "0 8px 24px rgba(0,0,0,0.12)",
      xl: "0 16px 40px rgba(0,0,0,0.15)",
    };
    const shadowVal = shadowMap[a.shadow] || shadowMap.sm;
    const borderStyle = a.borderWidth > 0 ? `${a.borderWidth}px solid ${a.borderColor || "#E2E8F0"}` : "1px solid #E2E8F0";

    let floatStyle = "";
    if (isLeft) {
      floatStyle = `float:left;clear:none;display:block;width:${formattedWidth};max-width:80%;margin:${a.marginTop ?? 4}px ${a.marginRight ?? 14}px ${a.marginBottom ?? 8}px 0;`;
    } else if (isRight) {
      floatStyle = `float:right;clear:none;display:block;width:${formattedWidth};max-width:80%;margin:${a.marginTop ?? 4}px 0 ${a.marginBottom ?? 8}px ${a.marginLeft ?? 14}px;`;
    } else if (isWide) {
      floatStyle = `float:none;clear:both;display:block;width:100%;max-width:100%;margin:1.5rem 0;`;
    } else {
      floatStyle = `float:none;clear:both;display:block;width:${formattedWidth};max-width:100%;margin:1.25rem auto;text-align:center;`;
    }

    const figureAttrs = mergeAttributes(HTMLAttributes, {
      class: "openpost-floating-image",
      style: `${floatStyle}box-sizing:border-box;position:relative;`,
      "data-floating-image": "true",
      "data-float": isLeft ? "left" : isRight ? "right" : "none",
      "data-layout": a.layout || (isLeft ? "left" : isRight ? "right" : isWide ? "wide" : "center"),
      "data-width": formattedWidth,
    });

    const cardStyle = `border-radius:${borderRadius}px;border:${borderStyle};box-shadow:${shadowVal};opacity:${a.opacity ?? 1};${a.rotation ? `transform:rotate(${a.rotation}deg);` : ""}overflow:hidden;box-sizing:border-box;display:block;width:100%;background:#ffffff;margin:0;padding:0;`;

    const imgStyle = `width:100%;height:auto;display:block;margin:0;padding:0;border-radius:inherit;object-fit:contain;`;

    const imgAttrs: Record<string, string> = {
      src: a.src,
      alt: a.isDecorative ? "" : a.alt || "",
      style: imgStyle,
    };
    if (a.title) imgAttrs.title = a.title;

    let imgEl: any = ["img", imgAttrs];
    if (a.link) {
      imgEl = [
        "a",
        {
          href: a.link,
          target: a.openLinkInNewTab ? "_blank" : "_self",
          rel: a.openLinkInNewTab ? "noopener noreferrer" : undefined,
          style: "display:block;text-decoration:none;border:none;",
        },
        imgEl,
      ];
    }

    const cardBox = ["div", { class: "openpost-fi-card", style: cardStyle }, imgEl];

    const children: any[] = [cardBox];
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
