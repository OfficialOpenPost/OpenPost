import React from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export const metadata = {
  title: "OpenPost Documentation — Architecture, Setup & Headless REST API",
  description: "Comprehensive documentation, Supabase setup guides, Cloudflare R2 media configuration, REST API reference, and deployment for OpenPost CMS.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white w-full">
      <div className="w-full flex flex-col lg:flex-row items-start">
        <DocsSidebar />
        <main className="flex-1 min-w-0 w-full px-4 sm:px-8 lg:px-10 2xl:px-14 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
