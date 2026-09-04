export const EDITOR_STYLES = `
  /* Tiptap / OpenPost Universal Content Styles */
  .tiptap,
  .tiptap:focus,
  .tiptap:focus-visible,
  .ProseMirror,
  .ProseMirror:focus,
  .ProseMirror:focus-visible,
  .ProseMirror-focused {
    outline: none !important;
    outline-width: 0 !important;
    box-shadow: none !important;
  }

  .tiptap {
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  .tiptap::after {
    content: "";
    display: table;
    clear: both;
  }

  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #94A3B8;
    pointer-events: none;
    height: 0;
  }

  .tiptap p {
    margin: 0.85rem 0;
    line-height: 1.85;
    font-size: 1.125rem;
    color: #2D3440;
    text-wrap: pretty;
    overflow: visible;
  }

  .tiptap h1 {
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.025em;
    margin: 2.5rem 0 1rem;
    color: #1E293B;
  }

  .tiptap h2 {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
    margin: 2rem 0 0.85rem;
    color: #1E293B;
  }

  .tiptap h3 {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.35;
    margin: 1.75rem 0 0.75rem;
    color: #334155;
  }

  .tiptap h4 {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 1.5rem 0 0.5rem;
    color: #334155;
  }

  .tiptap a {
    color: #FE4F01;
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-color: rgba(254,79,1,0.3);
    transition: text-decoration-color 0.15s ease;
  }

  .tiptap a:hover {
    text-decoration-color: #FE4F01;
  }

  .tiptap code {
    background: #F1F5F9;
    color: #0F172A;
    padding: 0.2em 0.45em;
    border-radius: 6px;
    font-size: 0.875em;
    font-family: ui-monospace, monospace;
    border: 1px solid #E2E8F0;
  }

  .tiptap pre {
    background: #1E293B;
    color: #F8FAFC;
    padding: 1.25rem;
    border-radius: 16px;
    overflow-x: auto;
    margin: 1.75rem 0;
    border: 1px solid #334155;
    clear: both;
  }

  .tiptap pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  /* ── Tiptap Table ── */
  .tiptap .tableWrapper {
    overflow-x: auto;
    margin: 1.5rem 0;
    clear: both;
    max-width: 100%;
    border: 1px solid #CBD5E1;
  }

  .tiptap table {
    border-collapse: collapse;
    table-layout: auto;
    width: 100%;
    max-width: 100%;
    margin: 0;
    background-color: #FFFFFF;
    box-sizing: border-box;
  }

  .tiptap table td,
  .tiptap table th {
    min-width: 2rem;
    max-width: 50%;
    border: 1px solid #CBD5E1;
    padding: 0.75rem 1rem;
    vertical-align: top;
    box-sizing: border-box;
    position: relative;
    font-size: 0.9375rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .tiptap table th {
    font-weight: 700;
    text-align: left;
    background-color: #F1F5F9;
    color: #0F172A;
    border-bottom: 2px solid #94A3B8;
  }

  .tiptap table th p,
  .tiptap table td p {
    margin: 0 !important;
    font-size: inherit;
    line-height: 1.5;
    color: inherit;
  }

  .tiptap hr {
    clear: both;
  }

  .tiptap ::selection {
    background: rgba(108, 99, 255, 0.2);
  }

  /* Text alignment */
  .tiptap [style*="text-align: center"] { text-align: center !important; }
  .tiptap [style*="text-align: right"] { text-align: right !important; }
  .tiptap [style*="text-align: justify"] { text-align: justify !important; }
  .tiptap [style*="text-align: left"] { text-align: left !important; }

  /* Floating Image Styles for Content & Preview */
  figure.openpost-floating-image,
  .prose figure.openpost-floating-image {
    box-sizing: border-box !important;
    position: relative !important;
    max-width: 100% !important;
  }
  figure.openpost-floating-image[data-float="left"],
  .prose figure.openpost-floating-image[data-float="left"] {
    float: left !important;
    clear: left !important;
    max-width: 80% !important;
    margin-right: 1.75rem !important;
    margin-bottom: 1rem !important;
    margin-top: 0.5rem !important;
  }
  figure.openpost-floating-image[data-float="right"],
  .prose figure.openpost-floating-image[data-float="right"] {
    float: right !important;
    clear: right !important;
    max-width: 80% !important;
    margin-left: 1.75rem !important;
    margin-bottom: 1rem !important;
    margin-top: 0.5rem !important;
  }
  figure.openpost-floating-image[data-layout="wide"],
  .prose figure.openpost-floating-image[data-layout="wide"] {
    float: none !important;
    clear: both !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  figure.openpost-floating-image[data-layout="center"],
  .prose figure.openpost-floating-image[data-layout="center"] {
    float: none !important;
    clear: both !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* Card and Image constraints in preview */
  figure.openpost-floating-image .openpost-fi-card,
  .prose figure.openpost-floating-image .openpost-fi-card {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  figure.openpost-floating-image img,
  .prose figure.openpost-floating-image img {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    object-fit: contain !important;
  }

  /* Clearfix for preview and published posts */
  .prose::after, .tiptap::after {
    content: "";
    display: table;
    clear: both;
  }
  .prose figure.openpost-floating-image {
    margin-top: 0.5rem;
    margin-bottom: 0.75rem;
  }

  /* Mobile Responsive overrides for Content, Images, Polls & Floating Blocks */
  @media (max-width: 639px) {
    figure.openpost-floating-image,
    .prose figure.openpost-floating-image,
    figure.openpost-floating-image[data-float="left"],
    figure.openpost-floating-image[data-float="right"],
    .prose figure.openpost-floating-image[data-float="left"],
    .prose figure.openpost-floating-image[data-float="right"],
    .floating-image-render,
    .openpost-floating-image-node,
    .openpost-floating-image-node[data-float="left"],
    .openpost-floating-image-node[data-float="right"],
    .openpost-image-card,
    .openpost-poll-card,
    .openpost-poll-node,
    .openpost-poll-block,
    [data-poll-block],
    .image-align-left,
    .image-align-right,
    .image-align-center,
    .image-align-wide {
      float: none !important;
      clear: both !important;
      width: 100% !important;
      max-width: 100% !important;
      margin-left: auto !important;
      margin-right: auto !important;
      margin-top: 1.25rem !important;
      margin-bottom: 1.25rem !important;
      display: block !important;
      text-align: center !important;
    }

    figure.openpost-floating-image img,
    .prose figure.openpost-floating-image img,
    .floating-image-render img,
    .openpost-floating-image-node img,
    .openpost-image-card img {
      margin-left: auto !important;
      margin-right: auto !important;
      display: block !important;
      max-width: 100% !important;
      height: auto !important;
    }

    figcaption,
    .prose figcaption {
      text-align: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .openpost-poll-card > div,
    .openpost-poll-block > div,
    .openpost-image-card > div,
    .image-align-left > div,
    .image-align-right > div {
      margin-left: auto !important;
      margin-right: auto !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    .openpost-table, table.openpost-table, .tiptap table {
      display: block !important;
      width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
  }

  /* Mobile Preview Mode overrides (forces full-width centered layout on any screen width) */
  .preview-mobile figure.openpost-floating-image,
  .preview-mobile .prose figure.openpost-floating-image,
  .preview-mobile figure.openpost-floating-image[data-float="left"],
  .preview-mobile figure.openpost-floating-image[data-float="right"],
  .preview-mobile .prose figure.openpost-floating-image[data-float="left"],
  .preview-mobile .prose figure.openpost-floating-image[data-float="right"],
  .preview-mobile .floating-image-render,
  .preview-mobile .openpost-floating-image-node,
  .preview-mobile .openpost-floating-image-node[data-float="left"],
  .preview-mobile .openpost-floating-image-node[data-float="right"],
  .preview-mobile .openpost-image-card,
  .preview-mobile .openpost-poll-card,
  .preview-mobile .openpost-poll-node,
  .preview-mobile .openpost-poll-block,
  .preview-mobile [data-poll-block],
  .preview-mobile .image-align-left,
  .preview-mobile .image-align-right,
  .preview-mobile .image-align-center,
  .preview-mobile .image-align-wide,
  [data-preview-viewport="mobile"] figure.openpost-floating-image,
  [data-preview-viewport="mobile"] .prose figure.openpost-floating-image,
  [data-preview-viewport="mobile"] figure.openpost-floating-image[data-float="left"],
  [data-preview-viewport="mobile"] figure.openpost-floating-image[data-float="right"],
  [data-preview-viewport="mobile"] .prose figure.openpost-floating-image[data-float="left"],
  [data-preview-viewport="mobile"] .prose figure.openpost-floating-image[data-float="right"],
  [data-preview-viewport="mobile"] .floating-image-render,
  [data-preview-viewport="mobile"] .openpost-floating-image-node,
  [data-preview-viewport="mobile"] .openpost-image-card,
  [data-preview-viewport="mobile"] .openpost-poll-card,
  [data-preview-viewport="mobile"] .openpost-poll-node,
  [data-preview-viewport="mobile"] .openpost-poll-block,
  [data-preview-viewport="mobile"] [data-poll-block],
  [data-preview-viewport="mobile"] .image-align-left,
  [data-preview-viewport="mobile"] .image-align-right,
  [data-preview-viewport="mobile"] .image-align-center,
  [data-preview-viewport="mobile"] .image-align-wide {
    float: none !important;
    clear: both !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    margin-top: 1.25rem !important;
    margin-bottom: 1.25rem !important;
    display: block !important;
    text-align: center !important;
  }

  .preview-mobile figure.openpost-floating-image img,
  .preview-mobile .prose figure.openpost-floating-image img,
  .preview-mobile .floating-image-render img,
  .preview-mobile .openpost-floating-image-node img,
  .preview-mobile .openpost-image-card img,
  [data-preview-viewport="mobile"] figure.openpost-floating-image img,
  [data-preview-viewport="mobile"] .prose figure.openpost-floating-image img,
  [data-preview-viewport="mobile"] .floating-image-render img,
  [data-preview-viewport="mobile"] .openpost-floating-image-node img,
  [data-preview-viewport="mobile"] .openpost-image-card img {
    margin-left: auto !important;
    margin-right: auto !important;
    display: block !important;
    max-width: 100% !important;
    height: auto !important;
  }

  .preview-mobile figcaption,
  .preview-mobile .prose figcaption,
  [data-preview-viewport="mobile"] figcaption,
  [data-preview-viewport="mobile"] .prose figcaption {
    text-align: center !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .preview-mobile .openpost-poll-card > div,
  .preview-mobile .openpost-poll-block > div,
  .preview-mobile .openpost-image-card > div,
  .preview-mobile .image-align-left > div,
  .preview-mobile .image-align-right > div,
  [data-preview-viewport="mobile"] .openpost-poll-card > div,
  [data-preview-viewport="mobile"] .openpost-poll-block > div,
  [data-preview-viewport="mobile"] .openpost-image-card > div,
  [data-preview-viewport="mobile"] .image-align-left > div,
  [data-preview-viewport="mobile"] .image-align-right > div {
    margin-left: auto !important;
    margin-right: auto !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Tablet Responsive overrides */
  @media (min-width: 640px) and (max-width: 1023px) {
    figure.openpost-floating-image[data-float="left"],
    .prose figure.openpost-floating-image[data-float="left"],
    .openpost-floating-image-node[data-float="left"] {
      float: left !important;
      clear: none !important;
      max-width: 38% !important;
      margin-right: 1.25rem !important;
      margin-bottom: 0.75rem !important;
    }
    figure.openpost-floating-image[data-float="right"],
    .prose figure.openpost-floating-image[data-float="right"],
    .openpost-floating-image-node[data-float="right"] {
      float: right !important;
      clear: none !important;
      max-width: 38% !important;
      margin-left: 1.25rem !important;
      margin-bottom: 0.75rem !important;
    }
    .openpost-poll-card,
    .openpost-poll-node,
    .openpost-poll-block,
    [data-poll-block] {
      max-width: 100% !important;
    }
    .openpost-poll-card[data-poll-align="left"],
    [data-poll-block][data-poll-align="left"] {
      float: left !important;
      clear: none !important;
      max-width: 100% !important;
      margin-right: 1.25rem !important;
      margin-bottom: 0.75rem !important;
    }
    .openpost-poll-card[data-poll-align="right"],
    [data-poll-block][data-poll-align="right"] {
      float: right !important;
      clear: none !important;
      max-width: 100% !important;
      margin-left: 1.25rem !important;
      margin-bottom: 0.75rem !important;
    }
  }

  /* Tablet Preview mode overrides */
  .preview-tablet figure.openpost-floating-image[data-float="left"],
  .preview-tablet .prose figure.openpost-floating-image[data-float="left"],
  .preview-tablet .openpost-floating-image-node[data-float="left"],
  [data-preview-viewport="tablet"] figure.openpost-floating-image[data-float="left"],
  [data-preview-viewport="tablet"] .prose figure.openpost-floating-image[data-float="left"],
  [data-preview-viewport="tablet"] .openpost-floating-image-node[data-float="left"] {
    float: left !important;
    clear: none !important;
    width: 38% !important;
    max-width: 290px !important;
    margin-right: 1.25rem !important;
    margin-bottom: 0.75rem !important;
    margin-left: 0 !important;
    display: block !important;
  }

  .preview-tablet figure.openpost-floating-image[data-float="right"],
  .preview-tablet .prose figure.openpost-floating-image[data-float="right"],
  .preview-tablet .openpost-floating-image-node[data-float="right"],
  [data-preview-viewport="tablet"] figure.openpost-floating-image[data-float="right"],
  [data-preview-viewport="tablet"] .prose figure.openpost-floating-image[data-float="right"],
  [data-preview-viewport="tablet"] .openpost-floating-image-node[data-float="right"] {
    float: right !important;
    clear: none !important;
    width: 38% !important;
    max-width: 290px !important;
    margin-left: 1.25rem !important;
    margin-bottom: 0.75rem !important;
    margin-right: 0 !important;
    display: block !important;
  }

  .preview-tablet .openpost-poll-card,
  .preview-tablet .openpost-poll-node,
  .preview-tablet .openpost-poll-block,
  .preview-tablet [data-poll-block],
  [data-preview-viewport="tablet"] .openpost-poll-card,
  [data-preview-viewport="tablet"] .openpost-poll-node,
  [data-preview-viewport="tablet"] .openpost-poll-block,
  [data-preview-viewport="tablet"] [data-poll-block] {
    max-width: 100% !important;
  }
`;
