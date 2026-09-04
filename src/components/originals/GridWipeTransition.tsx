"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(SplitText, CustomEase);

const DEFAULT_IMAGES = Array.from({ length: 3 }, (_, i) => `/grid-wipe-transition/img${i + 1}.jpg`);

const PAGES = [
  { key: "genesis", label: "Genesis", img: "/grid-wipe-transition/img1.jpg" },
  { key: "threshold", label: "Threshold", img: "/grid-wipe-transition/img2.jpg" },
  { key: "sanctum", label: "Sanctum", img: "/grid-wipe-transition/img3.jpg" },
];

const ROWS = 4;

export default function GridWipeTransition({
  brand = "Your Brand",
  gridColor = "#f2f0e6",
  images = DEFAULT_IMAGES,
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  brand?: string;
  gridColor?: string;
  images?: string[];
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wordsRef = useRef<HTMLElement[]>([]);
  const animating = useRef(false);
  const activeRef = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!CustomEase.get("hop-wipe")) CustomEase.create("hop-wipe", "0.9, 0, 0.1, 1");
    const heading = headingRef.current;
    if (!heading) return;
    const split = SplitText.create(heading, { type: "words", wordsClass: "word", mask: "words" });
    wordsRef.current = split.words as HTMLElement[];
    gsap.set(wordsRef.current, { y: "100%" });
    return () => split.revert();
  }, [brand]);

  function goTo(index: number) {
    if (index === activeRef.current || animating.current) return;
    animating.current = true;
    activeRef.current = index;
    setActive(index);
    const rate = Math.max(0.2, speed / 100);
    const blocks = blocksRef.current.filter(Boolean) as HTMLDivElement[];

    tlRef.current?.kill();
    if (safetyRef.current) clearTimeout(safetyRef.current);

    const release = () => {
      animating.current = false;
    };
    const tl = gsap.timeline({ onComplete: release, onInterrupt: release });
    tlRef.current = tl;

    tl.set(gridRef.current, { pointerEvents: "all" });
    tl.set(blocks, { transformOrigin: "left center", scaleX: 0 });
    tl.set(wordsRef.current, { y: "100%" });
    // Durations/staggers/offsets mirror animateIn + animateOut in the source.
    tl.to(blocks, { scaleX: 1, duration: 1 / rate, ease: "hop-wipe", stagger: 0.075 / rate });
    tl.to(wordsRef.current, { y: "0%", duration: 1 / rate, ease: "power4.out", stagger: 0.1 / rate }, `-=${0.6 / rate}`);
    tl.add(() => setDisplayed(index));
    tl.to(wordsRef.current, { y: "100%", duration: 1 / rate, ease: "power4.out", stagger: 0.1 / rate });
    tl.set(blocks, { transformOrigin: "right center" });
    tl.to(
      blocks,
      {
        scaleX: 0,
        duration: 1 / rate,
        ease: "hop-wipe",
        stagger: 0.075 / rate,
        onComplete: () => gsap.set(gridRef.current, { pointerEvents: "none" }),
      },
      `-=${1 / rate}`,
    );

    safetyRef.current = setTimeout(() => {
      if (tlRef.current === tl) {
        tl.progress(1);
        release();
      }
    }, (4.5 / rate) * 1000 + 800);
  }

  useEffect(() => {
    if (!autoPlay) return;
    const rate = Math.max(0.2, speed / 100);
    const id = setInterval(() => {
      goTo((activeRef.current + 1) % PAGES.length);
    }, 4800 / rate);
    return () => clearInterval(id);
  }, [autoPlay, speed]);

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black" style={{ fontFamily }}>
      <nav className="absolute top-0 left-0 w-full flex items-center justify-between p-4 z-10 text-white text-xs font-medium">
        <span>{brand}</span>
        <div className="flex gap-3">
          {PAGES.map((p, i) => (
            <button
              key={p.key}
              onClick={() => goTo(i)}
              className={`uppercase tracking-wide transition-opacity ${active === i ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundImage: `url(${images[displayed % images.length]})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <h1 className="uppercase text-white font-medium leading-[0.85]" style={{ fontSize: `clamp(calc(2.5rem * ${scale}),calc(10vw * ${scale}),calc(6rem * ${scale}))` }}>
          {PAGES[displayed].label}
        </h1>
      </div>

      <div ref={gridRef} className="absolute inset-0 flex flex-col pointer-events-none z-20 overflow-hidden">
        {Array.from({ length: ROWS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              blocksRef.current[i] = el;
            }}
            className="flex-1 w-full"
            style={{ backgroundColor: gridColor, transform: "scaleX(0)", transformOrigin: "left center" }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[21]">
        <h1 ref={headingRef} className="font-medium" style={{ fontSize: `clamp(calc(0.9rem * ${scale}),calc(2.5vw * ${scale}),calc(1.75rem * ${scale}))`, color: "#0f0f0f" }}>
          {brand}
        </h1>
      </div>
    </div>
  );
}
