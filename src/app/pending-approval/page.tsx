"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Clock, Mail, User, Calendar, ArrowRight, Shield } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{
    email: string;
    displayName: string;
    status: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/auth/user-status");
        if (res.ok) {
          const data = await res.json();
          if (data.status === "approved") {
            window.location.href = "/dashboard";
            return;
          }
          if (data.status === "unauthenticated") {
            router.push("/login");
            return;
          }
          setUserInfo(data);
        }
      } catch {
        // Stay on page
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    // Poll every 10 seconds to check if admin approved
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F1]">
        <Clock className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F1] p-6">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-navy">
          <Clock className="h-8 w-8 text-brand" />
        </div>

        <h1 className="mt-5 text-2xl font-extrabold text-navy">Account Awaiting Approval</h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
          Your account is currently in <span className="font-bold text-navy">Pending</span> status.
          An administrator must approve your registration before you can access OpenPost.
        </p>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Status: Pending Approval
        </div>

        {/* User Details Card */}
        {userInfo && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-left">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Your Registration Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <User className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary">Name</p>
                  <p className="text-sm font-bold text-navy">{userInfo.displayName || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <Mail className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary">Email</p>
                  <p className="text-sm font-bold text-navy">{userInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <Calendar className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary">Registered</p>
                  <p className="text-sm font-bold text-navy">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <Shield className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary">Pending Role</p>
                  <p className="text-sm font-bold text-navy">To be assigned by admin</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl bg-surface-dim border border-border p-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-navy">What happens next?</strong>
            <br />
            An administrator will review your registration and assign your project role.
            You&apos;ll be automatically redirected once approved. This page auto-refreshes every 10 seconds.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex items-center justify-center gap-3">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-navy-dark transition shadow-xs"
          >
            <ArrowRight className="h-4 w-4" /> Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
