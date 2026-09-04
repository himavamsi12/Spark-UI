"use client";

import { useEffect, useRef } from "react";

const SLIDES = [
  { title: "Studioform", accent: "#a9d0f5" },
  { title: "Nightbloom", accent: "#f5a97a" },
  { title: "Stillpose", accent: "#b7e0a0" },
  { title: "Matchawork", accent: "#c9a97a" },
  { title: "Blurface", accent: "#e8e8e8" },
];

type Side = "left" | "right";

export default function DualColumnSlider({
  speed = 100,
  autoPlay = true,
  fontFamily = "var(--font-inter), sans-serif",
  textScale = 100,
}: {
  speed?: number;
  autoPlay?: boolean;
  fontFamily?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const leftCol = leftRef.current;
    const rightCol = rightRef.current;
    if (!root || !leftCol || !rightCol) return;

    const sensitivity = 1200 / Math.max(0.2, speed / 100);
    const smoothness = 0.05;
    const bufferSlides = 2;
    const revealOverlap = 0.5;

    const columns: Record<Side, { el: HTMLDivElement; visible: Map<number, HTMLDivElement> }> = {
      left: { el: leftCol, visible: new Map() },
      right: { el: rightCol, visible: new Map() },
    };

    let scrollPosition = 1;
    let scrollTarget = 1;
    let autoDrift = autoPlay ? 0.0035 * (speed / 100) : 0;

    function createSlide(side: Side, index: number) {
      const slideIndex = ((index % SLIDES.length) + SLIDES.length) % SLIDES.length;
      const data = SLIDES[slideIndex];
      const el = document.createElement("div");
      el.className = "absolute inset-0 overflow-hidden";
      el.style.zIndex = String(index);
      el.innerHTML = `
        <img src="/dual-slider/slide_img_${side}_${slideIndex + 1}.jpg" style="width:100%;height:100%;object-fit:cover;display:block" />
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:${data.accent};text-transform:uppercase;font-weight:800;font-family:${fontFamily};font-size:clamp(calc(1rem * ${scale}),calc(4vw * ${scale}),calc(2.5rem * ${scale}));letter-spacing:-0.02em;white-space:nowrap">${data.title}</div>
      `;
      columns[side].el.appendChild(el);
      columns[side].visible.set(index, el);
    }

    function getRevealShape(side: Side, revealAmount: number) {
      const d = Math.max(0, Math.min(1, revealAmount)) * (100 + revealOverlap);
      return side === "left"
        ? `polygon(0% ${100 - d}%, 100% ${100 - d}%, 100% 100%, 0% 100%)`
        : `polygon(0% 0%, 100% 0%, 100% ${d}%, 0% ${d}%)`;
    }

    function updateSlider() {
      const first = Math.floor(scrollPosition) - bufferSlides;
      const last = Math.floor(scrollPosition) + bufferSlides + 1;

      (["left", "right"] as Side[]).forEach((side) => {
        const visible = columns[side].visible;
        for (let i = first; i <= last; i++) {
          if (!visible.has(i)) createSlide(side, i);
        }
        for (const [index, el] of visible) {
          if (index < first || index > last) {
            el.remove();
            visible.delete(index);
            continue;
          }
          const revealAmount = scrollPosition - index;
          el.style.clipPath = getRevealShape(side, revealAmount);
        }
      });
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      autoDrift = 0;
      scrollTarget += e.deltaY / sensitivity;
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    function animate() {
      scrollTarget += autoDrift;
      scrollPosition += (scrollTarget - scrollPosition) * smoothness;
      updateSlider();
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("wheel", onWheel);
      leftCol.innerHTML = "";
      rightCol.innerHTML = "";
    };
  }, [speed, autoPlay, fontFamily, scale]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-black flex" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      <div ref={leftRef} className="relative flex-1 h-full overflow-hidden" />
      <div ref={rightRef} className="relative flex-1 h-full overflow-hidden" />
    </div>
  );
}
