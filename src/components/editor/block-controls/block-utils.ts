export const BLOCK_TYPE_LABELS: Record<string, string> = {
  paragraph: "Text",
  heading: "Heading",
  bulletList: "Bullet List",
  orderedList: "Numbered List",
  taskList: "Checklist",
  blockquote: "Quote",
  codeBlock: "Code",
  image: "Image",
  youtube: "Video",
  videoBlock: "Video",
  callout: "Callout",
  gallery: "Gallery",
  faq: "FAQ",
  accordion: "Accordion",
  buttonBlock: "Button",
  downloadBlock: "Download",
  socialEmbed: "Social Embed",
  pollBlock: "Poll",
  table: "Table",
  horizontalRule: "Divider",
  embedBlock: "Embed",
};

export function getBlockLabel(nodeName: string, attrs?: Record<string, any>): string {
  if (nodeName === "heading") {
    return `Heading ${attrs?.level ?? 2}`;
  }
  return BLOCK_TYPE_LABELS[nodeName] ?? nodeName;
}

export function getBlockIcon(nodeName: string, attrs?: Record<string, any>): string {
  if (nodeName === "heading") {
    const level = attrs?.level ?? 2;
    return `H${level}`;
  }
  const icons: Record<string, string> = {
    paragraph: "\u00B6",
    bulletList: "\u2022",
    orderedList: "1.",
    taskList: "\u2611",
    blockquote: "\u201C",
    codeBlock: "</>",
    image: "\uD83D\uDDBC",
    youtube: "\u25B6",
    videoBlock: "\u25B6",
    callout: "\uD83D\uDCA1",
    gallery: "\uD83D\uDDBC",
    faq: "?",
    accordion: "\u25BC",
    buttonBlock: "\uD83D\uDD18",
    downloadBlock: "\uD83D\uDCCE",
    socialEmbed: "\uD83D\uDD17",
    pollBlock: "\uD83D\uDCCA",
    table: "\u25A6",
    horizontalRule: "\u2014",
    embedBlock: "\uD83D\uDD17",
  };
  return icons[nodeName] ?? "\u25AA";
}
