import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "OpenPost Blog — High Performance Headless Publication",
    template: "%s — OpenPost Blog",
  },
  description: "A fast, modern blog powered by OpenPost CMS with real-time editing, CDN delivery, and interactive features.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-[#FAFBFC] text-slate-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
