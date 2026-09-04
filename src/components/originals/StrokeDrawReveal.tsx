"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const STROKE_PATHS = [
  "M -251 -42 C 156 -405 595 -695 1176 -648",
  "M -195 90 C 212 -273 651 -562 1232 -516",
  "M -138 223 C 269 -140 707 -430 1288 -383",
  "M -82 355 C 325 -8 764 -297 1345 -250",
  "M -26 488 C 381 125 820 -165 1401 -118",
  "M 30 620 C 438 257 876 -32 1457 15",
  "M 87 753 C 494 390 932 101 1513 147",
  "M 143 885 C 550 522 989 233 1570 280",
  "M 199 1018 C 606 655 1045 366 1626 412",
  "M 255 1150 C 663 788 1101 498 1682 545",
  "M 312 1283 C 719 920 1157 631 1738 677",
  "M 368 1416 C 775 1053 1214 763 1795 810",
  "M 424 1548 C 831 1185 1270 896 1851 942",
];
const DRAW_ORDER = [0, 12, 2, 10, 4, 8, 6, 1, 3, 5, 7, 9, 11];
const SPARKLE_D = "M 0 -55 C 8 -16 16 -8 55 0 C 16 8 8 16 0 55 C -8 16 -16 8 -55 0 C -16 -8 -8 -16 0 -55 Z";
const SPARKLES = [
  { x: 360, y: 230, s: 1.5 },
  { x: 1180, y: 520, s: 1 },
  { x: 640, y: 730, s: 0.65 },
];

export default function StrokeDrawReveal({
  beforeTitle = "Wait for it",
  beforeBody = "The good part is closer, just one scroll away.",
  afterTitle = "There it is",
  afterBody = "Clean, sharp, and right when you needed it.",
  strokeColor = "#fff280",
  bgFrom = "#ff668c",
  bgTo = "#fff280",
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  beforeTitle?: string;
  beforeBody?: string;
  afterTitle?: string;
  afterBody?: string;
  strokeColor?: string;
  bgFrom?: string;
  bgTo?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const outlineRefs = useRef<(SVGPathElement | null)[]>([]);
  const sparkleRefs = useRef<(SVGPathElement | null)[]>([]);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const strokes = strokeRefs.current.filter(Boolean) as SVGPathElement[];
    const outlines = outlineRefs.current.filter(Boolean) as SVGPathElement[];
    const sparkles = sparkleRefs.current.filter(Boolean) as SVGPathElement[];
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!root || !before || !after || strokes.length !== 13) return;

    const lengths = strokes.map((s) => s.getTotalLength());
    [...strokes, ...outlines].forEach((el, i) => {
      const len = lengths[i % 13];
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
    });
    gsap.set(sparkles, { scale: 0 });
    gsap.set(after, { opacity: 0 });

    const STROKE_STAGGER = 0.045;
    const DRAW_TIME = 1.25;
    const startTime = (order: number) => order * STROKE_STAGGER;
    const wobble = (order: number) => (order % 2 === 0 ? 0 : STROKE_STAGGER * 0.6);
    const drawDuration = (order: number) => DRAW_TIME + (order % 3) * 0.12;

    const drawSteps = DRAW_ORDER.map((strokeIndex, order) => ({ strokeIndex, at: startTime(order) + wobble(order), duration: drawDuration(order) }));
    const coveredAt = Math.max(...drawSteps.map((s) => s.at + s.duration));

    const timeline = gsap.timeline({ paused: true });
    drawSteps.forEach(({ strokeIndex, at, duration }) => {
      timeline.to([outlines[strokeIndex], strokes[strokeIndex]], { strokeDashoffset: 0, duration, ease: "power2.out" }, at);
    });
    timeline.set(before, { opacity: 0 }, coveredAt);
    timeline.set(after, { opacity: 1 }, coveredAt);
    [...DRAW_ORDER].reverse().forEach((strokeIndex, order) => {
      const len = lengths[strokeIndex];
      timeline.to(
        [outlines[strokeIndex], strokes[strokeIndex]],
        { strokeDashoffset: -len, duration: drawDuration(order), ease: "power2.in" },
        coveredAt + startTime(order) + wobble(order),
      );
    });
    sparkles.forEach((sparkle, index) => {
      const popAt = coveredAt - 0.4 + index * 0.25;
      timeline
        .fromTo(sparkle, { scale: 0, rotate: -60, transformOrigin: "center" }, { scale: 1, rotate: 60, duration: 0.5, ease: "back.out(2)" }, popAt)
        .to(sparkle, { scale: 0, rotate: 140, duration: 0.5, ease: "back.in(2)" }, popAt + 0.6);
    });

    const total = timeline.duration();
    const rate = Math.max(0.2, speed / 100);
    let progress = 0;
    let target = 0;

    let userDriven = false;
    function onWheel(e: WheelEvent) {
      const next = gsap.utils.clamp(0, 1, target + e.deltaY * 0.001 * rate);
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
      timeline.seek(progress * total);
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      timeline.kill();
      root.removeEventListener("wheel", onWheel);
    };
  }, [speed, autoPlay]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        fontFamily,
        background: `linear-gradient(90deg, ${bgFrom} 0%, ${bgTo} 100%)`,
        color: "#141414",
      }}
    >
      <div ref={beforeRef} className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <h2 className="uppercase font-black leading-[0.9]" style={{ fontSize: `clamp(calc(1.5rem * ${scale}),calc(5vw * ${scale}),calc(3rem * ${scale}))` }}>
          {beforeTitle}
        </h2>
        <p className="mt-3 max-w-[26ch] text-sm" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: `calc(0.875rem * ${scale})` }}>
          {beforeBody}
        </p>
      </div>
      <div ref={afterRef} className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <h2 className="uppercase font-black leading-[0.9]" style={{ fontSize: `clamp(calc(1.5rem * ${scale}),calc(5vw * ${scale}),calc(3rem * ${scale}))` }}>
          {afterTitle}
        </h2>
        <p className="mt-3 max-w-[26ch] text-sm" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: `calc(0.875rem * ${scale})` }}>
          {afterBody}
        </p>
      </div>

      <div className="absolute -inset-[10%] pointer-events-none">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <g fill="none" strokeLinecap="round">
            {/* Outline sits underneath and is OUTLINE_WIDTH (7) wider than the fill,
                matching the source, so it reads as an inked edge around each stroke. */}
            {STROKE_PATHS.map((d, i) => (
              <path key={`o${i}`} ref={(el) => { outlineRefs.current[i] = el; }} d={d} stroke="#141414" strokeWidth={150} />
            ))}
            {STROKE_PATHS.map((d, i) => (
              <path key={`f${i}`} ref={(el) => { strokeRefs.current[i] = el; }} d={d} stroke={strokeColor} strokeWidth={143} />
            ))}
          </g>
        </svg>
      </div>

      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none">
        <g fill="#fff" stroke="#141414" strokeWidth={4} strokeLinejoin="round">
          {SPARKLES.map((sp, i) => (
            <g key={i} transform={`translate(${sp.x} ${sp.y}) scale(${sp.s})`}>
              <path ref={(el) => { sparkleRefs.current[i] = el; }} d={SPARKLE_D} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
