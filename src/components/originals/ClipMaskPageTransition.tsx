"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const DEFAULT_IMAGES = Array.from({ length: 3 }, (_, i) => `/clip-mask-transition/img${i + 1}.jpg`);

const PAGES = [
  { key: "genesis", label: "Genesis" },
  { key: "threshold", label: "Threshold" },
  { key: "sanctum", label: "Sanctum" },
];

/** Horizontal bands that sweep across to cover the page mid-transition. */
const ROWS = 4;

export default function ClipMaskPageTransition({
  brand = "Emberfall",
  overlayText = "Your Brand Name",
  overlayColor = "#f2f0e6",
  images = DEFAULT_IMAGES,
  fontFamily = "var(--font-instrument-serif), serif",
  navFont = "var(--font-instrument-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  brand?: string;
  overlayText?: string;
  overlayColor?: string;
  images?: string[];
  fontFamily?: string;
  navFont?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  const blocksRef = useRef<(HTMLDivElement | null)[]>([]);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const animating = useRef(false);
  const activeRef = useRef(0);

  useEffect(() => {
    if (!CustomEase.get("hop")) CustomEase.create("hop", "0.9, 0, 0.1, 1");
  }, []);

  function goTo(index: number) {
    if (index === activeRef.current || animating.current) return;
    animating.current = true;
    activeRef.current = index;
    setActive(index);

    const blocks = blocksRef.current.filter(Boolean);
    const words = wordsRef.current.filter(Boolean);
    const rate = Math.max(0.2, speed / 100);

    tlRef.current?.kill();
    const tl = gsap.timeline({
      onComplete: () => {
        animating.current = false;
      },
    });
    tlRef.current = tl;

    // Cover: bands grow from their left edge on a stagger, and the wordmark
    // rises out of its mask while they are still closing.
    tl.set(blocks, { transformOrigin: "left center", scaleX: 0 });
    tl.set(words, { yPercent: 100 });
    tl.to(blocks, { scaleX: 1, duration: 1 / rate, ease: "hop", stagger: 0.075 / rate });
    tl.to(
      words,
      { yPercent: 0, duration: 1 / rate, ease: "power4.out", stagger: 0.1 / rate },
      `-=${0.6 / rate}`,
    );

    // Fully covered, so the page underneath can change unseen.
    tl.add(() => setDisplayed(index));

    // Reveal: the bands now collapse toward their right edge, taking the
    // wordmark back down with them.
    tl.set(blocks, { transformOrigin: "right center", scaleX: 1 });
    tl.to(words, { yPercent: 100, duration: 1 / rate, ease: "power4.out", stagger: 0.1 / rate });
    tl.to(
      blocks,
      { scaleX: 0, duration: 1 / rate, ease: "hop", stagger: 0.075 / rate },
      `-=${1 / rate}`,
    );
  }

  useEffect(() => {
    if (!autoPlay) return;
    const rate = Math.max(0.2, speed / 100);
    const id = setInterval(() => {
      goTo((activeRef.current + 1) % PAGES.length);
    }, 3800 / rate);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, speed]);

  useEffect(() => () => void tlRef.current?.kill(), []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f0f0f]" style={{ fontFamily }}>
      {/* Page */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundImage: `url(${images[displayed % images.length]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1
          className="font-medium leading-none text-[#f2f0e6] tracking-[-0.03em]"
          style={{ fontSize: `clamp(calc(2.5rem * ${scale}),calc(12vw * ${scale}),calc(9rem * ${scale}))` }}
        >
          {PAGES[displayed].label}
        </h1>
      </div>

      <nav className="absolute top-0 left-0 w-full flex items-start justify-between p-4 z-10 text-[#f2f0e6]" style={{ fontFamily: navFont }}>
        <span className="font-medium" style={{ fontSize: `calc(0.75rem * ${scale})` }}>
          {brand}
        </span>
        <div className="flex gap-4">
          {PAGES.map((p, i) => (
            <button
              key={p.key}
              onClick={() => goTo(i)}
              className={`uppercase tracking-wide transition-opacity ${
                active === i ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
              style={{ fontSize: `calc(0.75rem * ${scale})` }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Covering bands */}
      <div className="absolute inset-0 flex flex-col pointer-events-none z-[100] overflow-hidden">
        {Array.from({ length: ROWS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              blocksRef.current[i] = el;
            }}
            className="flex-1 w-full will-change-transform"
            style={{ background: overlayColor, transform: "scaleX(0)", transformOrigin: "left center" }}
          />
        ))}
      </div>

      {/* Wordmark, each word riding up out of its own mask */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[101]">
        <h1
          className="flex flex-wrap justify-center gap-x-[0.25em] font-medium leading-none tracking-[-0.03em] text-[#0f0f0f]"
          style={{ fontSize: `clamp(calc(1rem * ${scale}),calc(3vw * ${scale}),calc(3rem * ${scale}))` }}
        >
          {overlayText.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block overflow-hidden">
              <span
                ref={(el) => {
                  wordsRef.current[i] = el;
                }}
                className="inline-block will-change-transform"
                style={{ transform: "translateY(100%)" }}
              >
                {word}
              </span>
            </span>
          ))}
        </h1>
      </div>
    </div>
  );
}
