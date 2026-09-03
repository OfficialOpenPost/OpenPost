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
    overflow: hidden;
    margin: 1.5rem 0;
    clear: both;
    max-width: 100%;
    border: 1px solid #CBD5E1;
  }

  .tiptap table {
    border-collapse: collapse;
    table-layout: auto;
    width: 100%;
    margin: 0;
    background-color: #FFFFFF;
    box-sizing: border-box;
  }

  .tiptap table td,
  .tiptap table th {
    min-width: 2rem;
    border: 1px solid #CBD5E1;
    padding: 0.75rem 1rem;
    vertical-align: top;
    box-sizing: border-box;
    position: relative;
    font-size: 0.9375rem;
    overflow: hidden;
    word-wrap: break-word;
    overflow-wrap: break-word;
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

  /* ── Column Resize Handle (Tiptap resizable: true) ── */
  .tiptap table .column-resize-handle {
    position: absolute;
    right: -2px;
    top: 0;
    bottom: -2px;
    width: 4px;
    background-color: #6C63FF;
    pointer-events: none;
    z-index: 25;
    opacity: 0;
    transition: opacity 0.15s ease;
    border-radius: 2px;
  }

  .tiptap table td:hover .column-resize-handle,
  .tiptap table th:hover .column-resize-handle {
    opacity: 1;
  }

  .tiptap.resize-cursor {
    cursor: col-resize;
  }
  .tiptap.resize-cursor .column-resize-handle {
    opacity: 1;
    background-color: #6C63FF;
  }

  /* Selected cell highlight */
  .tiptap .selectedCell:after {
    z-index: 2;
    position: absolute;
    content: "";
    left: 0; right: 0; top: 0; bottom: 0;
    background: rgba(108, 99, 255, 0.08) !important;
    border: 1.5px solid #6C63FF !important;
    pointer-events: none;
  }

  /* Selected table outline */
  .tiptap table.ProseMirror-selectednode {
    outline: 2px solid #6C63FF !important;
    outline-offset: 2px;
  }

  /* Row/column grip handles */
  .tiptap .grip-column,
  .tiptap .grip-row {
    position: absolute;
    cursor: pointer;
    background: #E2E8F0;
    z-index: 10;
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
`;
