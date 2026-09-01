"use client";

import { useState } from "react";
import { Settings, Globe, Users, Image as ImageIcon, Search, Clock, Shield, Database, PenTool } from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "users", label: "Users", icon: Users },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "seo", label: "SEO", icon: Search },
  { id: "publishing", label: "Publishing", icon: Clock },
  { id: "api", label: "API", icon: Database },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [active, setActive] = useState("general");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Settings</h1>
          <p className="text-sm text-text-secondary">Manage site, users, media, SEO, and API configuration.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-white p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition ${active === tab.id ? "bg-navy text-white shadow-sm" : "text-text-secondary hover:bg-surface-raised hover:text-navy"}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {active === "general" && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-base font-bold text-navy">General</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-primary">Site Name</label>
                  <input defaultValue="OpenPost" className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Timezone</label>
                    <select className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-brand focus:outline-none">
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>Asia/Kolkata</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-primary">Default Locale</label>
                    <select className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-brand focus:outline-none">
                      <option>en-US</option>
                      <option>fr-FR</option>
                    </select>
                  </div>
                </div>
                <button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover">Save Changes</button>
              </div>
            </div>
          )}

          {active === "users" && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-base font-bold text-navy">Users</h2>
              <p className="mt-2 text-sm text-text-secondary">Invite and manage team members. Roles: Owner, Admin, Editor, Author, Contributor.</p>
              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-text-tertiary" />
                <p className="mt-3 text-sm font-semibold text-navy">Invite your team</p>
                <p className="text-sm text-text-secondary">Contributors cannot publish without review — perfect for agency workflows.</p>
              </div>
            </div>
          )}

          {active === "media" && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-base font-bold text-navy">Media</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between rounded-lg bg-surface-raised p-3">
                  <span className="text-text-secondary">Storage</span>
                  <span className="font-mono text-xs text-navy">R2 • pub-7091...r2.dev</span>
                </div>
                <div className="flex justify-between rounded-lg bg-surface-raised p-3">
                  <span className="text-text-secondary">Variants</span>
                  <span className="font-medium text-navy">480 / 768 / 1200 / 1920 + WebP + AVIF</span>
                </div>
                <div className="flex justify-between rounded-lg bg-surface-raised p-3">
                  <span className="text-text-secondary">Max size</span>
                  <span className="font-medium text-navy">25 MB · 8000×8000px</span>
                </div>
              </div>
            </div>
          )}

          {active === "seo" && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-base font-bold text-navy">SEO</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Title Template</label>
                  <input defaultValue="%title% · OpenPost" className="mt-1 h-11 w-full rounded-xl border border-border px-3 text-sm focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Default Description</label>
                  <textarea rows={2} defaultValue="Professional blog CMS and writing studio." className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none resize-none" />
                </div>
              </div>
            </div>
          )}

          {(active === "publishing" || active === "api" || active === "security") && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-base font-bold text-navy capitalize">{active}</h2>
              <p className="mt-2 text-sm text-text-secondary">Configure {active} settings. Production-ready defaults are already set — change only if you need custom behavior.</p>
              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
                <PenTool className="mx-auto h-8 w-8 text-text-tertiary" />
                <p className="mt-3 text-sm font-semibold text-navy">Coming soon</p>
                <p className="text-sm text-text-secondary">Full {active} controls ship in Stage 2 polish.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
