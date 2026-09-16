"use client";

import { Hero3DSection } from "@/components/home/Hero3DSection";
import { SocialProofBar } from "@/components/home/SocialProofBar";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { InteractiveEditor3D } from "@/components/home/InteractiveEditor3D";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import { ApiPlayground3D } from "@/components/home/ApiPlayground3D";
import { ContentModelingStudio } from "@/components/home/ContentModelingStudio";
import { TechStackSection } from "@/components/home/TechStackSection";
import { Testimonials3D } from "@/components/home/Testimonials3D";
import { RecentPostsLive } from "@/components/home/RecentPostsLive";
import { Cta3D } from "@/components/home/Cta3D";

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden bg-white text-navy min-h-screen">
      {/* 1. Hero with 3D Canvas */}
      <Hero3DSection />

      {/* 2. Social Proof — metrics, trust signals */}
      <SocialProofBar />

      {/* 3. Features Grid — detailed icon cards with animations */}
      <FeaturesGrid />

      {/* 4. Interactive Editor Demo */}
      <InteractiveEditor3D />

      {/* 5. Editorial Workflow — RBAC pipeline */}
      <WorkflowSection />

      {/* 6. API Playground — live REST API demo */}
      <ApiPlayground3D />

      {/* 7. Content Modeling — schema-driven content */}
      <ContentModelingStudio />

      {/* 8. Tech Stack & Deployment Options */}
      <TechStackSection />

      {/* 9. Open Source Proof — trust pillars */}
      <Testimonials3D />

      {/* 10. Live Blog Feed — real data */}
      <RecentPostsLive />

      {/* 11. Final CTA */}
      <Cta3D />
    </div>
  );
}
