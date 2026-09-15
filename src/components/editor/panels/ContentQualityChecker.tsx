"use client";

import React, { useMemo } from "react";
import { type Editor } from "@tiptap/react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ImageIcon,
  Type,
  List,
  Heading,
  Link,
  FileText,
} from "lucide-react";

interface QualityCheckerProps {
  editor: Editor | null;
  title: string;
  featuredImage: string | null;
  excerpt: string;
  seoDesc: string;
  category: string;
}

interface QualityIssue {
  id: string;
  level: "error" | "warning" | "info" | "pass";
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ContentQualityChecker({
  editor,
  title,
  featuredImage,
  excerpt,
  seoDesc,
  category,
}: QualityCheckerProps) {
  const issues = useMemo(() => {
    const list: QualityIssue[] = [];
    if (!editor) return list;

    const text = editor.getText() || "";
    const json = editor.getJSON();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Count headings
    let h2Count = 0;
    let h3Count = 0;
    let imageCount = 0;
    let linkCount = 0;
    let listCount = 0;
    let emptyBlocks = 0;

    const walk = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "heading") {
          if (node.attrs?.level === 1) h2Count++;
          if (node.attrs?.level === 2) h2Count++;
          if (node.attrs?.level === 3) h3Count++;
        }
        if (node.type === "image") imageCount++;
        if (node.type === "text" && node.marks?.some((m: any) => m.type === "link")) linkCount++;
        if (node.type === "bulletList" || node.type === "orderedList" || node.type === "taskList") listCount++;
        // Empty paragraph check
        if (node.type === "paragraph" && (!node.content || node.content.length === 0)) emptyBlocks++;
        if (node.content) walk(node.content);
      }
    };
    if (json.content) walk(json.content);

    // Title checks
    if (!title || title.trim().length === 0) {
      list.push({ id: "no-title", level: "error", message: "Article has no title", icon: Type });
    } else if (title.length < 10) {
      list.push({ id: "short-title", level: "warning", message: "Title is very short (under 10 characters)", icon: Type });
    } else if (title.length > 70) {
      list.push({ id: "long-title", level: "warning", message: "Title is long (over 70 characters) — may be truncated in search results", icon: Type });
    } else {
      list.push({ id: "title-ok", level: "pass", message: "Title length is good", icon: Type });
    }

    // Word count
    if (wordCount < 100) {
      list.push({ id: "short-article", level: "warning", message: `Article is short (${wordCount} words) — aim for 300+ words`, icon: FileText });
    } else {
      list.push({ id: "word-count-ok", level: "pass", message: `Good word count (${wordCount} words)`, icon: FileText });
    }

    // Featured image
    if (!featuredImage) {
      list.push({ id: "no-featured", level: "warning", message: "No featured image set", icon: ImageIcon });
    } else {
      list.push({ id: "featured-ok", level: "pass", message: "Featured image is set", icon: ImageIcon });
    }

    // Excerpt
    if (!excerpt || excerpt.trim().length === 0) {
      list.push({ id: "no-excerpt", level: "info", message: "No excerpt — will be auto-generated from content", icon: FileText });
    } else {
      list.push({ id: "excerpt-ok", level: "pass", message: "Excerpt is set", icon: FileText });
    }

    // SEO description
    if (!seoDesc || seoDesc.trim().length === 0) {
      list.push({ id: "no-seo-desc", level: "warning", message: "No meta description — important for SEO", icon: FileText });
    } else {
      list.push({ id: "seo-desc-ok", level: "pass", message: "Meta description is set", icon: FileText });
    }

    // Category
    if (!category) {
      list.push({ id: "no-category", level: "info", message: "No category assigned", icon: FileText });
    } else {
      list.push({ id: "category-ok", level: "pass", message: `Category: ${category}`, icon: FileText });
    }

    // Headings
    if (h2Count === 0 && h3Count === 0) {
      list.push({ id: "no-headings", level: "warning", message: "No subheadings (H2/H3) — use headings to structure your content", icon: Heading });
    } else {
      list.push({ id: "headings-ok", level: "pass", message: `Content has ${h2Count} H2 and ${h3Count} H3 headings`, icon: Heading });
    }

    // Images
    if (imageCount === 0 && wordCount > 300) {
      list.push({ id: "no-images", level: "info", message: "No images in content — consider adding visuals", icon: ImageIcon });
    }

    // Links
    if (linkCount === 0 && wordCount > 500) {
      list.push({ id: "no-links", level: "info", message: "No links in content — internal/external links improve SEO", icon: Link });
    }

    // Lists
    if (listCount === 0 && wordCount > 500) {
      list.push({ id: "no-lists", level: "info", message: "No lists found — lists improve readability", icon: List });
    }

    // Empty blocks
    if (emptyBlocks > 3) {
      list.push({ id: "empty-blocks", level: "warning", message: `${emptyBlocks} empty paragraphs — consider removing blank lines`, icon: FileText });
    }

    return list;
  }, [editor, title, featuredImage, excerpt, seoDesc, category]);

  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;
  const passCount = issues.filter((i) => i.level === "pass").length;

  const overallScore = issues.length > 0
    ? Math.round((passCount / issues.length) * 100)
    : 0;

  const scoreColor = overallScore >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : overallScore >= 50 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";

  const levelConfig = {
    error: { cls: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
    warning: { cls: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle },
    info: { cls: "text-blue-600 bg-blue-50 border-blue-200", icon: Info },
    pass: { cls: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  };

  return (
    <div className="space-y-3">
      {/* Score Badge */}
      <div className={`flex items-center justify-between p-3 rounded-xl border ${scoreColor}`}>
        <span className="text-xs font-bold">Content Quality</span>
        <span className="text-sm font-black">{overallScore}%</span>
      </div>

      {/* Summary */}
      <div className="flex gap-2 text-[10px] font-semibold">
        {errorCount > 0 && <span className="text-red-600">{errorCount} errors</span>}
        {warningCount > 0 && <span className="text-amber-600">{warningCount} warnings</span>}
        <span className="text-emerald-600">{passCount} passed</span>
      </div>

      {/* Issues List */}
      <div className="space-y-1.5">
        {issues.map((issue) => {
          const config = levelConfig[issue.level];
          const Icon = config.icon;
          return (
            <div
              key={issue.id}
              className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${config.cls}`}
            >
              <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="leading-snug">{issue.message}</span>
            </div>
          );
        })}
      </div>

      {issues.length === 0 && (
        <p className="text-xs text-text-tertiary text-center py-4">
          Start writing to see content quality suggestions
        </p>
      )}
    </div>
  );
}
