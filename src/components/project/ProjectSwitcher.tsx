"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Plus,
  Check,
  ChevronDown,
  Loader2,
  Trash2,
} from "lucide-react";

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
  _count?: {
    blogs: number;
    categories: number;
    media: number;
  };
}

// Global client-side memory cache for zero-latency instant project switching
let globalProjectsCache: ProjectItem[] | null = null;
let globalActiveProjectCache: ProjectItem | null = null;

export function ProjectSwitcher() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>(() => globalProjectsCache || []);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(() => globalActiveProjectCache);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(!globalProjectsCache);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = useCallback(async (silent = false) => {
    try {
      if (!silent && !globalProjectsCache) setLoading(true);
      const res = await fetch("/api/projects", { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        globalProjectsCache = json.data;
        setProjects(json.data);
        const savedId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
        const matched = json.data.find((p: ProjectItem) => p.id === savedId) || json.data[0];
        globalActiveProjectCache = matched;
        setActiveProject(matched);
        if (typeof window !== "undefined") {
          localStorage.setItem("openpost_active_project_id", matched.id);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If cache is present, load silently in background; otherwise load with spinner
    loadProjects(Boolean(globalProjectsCache));
  }, [loadProjects]);

  const handleSelectProject = (project: ProjectItem) => {
    globalActiveProjectCache = project;
    setActiveProject(project);
    if (typeof window !== "undefined") {
      localStorage.setItem("openpost_active_project_id", project.id);
      window.dispatchEvent(new Event("projectChanged"));
    }
    setDropdownOpen(false);
  };

  const handleDeleteProject = async (proj: ProjectItem) => {
    if (!confirm(`Delete "${proj.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(proj.id);
      const res = await fetch(`/api/projects/${proj.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error?.message || "Failed to delete project.");
        return;
      }
      globalProjectsCache = null;
      if (proj.id === activeProject?.id) {
        const remaining = projects.filter((p) => p.id !== proj.id);
        if (remaining.length > 0) {
          handleSelectProject(remaining[0]);
        } else {
          setActiveProject(null);
          globalActiveProjectCache = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("openpost_active_project_id");
          }
        }
      }
      await loadProjects(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewProject = () => {
    setDropdownOpen(false);
    router.push("/projects/new");
  };

  return (
    <div className="relative p-3 border-b border-border bg-[#F9FAFB]">
      {/* Top Label */}
      <div className="flex items-center mb-1.5 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1">
          <Globe className="h-3 w-3 text-brand" /> Active Website / Project
        </span>
      </div>

      {/* Main Switcher Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-white p-2.5 shadow-xs hover:border-brand/40 hover:shadow-sm transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-navy font-extrabold text-xs">
            {activeProject?.name ? activeProject.name.slice(0, 2).toUpperCase() : "OP"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-navy truncate">
              {loading && !activeProject ? "Loading websites..." : activeProject?.name || "Main Publication"}
            </p>
            <p className="text-[10px] font-mono text-text-tertiary truncate">
              /{activeProject?.slug || "main"}
              {activeProject?._count?.blogs !== undefined
                ? ` · ${activeProject._count.blogs} posts`
                : ""}
            </p>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-text-tertiary transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Switcher Dropdown */}
      {dropdownOpen && (
        <div className="absolute left-3 right-3 top-[72px] z-50 rounded-xl border border-border bg-white p-1.5 shadow-xl">
          <div className="max-h-56 overflow-y-auto space-y-1">
            {projects.map((proj) => {
              const isSelected = proj.id === activeProject?.id;
              return (
                <div key={proj.id} className={`flex items-center rounded-lg transition ${isSelected ? "bg-brand/15" : "hover:bg-surface-dim"}`}>
                  <button
                    onClick={() => handleSelectProject(proj)}
                    className={`flex-1 flex items-center justify-between px-2.5 py-2 text-left text-xs min-w-0 cursor-pointer ${isSelected ? "font-bold text-navy" : "text-text-secondary"}`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold">{proj.name}</p>
                      <p className="text-[10px] text-text-tertiary font-mono truncate">
                        /{proj.slug}
                      </p>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-navy shrink-0" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(proj);
                    }}
                    disabled={deletingId === proj.id}
                    className="mr-1.5 p-1.5 rounded-md text-text-tertiary hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                    title={`Delete ${proj.name}`}
                  >
                    {deletingId === proj.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-1 pt-1 border-t border-border">
            <button
              onClick={handleNewProject}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-surface-dim p-2 text-xs font-bold text-navy hover:bg-brand hover:text-navy transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Create New Website
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
