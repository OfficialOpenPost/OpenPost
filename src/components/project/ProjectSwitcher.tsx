"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  Check,
  ChevronDown,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  FolderPlus,
  Loader2,
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

export function ProjectSwitcher() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Project Form State
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Projects from API
  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        setProjects(json.data);
        
        // Check saved project in localStorage or default to first
        const savedId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
        const matched = json.data.find((p: ProjectItem) => p.id === savedId) || json.data[0];
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
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSelectProject = (project: ProjectItem) => {
    setActiveProject(project);
    if (typeof window !== "undefined") {
      localStorage.setItem("openpost_active_project_id", project.id);
      window.dispatchEvent(new Event("projectChanged"));
    }
    setDropdownOpen(false);
  };

  const handleAutoSlug = (name: string) => {
    setNewName(name);
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setNewSlug(generated);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      setError("Please provide both website name and slug.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
          description: newDesc.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create website project.");
      }

      // Refresh list and select new project
      setNewName("");
      setNewSlug("");
      setNewDesc("");
      setModalOpen(false);
      await loadProjects();
      if (json.data) {
        handleSelectProject(json.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative p-3 border-b border-border bg-[#F9FAFB]">
      {/* Top Label */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1">
          <Globe className="h-3 w-3 text-brand" /> Active Website / Project
        </span>
        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="text-[10px] font-bold text-brand hover:text-navy transition flex items-center gap-0.5"
          title="Add New Website Project"
        >
          <Plus className="h-3 w-3" /> Add Website
        </button>
      </div>

      {/* Main Switcher Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-white p-2.5 shadow-xs hover:border-brand/40 hover:shadow-sm transition text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-navy font-extrabold text-xs">
            {activeProject?.name ? activeProject.name.slice(0, 2).toUpperCase() : "OP"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-navy truncate">
              {loading ? "Loading websites..." : activeProject?.name || "Main Publication"}
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
                <button
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    isSelected
                      ? "bg-brand/15 font-bold text-navy"
                      : "text-text-secondary hover:bg-surface-dim hover:text-navy"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-semibold">{proj.name}</p>
                    <p className="text-[10px] text-text-tertiary font-mono truncate">
                      /{proj.slug}
                    </p>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-navy shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-1 border-t border-border">
            <button
              onClick={() => {
                setDropdownOpen(false);
                setError(null);
                setModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-surface-dim p-2 text-xs font-bold text-navy hover:bg-brand hover:text-navy transition"
            >
              <Plus className="h-3.5 w-3.5" /> Create New Website
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog: Add New Website Project */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-navy">
                  <FolderPlus className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Add New Website</h3>
                  <p className="text-[11px] text-text-tertiary">Create a separate publication or client blog</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-tertiary hover:text-navy hover:bg-surface-dim"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3.5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Website Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering Blog, Client Portal"
                  value={newName}
                  onChange={(e) => handleAutoSlug(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Slug / Unique Path *
                </label>
                <div className="flex items-center rounded-lg border border-border bg-surface-dim px-3 py-2 text-xs text-text-secondary focus-within:border-brand focus-within:bg-white">
                  <span className="text-text-tertiary font-mono">openpost.app/</span>
                  <input
                    type="text"
                    placeholder="engineering-blog"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="flex-1 bg-transparent font-mono text-xs text-navy focus:outline-none ml-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of this publication..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-dim hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {creating ? "Creating Website..." : "Create Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
