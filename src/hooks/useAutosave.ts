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

export function useAutosave({
  id,
  data,
  onSave,
  debounceMs = 3000,
  safetyIntervalMs = 60000,
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const dataRef = useRef(data);
  const lastSavedJsonRef = useRef<string>("");
  const isInitialMount = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  dataRef.current = data;

  const save = useCallback(async () => {
    const currentJson = JSON.stringify(dataRef.current);
    // If nothing changed since last save, do not hit the database
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    // If document is completely empty untitled draft on initial load, skip save
    const parsed: any = dataRef.current || {};
    if (!parsed.title && (!parsed.html || parsed.html === "<p></p>")) {
      return;
    }

    setStatus("saving");
    try {
      saveDraftLocal(id, dataRef.current).catch(() => {});
      await onSave(dataRef.current);
      lastSavedJsonRef.current = currentJson;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [id, onSave]);

  // Debounced save only when data actually changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedJsonRef.current = JSON.stringify(data);
      return;
    }

    const currentJson = JSON.stringify(data);
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    setStatus("unsaved");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, debounceMs, save]);

  // Periodic safety save every 60s (only if dirty)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const currentJson = JSON.stringify(dataRef.current);
      if (currentJson !== lastSavedJsonRef.current) {
        save();
      }
    }, safetyIntervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [save, safetyIntervalMs]);

  // Save on blur
  useEffect(() => {
    const handler = () => {
      const currentJson = JSON.stringify(dataRef.current);
      if (currentJson !== lastSavedJsonRef.current) {
        save();
      }
    };
    window.addEventListener("blur", handler);
    return () => window.removeEventListener("blur", handler);
  }, [save]);

  // Save before unload
  useEffect(() => {
    const handler = () => {
      try {
        saveDraftLocal(id, dataRef.current);
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [id]);

  return { status, save };
}
