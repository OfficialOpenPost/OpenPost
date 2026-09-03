"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CoverImageProps {
  src: string;
  alt: string;
}

export function CoverImage({ src, alt }: CoverImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="w-full h-[30vh] sm:h-[40vh] lg:h-[50vh] bg-slate-100 relative cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Click to enlarge
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
