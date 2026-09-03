"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash2, User, X, Globe, AlertTriangle, Image as ImageIcon, Link2, Upload } from "lucide-react";
import { slugify } from "@/lib/slug";
import { useDebounce } from "@/hooks/useDebounce";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  email: string | null;
  website: string | null;
  social: { twitter?: string; linkedin?: string };
  photoId: string | null;
  photoUrl?: string | null;
  linkedUserId?: string | null;
  linkedUserEmail?: string | null;
  postCount: number;
}

interface MemberOption {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

interface MediaItem {
  id: string;
  url: string | null;
  name: string;
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [editing, setEditing] = useState<Author | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Author & { twitter: string; linkedin: string }>>({ name: "", slug: "", bio: "", email: "", website: "", twitter: "", linkedin: "", photoId: null, linkedUserId: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // picker states
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pid = localStorage.getItem("openpost_active_project_id");
      setActiveProjectId(pid);
    } catch {}
  }, [showModal]);

  const fetchAuthors = async (q?: string) => {
    try {
      setLoading(true);
      let url = "/api/v1/authors";
      // include project scoping via header param if available
      const pid = localStorage.getItem("openpost_active_project_id");
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (pid) params.set("project", pid);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setAuthors(json.data.map((a: any) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          bio: a.bio,
          email: a.email,
          website: a.website,
          social: a.socialLinks ?? a.social ?? {},
          photoId: a.photoId ?? null,
          photoUrl: a.photoUrl ?? null,
          linkedUserId: a.linkedUserId ?? null,
          linkedUserEmail: a.linkedUserEmail ?? null,
          postCount: a.postCount ?? 0,
        })));
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAuthors(debouncedSearch || undefined);
    const h = () => fetchAuthors(debouncedSearch || undefined);
    window.addEventListener("projectChanged", h);
    return () => window.removeEventListener("projectChanged", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchMembers = async () => {
    try {
      const pid = localStorage.getItem("openpost_active_project_id");
      const url = pid ? `/api/settings/users?projectId=${pid}` : "/api/settings/users";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data?.users) {
        setMembers(json.data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name || u.email.split("@")[0],
          role: u.role,
          status: u.status,
        })).filter((u: MemberOption) => u.status === "approved"));
      }
    } catch {}
  };
  const fetchMedia = async () => {
    try {
      const pid = localStorage.getItem("openpost_active_project_id");
      const url = pid ? `/api/media?projectId=${pid}&limit=50` : "/api/media?limit=50";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setMediaList(json.data.map((m: any) => ({ id: m.id, url: m.url || m.publicUrl || null, name: m.name || m.originalFilename })));
      }
    } catch {}
  };

  useEffect(() => {
    if (showModal) {
      fetchMembers();
      fetchMedia();
    }
  }, [showModal]);

  const filtered = authors.filter((a) => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return true;
    return a.name.toLowerCase().includes(q) || a.slug.includes(q) || (a.bio && a.bio.toLowerCase().includes(q));
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", bio: "", email: "", website: "", twitter: "", linkedin: "", photoId: null, linkedUserId: null });
    setError(null);
    setMemberSearch("");
    setShowModal(true);
  };
  const openEdit = (a: Author) => {
    setEditing(a);
    setForm({ ...a, twitter: a.social.twitter ?? "", linkedin: a.social.linkedin ?? "" });
    setError(null);
    setMemberSearch("");
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!form.name?.trim()) { setError("Name is required"); return; }
    setSaving(true); setError(null);
    try {
      const slug = slugify(form.slug || form.name || "");
      if (!slug) throw new Error("Invalid slug");
      const pid = localStorage.getItem("openpost_active_project_id");
      const payload: any = {
        name: form.name!.trim(),
        slug,
        bio: form.bio || null,
        email: form.email || null,
        website: form.website || null,
        twitter: form.twitter || null,
        linkedin: form.linkedin || null,
        photoId: form.photoId || null,
        linkedUserId: form.linkedUserId || null,
        projectId: pid || undefined,
      };
      const url = editing ? `/api/v1/authors/${editing.id}` : "/api/v1/authors";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      await fetchAuthors(debouncedSearch);
      setShowModal(false);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const handleDelete = async (a: Author) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/authors/${a.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { if (json.error?.code === "IN_USE") { setDeleteError(json.error.message + (json.error.details?.examples ? ` [${json.error.details.examples.join(", ")}]` : "")); return; } throw new Error(json.error?.message ?? "Delete failed"); }
      setAuthors((prev) => prev.filter((x) => x.id !== a.id));
      setDeleteTarget(null);
    } catch (e: any) { setDeleteError(e.message); }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pid = localStorage.getItem("openpost_active_project_id");
      const formData = new FormData();
      formData.append("file", file);
      if (pid) formData.append("projectId", pid);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      setForm((prev) => ({ ...prev, photoId: json.data.id }));
      // add to mediaList for preview
      setMediaList((prev) => [{ id: json.data.id, url: json.data.publicUrl, name: json.data.name || file.name }, ...prev]);
    } catch (err: any) { setError(err.message); }
  };

  const selectedPhotoUrl = form.photoId ? (mediaList.find((m) => m.id === form.photoId)?.url || null) : null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Authors</h1>
          <p className="mt-1 text-sm text-text-secondary">Public bylines — linked to user accounts or guest authors. Supports co-authors. <a href="/dashboard/team" className="text-brand hover:underline font-semibold">Invite & approve team →</a></p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
          <Plus className="h-4 w-4" /> New Author
        </button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search authors..." className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((author) => (
          <div key={author.id} className="rounded-2xl border border-border bg-surface p-6 flex flex-col hover:border-brand/20 hover:shadow-md transition min-h-[260px]">
            <div className="flex items-start justify-between">
              {author.photoUrl ? (
                <img src={author.photoUrl} alt={author.name} className="h-12 w-12 rounded-2xl object-cover border border-border" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange text-white font-bold">
                  {author.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="flex gap-1">
                <button onClick={() => openEdit(author)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                  <Edit3 className="h-3.5 w-3.5 text-text-secondary" />
                </button>
                <button onClick={() => setDeleteTarget(author)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <h3 className="mt-4 text-base font-bold text-navy">{author.name}</h3>
            <p className="font-mono text-xs text-brand">/{author.slug}</p>
            <p className="mt-2 text-sm text-text-secondary line-clamp-2">{author.bio ?? "No bio"}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary flex-wrap">
              <span>{author.postCount} {author.postCount === 1 ? "post" : "posts"}</span>
              {author.linkedUserEmail && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><Link2 className="h-3 w-3" /> Linked</span>}
              {author.email && <span className="hidden sm:inline">· {author.email}</span>}
              {author.website && (
                <>
                  <span>·</span>
                  <a href={author.website} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                    <Globe className="h-3 w-3" /> Website
                  </a>
                </>
              )}
            </div>
            {(author.social.twitter || author.social.linkedin) && (
              <div className="mt-3 flex gap-2">
                {author.social.twitter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-1 text-xs">
                    𝕏 {author.social.twitter}
                  </span>
                )}
                {author.social.linkedin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-1 text-xs">
                    in {author.social.linkedin}
                  </span>
                )}
              </div>
            )}
            {author.linkedUserEmail && <p className="mt-2 text-[11px] font-mono text-text-tertiary">{author.linkedUserEmail}</p>}
          </div>
        ))}
      </div>

      {loading && <p className="py-8 text-center text-sm text-text-tertiary">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="py-12 text-center text-sm text-text-tertiary">No authors found.</p>}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600"><AlertTriangle className="h-5 w-5" /><h3 className="font-bold text-navy">Delete author?</h3></div>
            <p className="mt-3 text-sm text-text-secondary">Delete <span className="font-semibold">{deleteTarget.name}</span>?</p>
            {deleteError && <p className="mt-3 rounded-xl bg-flame/10 p-3 text-sm text-flame">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(null); }} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="rounded-xl bg-flame px-5 py-2.5 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">{editing ? "Edit Author" : "New Author"}</h2>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-raised">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {/* Photo Picker */}
              <div>
                <label className="text-sm font-medium text-text-primary flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Profile Photo</label>
                <div className="mt-2 flex items-center gap-3">
                  {selectedPhotoUrl ? (
                    <img src={selectedPhotoUrl} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-border" />
                  ) : form.photoId ? (
                    <div className="h-16 w-16 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-xs text-text-tertiary">ID: {form.photoId.slice(0, 6)}</div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-surface-raised border border-dashed border-border flex items-center justify-center"><User className="h-6 w-6 text-text-tertiary" /></div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold hover:bg-surface-raised cursor-pointer">
                      <Upload className="h-3.5 w-3.5" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                    </label>
                    <button onClick={() => setShowMediaPicker((v) => !v)} className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold hover:bg-surface-raised">
                      <ImageIcon className="h-3.5 w-3.5" /> Choose from Media
                    </button>
                    {form.photoId && (
                      <button onClick={() => setForm({ ...form, photoId: null })} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-raised text-flame">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {showMediaPicker && (
                  <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-border bg-surface-raised p-2 grid grid-cols-3 gap-2">
                    {mediaList.length === 0 ? <p className="col-span-3 text-center text-xs text-text-tertiary py-4">No media found.</p> : mediaList.map((m) => (
                      <button key={m.id} onClick={() => { setForm({ ...form, photoId: m.id }); setShowMediaPicker(false); }} className={`relative rounded-xl overflow-hidden border ${form.photoId === m.id ? "border-brand ring-2 ring-brand/30" : "border-border"} bg-white`}>
                        {m.url ? <img src={m.url} alt={m.name} className="h-20 w-full object-cover" /> : <div className="h-20 flex items-center justify-center text-xs">{m.name}</div>}
                        <span className="absolute bottom-0 left-0 right-0 bg-navy/70 text-white text-[10px] px-1 py-0.5 truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary">Name *</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="Priya Sharma" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Slug</label>
                <input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="priya-sharma" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                <p className="mt-1 text-[11px] text-text-tertiary">Unique per project. Used in /authors/{form.slug || "slug"}</p>
              </div>
              {/* Linked User Picker */}
              <div>
                <label className="text-sm font-medium text-text-primary flex items-center gap-1"><Link2 className="h-4 w-4" /> Link to User (optional)</label>
                <p className="text-[11px] text-text-tertiary">Guest author: leave empty. Linked author: select an approved project member (same project).</p>
                <div className="mt-1 relative">
                  <select
                    value={form.linkedUserId ?? ""}
                    onChange={(e) => setForm({ ...form, linkedUserId: e.target.value || null })}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">— No linked user (guest author) —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email}) — {m.role}</option>
                    ))}
                  </select>
                </div>
                {form.linkedUserId && <p className="mt-1 text-xs text-emerald-700">Linked to project member — author byline will stay even if membership changes.</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary">Bio</label>
                <textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Short bio..." className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">Email (internal)</label>
                  <input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="priya@example.com" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Website</label>
                  <input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">Twitter</label>
                  <input value={form.twitter ?? ""} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@username" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">LinkedIn</label>
                  <input value={form.linkedin ?? ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="username" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>
            </div>
            {error && <p className="mt-4 rounded-xl bg-flame/10 p-3 text-sm text-flame">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
