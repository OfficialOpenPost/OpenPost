"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
}

export function HeroCanvas3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Viewport intersection observer to ensure 0% CPU usage when offscreen
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Track mouse coordinates for 3D perspective distortion
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseRef.current.targetX = nx * 80;
    mouseRef.current.targetY = ny * 80;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // 3D Canvas rendering loop
  useEffect(() => {
    if (!isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 800);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || window.innerWidth;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 800;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // OpenPost brand color palette with luminous variations
    const colors = [
      "rgba(254, 166, 17, 0.85)", // #FEA611 Brand Gold
      "rgba(254, 79, 1, 0.8)",    // #FE4F01 Flame
      "rgba(254, 153, 14, 0.8)",  // #FE990E Orange
      "rgba(254, 166, 17, 0.6)",  // Translucent Gold
      "rgba(45, 52, 64, 0.5)",    // #2D3440 Navy
    ];

    // Increased 3D particles in a spatial volume (Denser, richer constellation)
    const particleCount = width < 768 ? 65 : 140;
    const particles: Particle3D[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.3,
        y: (Math.random() - 0.5) * height * 1.3,
        z: Math.random() * 700 + 50,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3.2 + 1.2,
        color: colors[i % colors.length],
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    const focalLength = 380;

    const render = () => {
      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseRef.current.x * (width / 1000);
      const centerY = height / 2 + mouseRef.current.y * (height / 700);

      // Draw subtle perspective horizon lines (3D spatial grid)
      ctx.save();
      ctx.strokeStyle = "rgba(45, 52, 64, 0.04)";
      ctx.lineWidth = 1;

      for (let i = -7; i <= 7; i++) {
        const startX = centerX + i * 85;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 100);
        ctx.lineTo(startX + i * 130, height);
        ctx.stroke();
      }
      ctx.restore();

      // Update and project 3D particles to 2D screen
      const projected: Array<{ sx: number; sy: number; scale: number; p: Particle3D }> = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around boundaries in 3D space
        if (p.z <= 10) p.z = 750;
        if (p.z > 750) p.z = 10;
        if (p.x < -width * 0.8) p.x = width * 0.8;
        if (p.x > width * 0.8) p.x = -width * 0.8;
        if (p.y < -height * 0.8) p.y = height * 0.8;
        if (p.y > height * 0.8) p.y = -height * 0.8;

        const scale = focalLength / (focalLength + p.z);
        const sx = centerX + p.x * scale;
        const sy = centerY + p.y * scale;

        if (sx >= -60 && sx <= width + 60 && sy >= -60 && sy <= height + 60) {
          projected.push({ sx, sy, scale, p });
        }
      }

      // Draw interactive connections between nearby 3D nodes
      ctx.lineWidth = 0.85;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 125) {
            const opacity = (1 - dist / 125) * 0.22 * ((a.scale + b.scale) / 2);
            ctx.strokeStyle = `rgba(254, 166, 17, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // Draw glowing 3D nodes with depth lighting
      for (let i = 0; i < projected.length; i++) {
        const { sx, sy, scale, p } = projected[i];
        const r = p.size * scale * (window.devicePixelRatio || 1);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = "#FEA611";
        ctx.shadowBlur = 6 * scale;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 3D Perspective Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-85"
      />

      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-[#FEA611]/15 via-[#FE990E]/8 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 h-[380px] w-[380px] rounded-full bg-[#FE4F01]/6 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-20 h-[380px] w-[380px] rounded-full bg-[#FEA611]/8 blur-3xl pointer-events-none" />
    </div>
  );
}
