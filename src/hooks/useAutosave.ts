"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { saveDraftLocal } from "@/lib/indexedDB";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface UseAutosaveOptions {
  id: string;
  data: unknown;
  onSave: (data: unknown) => Promise<void>;
  debounceMs?: number;
  safetyIntervalMs?: number;
}

export function useAutosave({ id, data, onSave, debounceMs = 2000, safetyIntervalMs = 30000 }: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const dataRef = useRef(data);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  dataRef.current = data;

  const save = useCallback(async () => {
    setStatus("saving");
    try {
      // Mirror to IndexedDB for crash recovery (fire-and-forget)
      saveDraftLocal(id, dataRef.current).catch(() => {});
      await onSave(dataRef.current);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [id, onSave]);

  // Debounced save on change
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("unsaved");
    timeoutRef.current = setTimeout(save, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, debounceMs, save]);

  // Safety net every 30s
  useEffect(() => {
    intervalRef.current = setInterval(save, safetyIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [save, safetyIntervalMs]);

  // Save on blur
  useEffect(() => {
    const handler = () => save();
    window.addEventListener("blur", handler);
    return () => window.removeEventListener("blur", handler);
  }, [save]);

  // Save before unload with sendBeacon fallback
  useEffect(() => {
    const handler = () => {
      try {
        const payload = JSON.stringify(dataRef.current);
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/blogs/autosave", blob);
        }
      } catch {}
      // Also try sync save to IDB
      try {
        saveDraftLocal(id, dataRef.current);
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [id]);

  return { status, save };
}
