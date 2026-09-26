"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SharedRender } from "@/components/render/SharedRender";
import { EDITOR_STYLES } from "@/components/editor/extensions";

interface PrintDocumentProps {
  doc: unknown;
  title?: string;
  meta?: string;
  heroSrc?: string | null;
  onClose: () => void;
}

export function PrintDocument({ doc, title, meta, heroSrc, onClose }: PrintDocumentProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const handleAfterPrint = () => onCloseRef.current();
    window.addEventListener("afterprint", handleAfterPrint);
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      cancelAnimationFrame(frame);
    };
  }, []);

  return createPortal(
    <div id="print-root">
      {heroSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroSrc} alt={title || "Cover image"} />
      )}
      <h1>{title || "Untitled Article"}</h1>
      {meta && <p className="print-meta">{meta}</p>}
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
      <div className="tiptap max-w-none">
        <SharedRender content={doc as Parameters<typeof SharedRender>[0]["content"]} />
      </div>
    </div>,
    document.body
  );
}
