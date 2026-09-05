"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export default function SlitRevealScroll({
  accentColor = "#e12c1a",
  outroText = "You become the shape that the light finally learns to find.",
  fontFamily = "var(--font-neue-montreal)",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  accentColor?: string;
  outroText?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);
  const overlayDarkRef = useRef<HTMLDivElement>(null);
  const overlayAccentRef = useRef<HTMLDivElement>(null);
  const copyLeftRef = useRef<HTMLDivElement>(null);
  const copyRightRef = useRef<HTMLDivElement>(null);
  const outroTopRef = useRef<HTMLDivElement>(null);
  const outroBottomRef = useRef<HTMLDivElement>(null);
  const outroHeaderRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const fg = fgRef.current;
    const overlayDark = overlayDarkRef.current;
    const overlayAccent = overlayAccentRef.current;
    const copyLeft = copyLeftRef.current;
    const copyRight = copyRightRef.current;
    const outroTop = outroTopRef.current;
    const outroBottom = outroBottomRef.current;
    const outroHeader = outroHeaderRef.current;
    if (!root || !fg || !overlayDark || !overlayAccent || !copyLeft || !copyRight || !outroTop || !outroBottom || !outroHeader) return;

    const split = SplitText.create(outroHeader, { type: "lines", mask: "lines", linesClass: "line" });
    gsap.set(split.lines, { yPercent: 100 });
    let linesRevealed = false;

    const interp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clampT = (t: number) => Math.max(0, Math.min(1, t));

    function applyProgress(p: number) {
      const phase1 = clampT(p / 0.25);
      const slitLeft = interp(0, 48, phase1);
      const slitRight = interp(100, 52, phase1);
      gsap.set(fg, { clipPath: `polygon(${slitLeft}% 0%, ${slitRight}% 0%, ${slitRight}% 100%, ${slitLeft}% 100%)` });
      gsap.set(overlayDark, { opacity: interp(0, 1, phase1) });

      const phase2 = clampT((p - 0.25) / 0.2);
      gsap.set(fg, { rotate: interp(0, 65, phase2) });

      const phase3 = clampT((p - 0.45) / 0.2);
      gsap.set(fg, { scale: interp(1, 0, phase3) });
      gsap.set(copyLeft, { x: `${interp(0, 100, phase3)}%` });
      gsap.set(copyRight, { x: `${interp(0, -100, phase3)}%` });

      const phase3Overlay = clampT((p - 0.45) / 0.05);
      gsap.set(overlayAccent, { opacity: interp(0, 1, phase3Overlay) });

      const phase4 = clampT((p - 0.65) / 0.2);
      const topBottomEdge = interp(0, 100, phase4);
      gsap.set(outroTop, { clipPath: `polygon(0% 0%, 100% 0%, 100% ${topBottomEdge}%, 0% ${topBottomEdge}%)` });
      const bottomTopEdge = interp(100, 0, phase4);
      gsap.set(outroBottom, { clipPath: `polygon(0% ${bottomTopEdge}%, 100% ${bottomTopEdge}%, 100% 100%, 0% 100%)` });

      if (p >= 0.9 && !linesRevealed) {
        linesRevealed = true;
        gsap.to(split.lines, { yPercent: 0, duration: 0.75, stagger: 0.1, ease: "power3.out" });
      } else if (p < 0.9 && linesRevealed) {
        linesRevealed = false;
        gsap.to(split.lines, { yPercent: 100, duration: 0.25, stagger: -0.05, ease: "power3.out" });
      }
    }
    applyProgress(0);

    const rate = Math.max(0.2, speed / 100);
    let progress = 0;
    let target = 0;

    // The reference pins the hero for five viewport heights, so a full pass of
    // the timeline costs that much scrolling. Matching the divisor keeps the
    // wheel feeling the same as scrolling the original page.
    const travel = () => window.innerHeight * 5;

    let userDriven = false;
    function onWheel(e: WheelEvent) {
      const next = gsap.utils.clamp(0, 1, target + (e.deltaY / travel()) * rate);
      // At either end, let the wheel fall through so the page keeps scrolling.
      if (next === target) return;
      e.preventDefault();
      userDriven = true;
      target = next;
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    let autoDir = 1;
    let last = performance.now();
    // ScrollTrigger's scrub: 1 takes about a second to catch up to the scroll
    // position. Easing by dt/scrub reproduces that, and stays correct if the
    // display is not running at 60fps.
    const SCRUB = 1 / rate;

    function loop(now: number) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      if (autoPlay && !userDriven) {
        target += autoDir * dt * 0.18 * rate;
        if (target >= 1) {
          target = 1;
          autoDir = -1;
        } else if (target <= 0) {
          target = 0;
          autoDir = 1;
        }
      }

      progress += (target - progress) * Math.min(1, dt / SCRUB);
      applyProgress(progress);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("wheel", onWheel);
      split.revert();
    };
  }, [accentColor, speed, autoPlay]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden bg-[#dcdbd5]"
      style={{ fontFamily, containerType: "inline-size" }}
    >
      <div className="absolute inset-0 flex z-0">
        <div className="flex-1 flex items-center p-8">
          <div ref={copyLeftRef} className="flex flex-col gap-2 w-1/2 will-change-transform">
            <h3 className="uppercase font-medium" style={{ color: accentColor, fontSize: `clamp(calc(2rem * ${scale}),calc(5cqw * ${scale}),calc(8rem * ${scale}))`, lineHeight: 0.8, letterSpacing: "-0.03em" }}>
              Motion
            </h3>
            <p className="uppercase font-medium" style={{ color: "#1a0401", fontSize: `calc(0.85rem * ${scale})`, lineHeight: 1.1 }}>
              Bodies drawn through engineered light and open dark. Every frame caught between the signal and the shadow that it quietly leaves behind.
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end p-8">
          <div ref={copyRightRef} className="flex flex-col gap-2 w-1/2 will-change-transform">
            <h3 className="uppercase font-medium" style={{ color: accentColor, fontSize: `clamp(calc(2rem * ${scale}),calc(5cqw * ${scale}),calc(8rem * ${scale}))`, lineHeight: 0.8, letterSpacing: "-0.03em" }}>
              Silence
            </h3>
            <p className="uppercase font-medium" style={{ color: "#1a0401", fontSize: `calc(0.85rem * ${scale})`, lineHeight: 1.1 }}>
              Stillness measured in reflected color and slow heat. Where the moving crowd dissolves and only the burning outline holds against the night.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex z-[1]">
        <div ref={outroTopRef} className="flex-1 h-full" style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }}>
          <img src="/slit-reveal-scroll/hero-outro-img-1.jpg" alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
        <div ref={outroBottomRef} className="flex-1 h-full" style={{ clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" }}>
          <img src="/slit-reveal-scroll/hero-outro-img-2.jpg" alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
        <h3
          ref={outroHeaderRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase font-medium text-center w-[60%]"
          style={{ color: "#dcdbd5", fontSize: `clamp(calc(2rem * ${scale}),calc(5cqw * ${scale}),calc(8rem * ${scale}))`, lineHeight: 0.8, letterSpacing: "-0.03em" }}
        >
          {outroText}
        </h3>
      </div>

      <div ref={fgRef} className="absolute inset-0 z-[2]" style={{ backgroundColor: "#1a0401", clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>
        <img src="/slit-reveal-scroll/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <h1 className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[95%] p-8 uppercase font-medium text-center" style={{ color: "#dcdbd5", fontSize: `clamp(calc(2rem * ${scale}),calc(8cqw * ${scale}),calc(14rem * ${scale}))`, lineHeight: 0.8, letterSpacing: "-0.03em" }}>
          Silhouettes against the burning dark
        </h1>
        <div ref={overlayDarkRef} className="absolute inset-0" style={{ backgroundColor: "#1a0401", opacity: 0 }} />
        <div ref={overlayAccentRef} className="absolute inset-0" style={{ backgroundColor: accentColor, opacity: 0 }} />
      </div>
    </div>
  );
}
