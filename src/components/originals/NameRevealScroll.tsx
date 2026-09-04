"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_VISUALS = Array.from({ length: 6 }, (_, i) => `/name-reveal-scroll/project_img_${i + 1}.jpg`);
const NAME_COLORS = ["#9841FF", "#FF00FF", "#FFFF04", "#01FF00", "#FF4701", "#FF00FF", "#79B9FF"];
const DEFAULT_NAMES = ["INDEX", "AR-0472", "VX-2210", "KL-8834", "TN-1197", "MR-6650", "SC-3389"];

export default function NameRevealScroll({
  labels = DEFAULT_NAMES,
  images = DEFAULT_VISUALS,
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  labels?: string[];
  images?: string[];
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const nameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const visualRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const names = nameRefs.current.filter(Boolean) as HTMLDivElement[];
    const visuals = visualRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!root || names.length === 0) return;

    const stepCount = names.length - 1;
    const driftAmount = 300;

    names.forEach((name, i) => gsap.set(name, { zIndex: i }));
    visuals.forEach((visual, i) => gsap.set(visual, { zIndex: 100 + i, scale: 0 }));

    function updateNames(progress: number) {
      const position = progress * stepCount;
      const current = Math.min(Math.floor(position), stepCount - 1);
      const local = gsap.utils.clamp(0, 1, position - current);
      names.forEach((name, i) => {
        if (i < current) gsap.set(name, { scaleY: 0, transformOrigin: "top center" });
        else if (i === current) gsap.set(name, { scaleY: 1 - local, transformOrigin: "top center" });
        else if (i === current + 1) gsap.set(name, { scaleY: local, transformOrigin: "bottom center" });
        else gsap.set(name, { scaleY: 0, transformOrigin: "bottom center" });
      });
    }

    function updateVisuals(progress: number) {
      const position = progress * stepCount;
      visuals.forEach((visual, idx) => {
        const project = idx + 1;
        const local = position - (project - 1);
        let scale = 0;
        let yPercent = 0;
        if (local > 0 && local < 1) {
          scale = local;
        } else if (local >= 1 && local < 2) {
          const exit = local - 1;
          scale = 1 - exit;
          yPercent = -exit * driftAmount;
        }
        gsap.set(visual, { scale, yPercent, transformOrigin: "bottom left" });
      });
    }

    function update(progress: number) {
      updateNames(progress);
      updateVisuals(progress);
    }
    update(0);

    const rate = Math.max(0.2, speed / 100);
    let progress = 0;
    let target = 0;

    let userDriven = false;
    function onWheel(e: WheelEvent) {
      const next = gsap.utils.clamp(0, 1, target + e.deltaY * 0.0008 * rate);
      // At either end, let the wheel fall through so the page keeps scrolling.
      if (next === target) return;
      e.preventDefault();
      userDriven = true;
      target = next;
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    let autoDir = 1;
    function loop() {
      if (autoPlay && !userDriven) {
        target += autoDir * 0.005 * rate;
        if (target >= 1) {
          target = 1;
          autoDir = -1;
        } else if (target <= 0) {
          target = 0;
          autoDir = 1;
        }
      }
      progress += (target - progress) * 0.08;
      update(progress);
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("wheel", onWheel);
    };
  }, [speed, autoPlay, labels, images]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-[#0f0f0f] p-4" style={{ fontFamily }}>
      <div className="relative w-full h-full overflow-hidden">
        {labels.map((label, i) => (
          <div
            key={label + i}
            ref={(el) => {
              nameRefs.current[i] = el;
            }}
            className={`absolute top-0 right-0 h-full flex items-center justify-end will-change-transform ${i === 0 ? "w-full" : "w-3/4"}`}
          >
            <span
              className="font-display font-black uppercase leading-none whitespace-nowrap"
              style={{ color: NAME_COLORS[i % NAME_COLORS.length], fontSize: `clamp(calc(2.5rem * ${scale}),calc(9vw * ${scale}),calc(6rem * ${scale}))` }}
            >
              {label}
            </span>
          </div>
        ))}
        {images.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              visualRefs.current[i] = el;
            }}
            className="absolute bottom-0 left-0 rounded-lg overflow-hidden will-change-transform"
            style={{ width: "35%", maxWidth: 160, aspectRatio: "1" }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
