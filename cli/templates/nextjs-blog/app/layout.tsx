import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const SITE_NAME = process.env.SITE_NAME || "My Blog";
const SITE_TAGLINE = process.env.SITE_TAGLINE || "";
const SITE_DESCRIPTION = process.env.SITE_DESCRIPTION || "";
const SITE_LANGUAGE = process.env.SITE_LANGUAGE || "en";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION || SITE_TAGLINE || `${SITE_NAME} — powered by OpenPost`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={SITE_LANGUAGE} className="h-full">
      <body className="flex min-h-full flex-col bg-[#FAFBFC] text-slate-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
