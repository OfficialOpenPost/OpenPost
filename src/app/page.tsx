"use client";

import { Hero3DSection } from "@/components/home/Hero3DSection";
import { InteractiveEditor3D } from "@/components/home/InteractiveEditor3D";
import { ApiPlayground3D } from "@/components/home/ApiPlayground3D";
import { DashboardAnalytics3D } from "@/components/home/DashboardAnalytics3D";
import { SeoPerformance3D } from "@/components/home/SeoPerformance3D";
import { BlockShowcase3D } from "@/components/home/BlockShowcase3D";
import { ComparisonBenchmark3D } from "@/components/home/ComparisonBenchmark3D";
import { DeployEcosystem3D } from "@/components/home/DeployEcosystem3D";
import { RecentPostsLive } from "@/components/home/RecentPostsLive";
import { Testimonials3D } from "@/components/home/Testimonials3D";
import { Cta3D } from "@/components/home/Cta3D";

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden bg-white text-navy min-h-screen">
      {/* 1. Light Hero Section */}
      <Hero3DSection />

      {/* 2. Live CMS Data Stream */}
      <RecentPostsLive />

      {/* 3. Interactive Block Editor Studio Playground */}
      <InteractiveEditor3D />

      {/* 4. Headless REST API Playground & Architecture */}
      <ApiPlayground3D />

      {/* 5. Content Management Pipeline & RBAC */}
      <DashboardAnalytics3D />

      {/* 6. Built-in SEO Intelligence & WebP Engine */}
      <SeoPerformance3D />

      {/* 7. 16+ Content Blocks Showcase */}
      <BlockShowcase3D />

      {/* 8. Performance Benchmark Comparison */}
      <ComparisonBenchmark3D />

      {/* 9. Deployment Freedom (CLI, Docker, Supabase, Vercel) */}
      <DeployEcosystem3D />

      {/* 10. Customer Stories & Creator Reviews */}
      <Testimonials3D />

      {/* 11. Final Call to Action */}
      <Cta3D />
    </div>
  );
}
