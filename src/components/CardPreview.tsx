"use client";

import { useEffect, useRef } from "react";
import { mulberry32, renderEffect, type EffectMode, type Params } from "@/lib/effects";
import { defaultParams } from "@/lib/controls";

export default function CardPreview({
  effect,
  seed,
  palette,
  label,
  className,
  still = false,
  paused = false,
  params,
}: {
  effect: EffectMode;
  seed: number;
  palette: [string, string];
  label: string;
  className?: string;
  still?: boolean;
  paused?: boolean;
  params?: Params;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resolvedParams = params ?? defaultParams(effect, palette);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        running = entries[0]?.isIntersecting ?? true;
        if (running) loop(performance.now());
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    function draw(t: number) {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const rand = mulberry32(seed);
      renderEffect({ ctx, w, h, t, rand, palette, label, effect, params: resolvedParams });
    }

    function loop(now: number) {
      if (!running || !canvas || !ctx) return;
      if (paused) {
        if (pausedAtRef.current === null) pausedAtRef.current = (now - start) / 1000;
        draw(pausedAtRef.current);
        raf = requestAnimationFrame(loop);
        return;
      }
      pausedAtRef.current = null;
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    }

    if (still) {
      draw(1.2);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [effect, seed, palette, label, still, paused, params]);

  return <canvas ref={canvasRef} className={className} />;
}
