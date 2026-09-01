"use client";

export function HeroCanvas3D() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Subtle light grid */}
      <div className="absolute inset-0 bg-light-grid opacity-60" />

      {/* Smooth drifting ambient lighting orbs (GPU accelerated) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[450px] w-[750px] rounded-full bg-gradient-to-b from-[#FEA611]/15 via-[#FE990E]/10 to-transparent blur-3xl animate-drift" />
      <div className="absolute top-1/4 -left-16 h-[320px] w-[320px] rounded-full bg-[#FE4F01]/8 blur-3xl animate-pulse-soft" />
      <div className="absolute top-1/3 -right-16 h-[320px] w-[320px] rounded-full bg-[#FEA611]/10 blur-3xl animate-pulse-soft" />
    </div>
  );
}
