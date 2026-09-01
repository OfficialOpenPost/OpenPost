"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";

export type HandlePosition = "nw" | "ne" | "sw" | "se";

interface FloatingResizeHandlesProps {
  /** Whether handles should be visible */
  visible: boolean;
  /** Whether aspect ratio should be locked */
  lockAspectRatio: boolean;
  /** Current aspect ratio (width / height) */
  aspectRatio: number;
  /** Current width in px */
  currentWidth: number;
  /** Current height in px */
  currentHeight: number;
  /** Min width constraint */
  minWidth?: number;
  /** Max width constraint */
  maxWidth?: number;
  /** Callback when resize completes */
  onResize: (width: number, height: number) => void;
  /** Callback during resize (live feedback) */
  onResizing?: (width: number, height: number) => void;
  /** Callback when resize starts */
  onResizeStart?: () => void;
  /** Callback when resize ends */
  onResizeEnd?: () => void;
}

export function FloatingResizeHandles({
  visible,
  lockAspectRatio,
  aspectRatio,
  currentWidth,
  currentHeight,
  minWidth = 80,
  maxWidth = 1200,
  onResize,
  onResizing,
  onResizeStart,
  onResizeEnd,
}: FloatingResizeHandlesProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [liveDims, setLiveDims] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{
    handle: HandlePosition;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (handle: HandlePosition, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentWidth,
        startHeight: currentHeight,
      };

      setIsDragging(true);
      setLiveDims({ w: currentWidth, h: currentHeight });
      onResizeStart?.();

      // Capture pointer for smooth drag outside element
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [currentWidth, currentHeight, onResizeStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();

      const { handle, startX, startY, startWidth, startHeight } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on which handle is being dragged
      switch (handle) {
        case "se":
          newWidth = startWidth + dx;
          newHeight = lockAspectRatio
            ? newWidth / aspectRatio
            : startHeight + dy;
          break;
        case "sw":
          newWidth = startWidth - dx;
          newHeight = lockAspectRatio
            ? newWidth / aspectRatio
            : startHeight + dy;
          break;
        case "ne":
          newWidth = startWidth + dx;
          newHeight = lockAspectRatio
            ? newWidth / aspectRatio
            : startHeight - dy;
          break;
        case "nw":
          newWidth = startWidth - dx;
          newHeight = lockAspectRatio
            ? newWidth / aspectRatio
            : startHeight - dy;
          break;
      }

      // Clamp
      newWidth = Math.max(minWidth, Math.min(maxWidth, Math.round(newWidth)));
      if (lockAspectRatio && aspectRatio > 0) {
        newHeight = Math.round(newWidth / aspectRatio);
      } else {
        newHeight = Math.max(40, Math.round(newHeight));
      }

      setLiveDims({ w: newWidth, h: newHeight });
      onResizing?.(newWidth, newHeight);
    },
    [lockAspectRatio, aspectRatio, minWidth, maxWidth, onResizing]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();

      const dims = liveDims;
      dragRef.current = null;
      setIsDragging(false);

      if (dims) {
        onResize(dims.w, dims.h);
      }
      setLiveDims(null);
      onResizeEnd?.();
    },
    [liveDims, onResize, onResizeEnd]
  );

  if (!visible) return null;

  const handles: HandlePosition[] = ["nw", "ne", "sw", "se"];

  return (
    <>
      {handles.map((pos) => (
        <div
          key={pos}
          className={`openpost-fi-resize-handle handle-${pos} ${
            isDragging ? "is-dragging" : ""
          }`}
          onPointerDown={(e) => handlePointerDown(pos, e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      ))}

      {/* Live dimensions display */}
      {isDragging && liveDims && (
        <div className="openpost-fi-dimensions">
          {liveDims.w} × {liveDims.h} px
        </div>
      )}
    </>
  );
}
