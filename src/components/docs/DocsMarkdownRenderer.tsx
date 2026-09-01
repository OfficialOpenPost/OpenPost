"use client";

import React, { useState } from "react";
import { Copy, Check, Info, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

export function CodeBlock({ code, language = "bash", filename }: { code: string; language?: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-5 max-w-full overflow-hidden rounded-xl border border-[#3A4250] bg-[#1E242E] text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-[#3A4250]/80 bg-[#161B22] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </span>
          {filename ? (
            <span className="font-mono text-slate-300 font-medium ml-2 truncate text-[11px] sm:text-xs">{filename}</span>
          ) : (
            <span className="font-mono uppercase text-[10px] tracking-wider text-slate-400 font-semibold ml-2 shrink-0">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors shrink-0 ml-2"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px] sm:text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3.5 sm:p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200">
        <pre className="m-0 whitespace-pre font-mono">{code}</pre>
      </div>
    </div>
  );
}

export function ApiMethodBadge({ method }: { method: string }) {
  const m = method.toUpperCase();
  let colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  if (m === "POST") colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/30";
  if (m === "PUT" || m === "PATCH") colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/30";
  if (m === "DELETE") colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/30";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border ${colorClass} shrink-0`}>
      {m}
    </span>
  );
}

export function CalloutAlert({ type, title, children }: { type: "note" | "tip" | "warning" | "important" | "caution"; title?: string; children: React.ReactNode }) {
  let icon = <Info className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500 shrink-0 mt-0.5" />;
  let border = "border-blue-200 bg-blue-50/50 text-blue-950";
  let defaultTitle = "Note";

  if (type === "tip") {
    icon = <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-500 shrink-0 mt-0.5" />;
    border = "border-emerald-200 bg-emerald-50/50 text-emerald-950";
    defaultTitle = "Tip";
  } else if (type === "warning" || type === "caution") {
    icon = <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-500 shrink-0 mt-0.5" />;
    border = "border-amber-200 bg-amber-50/50 text-amber-950";
    defaultTitle = "Warning";
  } else if (type === "important") {
    icon = <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-purple-500 shrink-0 mt-0.5" />;
    border = "border-purple-200 bg-purple-50/50 text-purple-950";
    defaultTitle = "Important";
  }

  return (
    <div className={`my-4 sm:my-5 flex gap-3 rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed max-w-full ${border}`}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="font-bold mb-1 text-xs sm:text-sm">{title || defaultTitle}</div>
        <div className="space-y-1.5 opacity-95 text-xs sm:text-[13px] break-words">{children}</div>
      </div>
    </div>
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function DocsMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for Code block
    if (line.trim().startsWith("```")) {
      const match = line.trim().match(/^```([a-zA-Z0-9_\-\.]+)?/);
      const rawLang = match ? match[1] || "" : "";
      const isFilename = rawLang.includes(".");
      const lang = isFilename ? rawLang.split(".").pop() || "code" : rawLang || "bash";
      const filename = isFilename ? rawLang : undefined;

      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <CodeBlock key={`code-${i}`} code={codeLines.join("\n")} language={lang} filename={filename} />
      );
      continue;
    }

    // Check for GitHub Alerts: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION]
    if (line.trim().startsWith("> [!")) {
      const alertMatch = line.trim().match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
      if (alertMatch) {
        const alertType = alertMatch[1].toLowerCase() as any;
        const alertTitle = alertMatch[2] || undefined;
        const alertLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          alertLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        elements.push(
          <CalloutAlert key={`alert-${i}`} type={alertType} title={alertTitle}>
            {alertLines.map((al, alIdx) => (
              <p key={alIdx}>{renderInlineMarkdown(al)}</p>
            ))}
          </CalloutAlert>
        );
        continue;
      }
    }

    // Standard Blockquote: > text
    if (line.trim().startsWith(">")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        bqLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="my-4 border-l-4 border-brand bg-brand/5 py-2 px-3.5 italic text-xs sm:text-sm text-text-secondary rounded-r-lg break-words">
          {bqLines.map((bl, bIdx) => (
            <p key={bIdx}>{renderInlineMarkdown(bl)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      const text = line.replace(/^#\s+/, "");
      const id = slugify(text);
      elements.push(
        <h1 key={`h1-${i}`} id={id} className="scroll-mt-24 mt-6 sm:mt-8 mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-navy break-words">
          {renderInlineMarkdown(text)}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      const text = line.replace(/^##\s+/, "");
      const id = slugify(text);
      elements.push(
        <h2 key={`h2-${i}`} id={id} className="scroll-mt-24 mt-8 sm:mt-10 mb-3 sm:mb-4 pb-2 text-xl sm:text-2xl font-bold tracking-tight text-navy border-b border-border flex items-center gap-2 group break-words">
          <a href={`#${id}`} className="hover:text-brand transition-colors">
            {renderInlineMarkdown(text)}
          </a>
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      const text = line.replace(/^###\s+/, "");
      const id = slugify(text);
      elements.push(
        <h3 key={`h3-${i}`} id={id} className="scroll-mt-24 mt-5 sm:mt-6 mb-2 sm:mb-3 text-base sm:text-lg font-bold text-navy flex items-center gap-2 group break-words">
          <a href={`#${id}`} className="hover:text-brand transition-colors">
            {renderInlineMarkdown(text)}
          </a>
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("#### ")) {
      const text = line.replace(/^####\s+/, "");
      const id = slugify(text);
      elements.push(
        <h4 key={`h4-${i}`} id={id} className="scroll-mt-24 mt-4 mb-2 text-sm sm:text-base font-semibold text-navy break-words">
          {renderInlineMarkdown(text)}
        </h4>
      );
      i++;
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCols = tableLines[0].split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((s) => s.trim());
        const rowLines = tableLines.slice(2);
        elements.push(
          <div key={`table-${i}`} className="my-5 sm:my-6 overflow-x-auto rounded-xl border border-border bg-white shadow-2xs max-w-full">
            <table className="w-full min-w-[480px] text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#FCFCF9] text-navy font-bold">
                  {headerCols.map((col, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-text-secondary">
                      {renderInlineMarkdown(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rowLines.map((row, rIdx) => {
                  const cells = row.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((s) => s.trim());
                  return (
                    <tr key={rIdx} className="hover:bg-surface-raised/60 transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-text-secondary leading-relaxed break-words">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Unordered list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 sm:my-4 space-y-1.5 list-disc pl-5 sm:pl-6 text-xs sm:text-sm text-text-secondary max-w-full">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="leading-relaxed break-words">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 sm:my-4 space-y-1.5 list-decimal pl-5 sm:pl-6 text-xs sm:text-sm text-text-secondary max-w-full">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="leading-relaxed pl-1 font-normal break-words">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      elements.push(<hr key={`hr-${i}`} className="my-6 sm:my-8 border-t border-border" />);
      i++;
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={`p-${i}`} className="my-2.5 sm:my-3 text-xs sm:text-sm md:text-base leading-relaxed text-text-secondary break-words">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="docs-content max-w-full overflow-hidden">{elements}</div>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const preText = text.substring(lastIndex, match.index);
    if (preText) {
      parts.push(renderFormatting(preText));
    }
    const linkText = match[1];
    const linkUrl = match[2];
    const isExternal = linkUrl.startsWith("http");

    parts.push(
      <a
        key={`link-${match.index}`}
        href={linkUrl}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer noopener" : undefined}
        className="font-medium text-brand hover:text-brand-dark underline decoration-brand/30 hover:decoration-brand transition-colors break-words"
      >
        {linkText}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderFormatting(text.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : text;
}

function renderFormatting(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const pre = text.substring(lastIndex, match.index);
    if (pre) tokens.push(pre);

    if (match[2]) {
      tokens.push(<strong key={`b-${match.index}`} className="font-bold text-navy">{match[2]}</strong>);
    } else if (match[3]) {
      const codeVal = match[3];
      if (/^(GET|POST|PUT|DELETE|PATCH)$/i.test(codeVal)) {
        tokens.push(<ApiMethodBadge key={`badge-${match.index}`} method={codeVal} />);
      } else {
        tokens.push(
          <code
            key={`c-${match.index}`}
            className="rounded bg-[#FCFCF9] border border-border px-1.5 py-0.5 font-mono text-[11px] sm:text-[12px] font-semibold text-navy break-all"
          >
            {codeVal}
          </code>
        );
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}
