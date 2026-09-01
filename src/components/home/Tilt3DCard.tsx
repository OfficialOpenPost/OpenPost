"use client";

import { type ReactNode } from "react";

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
}

export function Tilt3DCard({ children, className = "" }: Tilt3DCardProps) {
  return (
    <div
      className={`relative rounded-2xl border border-border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#FEA611]/5 hover:border-brand/30 ${className}`}
    >
      {children}
    </div>
  );
}
