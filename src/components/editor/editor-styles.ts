export const EDITOR_STYLES = `
  /* Tiptap / OpenPost Universal Content Styles */
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

  .tiptap table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.75rem 0;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #E2E8F0;
    clear: both;
  }

  .tiptap hr {
    clear: both;
  }

  .tiptap ::selection {
    background: rgba(254,166,17,0.28);
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
