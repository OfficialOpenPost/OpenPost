"use client";

import { Hero3DSection } from "@/components/home/Hero3DSection";
import { InteractiveEditor3D } from "@/components/home/InteractiveEditor3D";
import { ContentModelingStudio } from "@/components/home/ContentModelingStudio";
import { ApiPlayground3D } from "@/components/home/ApiPlayground3D";
import { DashboardAnalytics3D } from "@/components/home/DashboardAnalytics3D";
import { SeoPerformance3D } from "@/components/home/SeoPerformance3D";
import { BlockShowcase3D } from "@/components/home/BlockShowcase3D";
import { ComparisonBenchmark3D } from "@/components/home/ComparisonBenchmark3D";
import { DeployEcosystem3D } from "@/components/home/DeployEcosystem3D";
import { Testimonials3D } from "@/components/home/Testimonials3D";
import { Cta3D } from "@/components/home/Cta3D";

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden bg-white text-navy min-h-screen">
      {/* 1. Hero 3D Spatial Content Canvas */}
      <Hero3DSection />

      {/* 2. Interactive Block Editor Studio Playground */}
      <InteractiveEditor3D />


      {/* 4. Structured Content Modeling & Schemas */}
      <ContentModelingStudio />

      {/* 5. Headless REST API Playground & Multi-Framework SDKs */}
      <ApiPlayground3D />

      {/* 6. Editorial Operations Pipeline & 5-Tier RBAC */}
      <DashboardAnalytics3D />

      {/* 7. Search-Ready SEO Engine & Lossless Media Pipeline */}
      <SeoPerformance3D />

      {/* 8. Interactive Content Block Playground */}
      <BlockShowcase3D />

      {/* 9. Publishing Architecture & Delivery Flow */}
      <ComparisonBenchmark3D />

      {/* 10. Deployment Freedom (openpost-cli, Docker, Supabase, Vercel) */}
      <DeployEcosystem3D />

      {/* 11. Open-Source Integrity & Product Proof */}
      <Testimonials3D />

      {/* 12. Final Call to Action */}
      <Cta3D />
    </div>
  );
}
