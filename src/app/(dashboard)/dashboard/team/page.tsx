"use client";
import { useState, useEffect } from "react";
import { Users, Clock, Check, X, Plus, Trash2, Loader2, Search, AlertTriangle, Shield, UserPlus } from "lucide-react";
import Link from "next/link";

interface TeamUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  memberships?: any[];
  createdAt: string;
}

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"pending"|"approved"|"suspended"|"rejected">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("CONTRIBUTOR");
  const [inviting, setInviting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string|null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string|null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      const pid = localStorage.getItem("openpost_active_project_id");
      setActiveProjectId(pid);
      // fetch project name
      if (pid) {
        fetch("/api/projects").then(r=>r.json()).then(j=>{
          const proj = (j.data||[]).find((p:any)=>p.id===pid);
          if (proj) setActiveProjectName(proj.name);
        }).catch(()=>{});
      }
      const url = pid ? `/api/settings/users?projectId=${pid}` : "/api/settings/users";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load team");
      setUsers(json.data.users || []);
    } catch (e:any) { setStatusMsg(e.message); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); const h=()=>load(); window.addEventListener("projectChanged",h); return()=>window.removeEventListener("projectChanged",h);},[]);

  const handleInvite = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!inviteEmail.trim()) return;
    if(!activeProjectId) { alert("Select a project first via top switcher."); return; }
    try { setInviting(true);
      const res = await fetch("/api/settings/users",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:inviteEmail.trim(), name:inviteName.trim(), role:inviteRole, projectId:activeProjectId})});
      const j = await res.json();
      if(!res.ok) throw new Error(j.error?.message||"Invite failed");
      await load(); setInviteEmail(""); setInviteName(""); setStatusMsg("Invitation sent / member added!"); setTimeout(()=>setStatusMsg(null),3000);
    } catch(e:any){ alert(e.message);} finally{setInviting(false);}
  };
  const updateStatus = async (id:string, status:string)=>{
    try{ const res=await fetch("/api/settings/users",{method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,status,projectId:activeProjectId||undefined})});
      const j=await res.json(); if(!res.ok) throw new Error(j.error?.message||"Failed");
      setUsers(prev=>prev.map(u=>u.id===id?{...u,status}:u)); setStatusMsg(`Status → ${status}`); setTimeout(()=>setStatusMsg(null),2000);
    } catch(e:any){ alert(e.message); }
  };
  const updateRole = async (id:string, role:string)=>{
    if(!activeProjectId) { alert("Select active project"); return; }
    try{ const res=await fetch("/api/settings/users",{method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,role,projectId:activeProjectId})});
      const j=await res.json(); if(!res.ok) throw new Error(j.error?.message||"Failed");
      setUsers(prev=>prev.map(u=>u.id===id?{...u,role}:u)); setStatusMsg(`Role → ${role}`); setTimeout(()=>setStatusMsg(null),2000);
    } catch(e:any){ alert(e.message); }
  };
  const remove = async (id:string)=>{
    if(!confirm("Remove this member from project?")) return;
    try{ const url = activeProjectId?`/api/settings/users?id=${id}&projectId=${activeProjectId}`:`/api/settings/users?id=${id}`;
      const res=await fetch(url,{method:"DELETE"}); const j=await res.json(); if(!res.ok) throw new Error(j.error?.message||"Failed");
      setUsers(prev=>prev.filter(u=>u.id!==id)); setStatusMsg("Member removed"); setTimeout(()=>setStatusMsg(null),2000);
    } catch(e:any){ alert(e.message); }
  };

  const pending = users.filter(u=>u.status==="pending");
  const filtered = users.filter(u=>{
    if(filter!=="all" && u.status!==filter) return false;
    if(roleFilter!=="all" && u.role!==roleFilter) return false;
    if(search && !(`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/15 flex items-center justify-center text-navy"><Users className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Team & Invites</h1>
            <p className="text-sm text-text-secondary">Invite collaborators, approve pending signups, manage roles — <span className="font-mono text-xs bg-surface-raised px-1.5 py-0.5 rounded">{activeProjectName || activeProjectId?.slice(0,8) || "no project selected"}</span></p>
          </div>
        </div>
        {statusMsg && <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800"><Check className="h-4 w-4" /> {statusMsg}</div>}
      </div>

      {!activeProjectId && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" /> Select an active project via the top switcher to manage its team. Until then, you’ll see all users across projects (limited).</div>
      )}

      {pending.length>0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
          <div className="flex items-center gap-2 text-amber-900"><Clock className="h-5 w-5 text-amber-600" /><h2 className="text-sm font-bold uppercase">Pending Approvals ({pending.length})</h2></div>
          <p className="text-xs text-amber-800/80 mt-1">New signups waiting for approval — they cannot access the project until approved.</p>
          <div className="mt-4 divide-y divide-amber-200/60">
            {pending.map(u=>(
              <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><p className="text-sm font-bold text-navy">{u.name}</p><p className="text-xs font-mono text-text-secondary">{u.email} · {u.role} · {new Date(u.createdAt).toLocaleDateString()}</p></div>
                <div className="flex gap-2">
                  <button onClick={()=>updateStatus(u.id,"approved")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5"/> Approve</button>
                  <button onClick={()=>updateStatus(u.id,"rejected")} className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700"><X className="h-3.5 w-3.5"/> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-sm font-bold uppercase text-navy flex items-center gap-2"><UserPlus className="h-4 w-4 text-brand" /> Invite Team Member</h2>
        <p className="text-xs text-text-secondary mt-1">Sends an invite to the active project. If the user already has an account, they’ll be added directly. Role controls publishing and settings access.</p>
        <form onSubmit={handleInvite} className="mt-4 grid gap-3 sm:grid-cols-12 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-navy mb-1">Email *</label>
            <input type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="writer@example.com" className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-navy mb-1">Name</label>
            <input type="text" value={inviteName} onChange={e=>setInviteName(e.target.value)} placeholder="Jane Doe" className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-navy mb-1">Role</label>
            <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className="w-full rounded-xl border border-border bg-white px-2.5 py-2 text-sm focus:border-brand focus:outline-none">
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="AUTHOR">Author</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={inviting} className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-navy hover:bg-brand-hover hover:text-white disabled:opacity-50 shadow-xs">{inviting?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>} Add / Invite</button>
          </div>
        </form>
        <p className="mt-2 text-[11px] text-text-tertiary">Permissions: <span className="font-bold">OWNER</span>=all, <span className="font-bold">ADMIN</span>=members+publish+settings, <span className="font-bold">EDITOR</span>=edit/publish, <span className="font-bold">AUTHOR</span>=own posts, <span className="font-bold">CONTRIBUTOR</span>=drafts only → submit for review. See <Link href="/dashboard/authors" className="text-brand hover:underline">Authors</Link> for bylines.</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-navy flex items-center gap-2"><Shield className="h-4 w-4 text-navy" /> Members · {filtered.length}/{users.length}</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name/email/role" className="h-9 rounded-xl border border-border bg-white pl-8 pr-3 text-xs focus:border-brand focus:outline-none" />
            </div>
            <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="h-9 rounded-xl border border-border bg-white px-2.5 text-xs font-bold">
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="h-9 rounded-xl border border-border bg-white px-2.5 text-xs font-bold">
              <option value="all">All roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="AUTHOR">Author</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </select>
          </div>
        </div>

        <div className="mt-4 divide-y divide-border">
          {loading? <p className="py-8 text-center text-sm text-text-tertiary flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading…</p> : filtered.length===0? <p className="py-8 text-center text-sm text-text-tertiary">No members match filters.</p> :
            filtered.map(u=>{
              const isApproved=u.status==="approved", isPending=u.status==="pending", isSuspended=u.status==="suspended";
              return (
                <div key={u.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-brand/20 flex items-center justify-center text-xs font-bold text-navy">{u.name?u.name.slice(0,2).toUpperCase():u.email.slice(0,2).toUpperCase()}</div>
                    <div>
                      <div className="flex items-center gap-2"><p className="text-sm font-bold text-navy">{u.name}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase border ${isApproved?"bg-emerald-50 text-emerald-700 border-emerald-200":isPending?"bg-amber-50 text-amber-700 border-amber-200":isSuspended?"bg-slate-100 text-slate-700 border-slate-300":"bg-rose-50 text-rose-700 border-rose-200"}`}>{u.status}</span><span className="rounded-full bg-navy text-white px-1.5 py-0.5 text-[9px] font-bold">{u.role}</span></div>
                      <p className="text-xs font-mono text-text-tertiary">{u.email} · since {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={u.role} onChange={e=>updateRole(u.id,e.target.value)} className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-bold">
                      <option value="OWNER">OWNER</option><option value="ADMIN">ADMIN</option><option value="EDITOR">EDITOR</option><option value="AUTHOR">AUTHOR</option><option value="CONTRIBUTOR">CONTRIBUTOR</option>
                    </select>
                    {isApproved && <button onClick={()=>updateStatus(u.id,"suspended")} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-surface-raised">Suspend</button>}
                    {isSuspended && <button onClick={()=>updateStatus(u.id,"approved")} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Reactivate</button>}
                    {isPending && <button onClick={()=>updateStatus(u.id,"approved")} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">Approve</button>}
                    <button onClick={()=>remove(u.id)} className="p-1.5 text-text-tertiary hover:text-flame"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              )
            })
          }
        </div>
        <p className="mt-4 text-[11px] text-text-tertiary">Tip: Role changes and removals are audited at <Link href="/dashboard/audit" className="text-brand hover:underline">Audit Logs</Link>. Owner role is protected — sole owner cannot be demoted. Use <span className="font-mono">openpost_active_project_id</span> in localStorage as UI preference only; server verifies membership every request.</p>
      </div>
    </div>
  )
}
