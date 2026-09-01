"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Clock } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F1] p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-navy">
          <Clock className="h-7 w-7 text-brand" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-navy">Account Awaiting Approval</h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Your account is currently in <span className="font-bold text-navy">Pending</span> status. An administrator must approve your registration before you can access OpenPost publications and projects.
        </p>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Status: Pending Approval
        </div>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-3">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-navy-light transition shadow-xs"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
