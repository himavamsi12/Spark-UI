"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const DEFAULT_IMAGES = Array.from({ length: 9 }, (_, i) => `/spotlight-zoom-scroll/img${i + 1}.jpg`);

// Lays the flat image list out into three vertical columns.
function toColumns(list: string[]): string[][] {
  const cols: string[][] = [[], [], []];
  list.forEach((src, i) => cols[i % 3].push(src));
  return cols;
}

export default function SpotlightZoomScroll({
  images = DEFAULT_IMAGES,
  headline = "A living catalogue of images that shouldn't exist, collected frame by frame from the edge of the real.",
  fontFamily = "var(--font-plus-jakarta-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  images?: string[];
  headline?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const gallery = galleryRef.current;
    const logo = logoRef.current;
    const header = headerRef.current;
    const btn = btnRef.current;
    const footer = footerRef.current;
    if (!root || !gallery || !logo || !header || !btn || !footer) return;

    const imgEls = gallery.querySelectorAll("img");

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const mapRange = (v: number, s: number, e: number) => gsap.utils.clamp(0, 1, (v - s) / (e - s));

    const headlineSplit = SplitText.create(header, { type: "words", wordsClass: "word" });
    const fadeTargets = [...(headlineSplit.words as HTMLElement[]), btn];
    gsap.set(fadeTargets, { opacity: 0 });
    const fadeStep = (0.6 - 0.1) / fadeTargets.length;
    const fadeDuration = fadeStep * 3;

    // Source uses a start scale of 6 on desktop and 2 under 1000px wide; the
    // preview box is narrow, so the same breakpoint is applied to its own width.
    const logoStartScale = root.clientWidth < 1000 ? 2 : 6;

    function applyProgress(p: number) {
      const galleryProgress = mapRange(p, 0, 0.75);
      gsap.set(gallery, { scale: lerp(1, 0.5, galleryProgress) });
      gsap.set(imgEls, { scale: lerp(1.25, 1, galleryProgress) });

      const logoScale = lerp(logoStartScale, 1, galleryProgress);
      const logoTravel = root!.clientHeight - logo!.offsetHeight * logoScale - 16 * 4;
      gsap.set(logo, { scale: logoScale, y: -logoTravel * galleryProgress });

      const footerProgress = mapRange(p, 0.05, 0.25);
      gsap.set(footer, {
        scale: lerp(1, 0.75, footerProgress),
        filter: `blur(${lerp(0, 20, footerProgress)}px)`,
        opacity: lerp(1, 0, footerProgress),
      });

      fadeTargets.forEach((target, index) => {
        const start = 0.1 + index * fadeStep;
        gsap.set(target, { opacity: mapRange(p, start, start + fadeDuration) });
      });
    }
    applyProgress(0);

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
      applyProgress(progress);
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("wheel", onWheel);
      headlineSplit.revert();
    };
  }, [headline, speed, autoPlay, images]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-[#0f0f0f]" style={{ fontFamily }}>
      <div ref={logoRef} className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/90 z-10" style={{ transformOrigin: "bottom left" }} />

      <div ref={galleryRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] flex gap-1">
        {toColumns(images).map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-1">
            {col.map((src, ri) => (
              <div key={`${ci}-${ri}`} className="relative flex-1 overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] flex flex-col items-center gap-3 text-center text-white">
        <h3 ref={headerRef} className="font-medium" style={{ fontSize: `clamp(calc(0.9rem * ${scale}),calc(2.2vw * ${scale}),calc(1.5rem * ${scale}))`, lineHeight: 1.25 }}>
          {headline}
        </h3>
        <div ref={btnRef} className="bg-[#c4d600] text-black text-xs font-medium px-4 py-2 rounded">
          Request Access
        </div>
      </div>

      <div
        ref={footerRef}
        className="absolute bottom-3 left-0 w-full px-3 flex justify-between text-[10px] uppercase tracking-wide text-white/70 z-10"
      >
        <span>Scroll to explore</span>
        <span>Est. 2024</span>
      </div>
    </div>
  );
}
