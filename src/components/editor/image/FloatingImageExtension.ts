import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FloatingImageView } from "./FloatingImageView";

export interface FloatingImageAttributes {
  src: string;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  captionAlign?: "left" | "center" | "right";
  width?: string;
  height?: string | null;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  aspectRatio?: number | null;
  lockAspectRatio?: boolean;
  layout?: "inline" | "left" | "right" | "center" | "wide";
  float?: "none" | "left" | "right";
  wrapMode?: "square" | "inline" | "top-bottom" | "tight";
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  borderColor?: string;
  borderRadius?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  rotation?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  objectPosition?: string;
  link?: string | null;
  openLinkInNewTab?: boolean;
  isDecorative?: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    floatingImage: {
      setFloatingImage: (options: FloatingImageAttributes) => ReturnType;
      updateFloatingImage: (options: Partial<FloatingImageAttributes>) => ReturnType;
    };
  }
}

export const FloatingImage = Node.create({
  name: "image", // Named "image" for seamless starter-kit & markdown compatibility, or floatingImage
  group: "block",
  inline: false,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("src") || "",
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt") || null,
        renderHTML: (attributes) => (attributes.alt ? { alt: attributes.alt } : {}),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title") || null,
        renderHTML: (attributes) => (attributes.title ? { title: attributes.title } : {}),
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-caption") || null,
        renderHTML: (attributes) => (attributes.caption ? { "data-caption": attributes.caption } : {}),
      },
      captionAlign: {
        default: "center",
        parseHTML: (element) => (element.getAttribute("data-caption-align") as any) || "center",
        renderHTML: (attributes) => ({ "data-caption-align": attributes.captionAlign || "center" }),
      },
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("data-width") || element.style.width || "100%",
        renderHTML: (attributes) => ({ "data-width": attributes.width || "100%" }),
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-height") || null,
        renderHTML: (attributes) => (attributes.height ? { "data-height": attributes.height } : {}),
      },
      naturalWidth: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute("data-natural-width")) || null,
        renderHTML: (attributes) => (attributes.naturalWidth ? { "data-natural-width": String(attributes.naturalWidth) } : {}),
      },
      naturalHeight: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute("data-natural-height")) || null,
        renderHTML: (attributes) => (attributes.naturalHeight ? { "data-natural-height": String(attributes.naturalHeight) } : {}),
      },
      aspectRatio: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute("data-aspect-ratio")) || null,
        renderHTML: (attributes) => (attributes.aspectRatio ? { "data-aspect-ratio": String(attributes.aspectRatio) } : {}),
      },
      lockAspectRatio: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-lock-aspect") !== "false",
        renderHTML: (attributes) => ({ "data-lock-aspect": String(attributes.lockAspectRatio !== false) }),
      },
      layout: {
        default: "center",
        parseHTML: (element) => (element.getAttribute("data-layout") as any) || "center",
        renderHTML: (attributes) => ({ "data-layout": attributes.layout || "center" }),
      },
      float: {
        default: "none",
        parseHTML: (element) => (element.getAttribute("data-float") as any) || "none",
        renderHTML: (attributes) => ({ "data-float": attributes.float || "none" }),
      },
      wrapMode: {
        default: "square",
        parseHTML: (element) => (element.getAttribute("data-wrap-mode") as any) || "square",
        renderHTML: (attributes) => ({ "data-wrap-mode": attributes.wrapMode || "square" }),
      },
      marginTop: {
        default: 8,
        parseHTML: (element) => Number(element.getAttribute("data-margin-top")) || 8,
        renderHTML: (attributes) => ({ "data-margin-top": String(attributes.marginTop ?? 8) }),
      },
      marginRight: {
        default: 12,
        parseHTML: (element) => Number(element.getAttribute("data-margin-right")) || 12,
        renderHTML: (attributes) => ({ "data-margin-right": String(attributes.marginRight ?? 12) }),
      },
      marginBottom: {
        default: 8,
        parseHTML: (element) => Number(element.getAttribute("data-margin-bottom")) || 8,
        renderHTML: (attributes) => ({ "data-margin-bottom": String(attributes.marginBottom ?? 8) }),
      },
      marginLeft: {
        default: 12,
        parseHTML: (element) => Number(element.getAttribute("data-margin-left")) || 12,
        renderHTML: (attributes) => ({ "data-margin-left": String(attributes.marginLeft ?? 12) }),
      },
      borderWidth: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute("data-border-width")) || 0,
        renderHTML: (attributes) => ({ "data-border-width": String(attributes.borderWidth ?? 0) }),
      },
      borderStyle: {
        default: "solid",
        parseHTML: (element) => (element.getAttribute("data-border-style") as any) || "solid",
        renderHTML: (attributes) => ({ "data-border-style": attributes.borderStyle || "solid" }),
      },
      borderColor: {
        default: "#E2E8F0",
        parseHTML: (element) => element.getAttribute("data-border-color") || "#E2E8F0",
        renderHTML: (attributes) => ({ "data-border-color": attributes.borderColor || "#E2E8F0" }),
      },
      borderRadius: {
        default: 16,
        parseHTML: (element) => (element.getAttribute("data-border-radius") !== null ? Number(element.getAttribute("data-border-radius")) : 16),
        renderHTML: (attributes) => ({ "data-border-radius": String(attributes.borderRadius ?? 16) }),
      },
      shadow: {
        default: "sm",
        parseHTML: (element) => (element.getAttribute("data-shadow") as any) || "sm",
        renderHTML: (attributes) => ({ "data-shadow": attributes.shadow || "sm" }),
      },
      opacity: {
        default: 1,
        parseHTML: (element) => (element.getAttribute("data-opacity") ? Number(element.getAttribute("data-opacity")) : 1),
        renderHTML: (attributes) => ({ "data-opacity": String(attributes.opacity ?? 1) }),
      },
      rotation: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute("data-rotation")) || 0,
        renderHTML: (attributes) => ({ "data-rotation": String(attributes.rotation ?? 0) }),
      },
      objectFit: {
        default: "cover",
        parseHTML: (element) => (element.getAttribute("data-object-fit") as any) || "cover",
        renderHTML: (attributes) => ({ "data-object-fit": attributes.objectFit || "cover" }),
      },
      objectPosition: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-object-position") || "center",
        renderHTML: (attributes) => ({ "data-object-position": attributes.objectPosition || "center" }),
      },
      link: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-link") || null,
        renderHTML: (attributes) => (attributes.link ? { "data-link": attributes.link } : {}),
      },
      openLinkInNewTab: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-open-new-tab") !== "false",
        renderHTML: (attributes) => ({ "data-open-new-tab": String(attributes.openLinkInNewTab !== false) }),
      },
      isDecorative: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-decorative") === "true",
        renderHTML: (attributes) => ({ "data-decorative": String(Boolean(attributes.isDecorative)) }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-floating-image]",
      },
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const {
      src,
      alt,
      caption,
      width,
      float,
      layout,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      borderRadius,
      borderWidth,
      borderStyle,
      borderColor,
      opacity,
      rotation,
    } = node.attrs;

    const isLeft = float === "left" || layout === "left";
    const isRight = float === "right" || layout === "right";
    const isWide = layout === "wide";

    let floatClass = "image-align-center block my-8 clear-both";
    if (isLeft) floatClass = "image-align-left float-left clear-none inline-block";
    if (isRight) floatClass = "image-align-right float-right clear-none inline-block";
    if (isWide) floatClass = "image-align-wide block w-full my-8 clear-both";

    const style = [
      width ? `width: ${width}` : "",
      `margin-top: ${marginTop ?? 4}px`,
      `margin-right: ${marginRight ?? (isLeft ? 12 : 0)}px`,
      `margin-bottom: ${marginBottom ?? 8}px`,
      `margin-left: ${marginLeft ?? (isRight ? 12 : 0)}px`,
      borderWidth ? `border: ${borderWidth}px ${borderStyle || "solid"} ${borderColor || "#E2E8F0"}` : "",
      borderRadius !== undefined ? `border-radius: ${borderRadius}px` : "border-radius: 16px",
      opacity !== undefined && opacity !== 1 ? `opacity: ${opacity}` : "",
      rotation ? `transform: rotate(${rotation}deg)` : "",
    ]
      .filter(Boolean)
      .join("; ");

    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-floating-image": "true",
        class: `floating-image-wrapper ${floatClass}`,
        style,
      }),
      [
        "img",
        {
          src,
          alt: alt || "",
          class: "floating-image-img w-full h-auto object-cover",
          style: `border-radius: inherit;`,
        },
      ],
      caption ? ["figcaption", { class: "floating-image-caption mt-2 text-xs text-center text-text-tertiary" }, caption] : null,
    ].filter(Boolean) as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingImageView, {
      attrs: ({ node }) => {
        const { float, layout, width, marginTop, marginRight, marginBottom, marginLeft, wrapMode } = node.attrs;
        const isLeft = float === "left" || layout === "left";
        const isRight = float === "right" || layout === "right";
        const isWide = layout === "wide";
        const isInline = layout === "inline";
        const isWrapSquare = wrapMode === "square" || wrapMode === "tight" || !wrapMode;

        const effectiveWidth = width || (isLeft || isRight ? "45%" : "100%");

        if ((isLeft || isRight) && isWrapSquare) {
          if (isLeft) {
            return {
              class: "floating-image-host image-float-left",
              "data-float": "left",
              "data-layout": "left",
              style: `float: left !important; clear: none !important; display: inline-block !important; width: ${effectiveWidth} !important; max-width: 100% !important; margin: ${marginTop ?? 4}px ${marginRight ?? 12}px ${marginBottom ?? 8}px ${marginLeft ?? 0}px !important;`,
            };
          }
          return {
            class: "floating-image-host image-float-right",
            "data-float": "right",
            "data-layout": "right",
            style: `float: right !important; clear: none !important; display: inline-block !important; width: ${effectiveWidth} !important; max-width: 100% !important; margin: ${marginTop ?? 4}px ${marginRight ?? 0}px ${marginBottom ?? 8}px ${marginLeft ?? 12}px !important;`,
          };
        }
        if (isInline) {
          return {
            class: "floating-image-host image-float-inline",
            "data-float": "none",
            "data-layout": "inline",
            style: `display: inline-block !important; vertical-align: middle !important; clear: none !important; float: none !important; width: ${effectiveWidth} !important; margin: 4px 8px !important;`,
          };
        }
        if (isWide) {
          return {
            class: "floating-image-host image-float-wide",
            "data-float": "none",
            "data-layout": "wide",
            style: `display: block !important; width: 100% !important; clear: both !important; float: none !important; margin: 2rem 0 !important;`,
          };
        }
        // Center
        return {
          class: "floating-image-host image-float-center",
          "data-float": "none",
          "data-layout": "center",
          style: `display: block !important; width: 100% !important; clear: both !important; float: none !important; margin: 2rem auto !important; text-align: center !important;`,
        };
      },
    });
  },

  addCommands() {
    return {
      setFloatingImage:
        (options: FloatingImageAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
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
