"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const HIDE_ALL_ROUTES = ["/login", "/signup", "/dashboard/editor"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideAll = HIDE_ALL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isDashboard = pathname.startsWith("/dashboard");

  if (hideAll) {
    return <>{children}</>;
  }

  // Dashboard: show Navbar but never Footer (admin, no marketing footer)
  if (isDashboard) {
    return (
      <>
        <Navbar />
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
