import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { YouTubeBlockView } from "../YouTubeBlockView";

export const VideoBlock = Node.create({
  name: "videoBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      url: { default: "" },
      videoId: { default: "" },
      provider: { default: "youtube" },
      caption: { default: "" },
      title: { default: "" },
      align: { default: "center" },
      layout: { default: "center" },
      width: { default: "100%" },
      aspectRatio: { default: "16:9" },
      autoplay: { default: false },
      muted: { default: false },
      loop: { default: false },
      controls: { default: true },
      startTime: { default: 0 },
      privacyEnhanced: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="videoBlock"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "videoBlock",
        class: "my-6 overflow-hidden rounded-2xl border border-border bg-slate-950 aspect-video",
      }),
      [
        "iframe",
        {
          src: node.attrs.src || node.attrs.url || "",
          title: node.attrs.title || "Embedded Video",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "true",
          class: "w-full h-full border-0",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeBlockView);
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
