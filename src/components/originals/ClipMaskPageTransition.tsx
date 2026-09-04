"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const DEFAULT_IMAGES = Array.from({ length: 3 }, (_, i) => `/clip-mask-transition/img${i + 1}.jpg`);

const PAGES = [
  { key: "genesis", label: "Genesis", img: "/clip-mask-transition/img1.jpg" },
  { key: "gateway", label: "Gateway", img: "/clip-mask-transition/img2.jpg" },
  { key: "colony", label: "Colony", img: "/clip-mask-transition/img3.jpg" },
];

const CLIP_COLLAPSED = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
const CLIP_FULL = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

export default function ClipMaskPageTransition({
  brand = "Aethos",
  images = DEFAULT_IMAGES,
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  brand?: string;
  images?: string[];
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const outgoingRef = useRef<HTMLDivElement>(null);
  const animating = useRef(false);
  const activeRef = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<number | null>(null);
  // Tracks the currently painted page so goTo can capture it as the outgoing layer.
  const displayedRef = useRef(0);

  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  useEffect(() => {
    if (!CustomEase.get("page-hop")) CustomEase.create("page-hop", "0.75, 0, 0.1, 1");
  }, []);

  function goTo(index: number) {
    if (index === activeRef.current || animating.current) return;
    animating.current = true;
    activeRef.current = index;
    pendingRef.current = index;
    // Previous page becomes the outgoing layer; the new one enters over it.
    setOutgoing(displayedRef.current);
    setDisplayed(index);
    setActive(index);
  }

  // Runs once both layers are painted, so the enter/exit animations start together.
  useEffect(() => {
    if (pendingRef.current === null) return;
    pendingRef.current = null;

    const incoming = incomingRef.current;
    const outgoingEl = outgoingRef.current;
    if (!incoming) {
      animating.current = false;
      return;
    }

    const rate = Math.max(0.2, speed / 100);
    tlRef.current?.kill();
    if (safetyRef.current) clearTimeout(safetyRef.current);

    const release = () => {
      animating.current = false;
      setOutgoing(null);
    };
    const tl = gsap.timeline({ onComplete: release, onInterrupt: release });
    tlRef.current = tl;

    // page-out: old page lifts away and dims to 0.25.
    if (outgoingEl) {
      tl.fromTo(
        outgoingEl,
        { y: "0%", opacity: 1 },
        { y: "-25%", opacity: 0.25, duration: 1 / rate, ease: "page-hop" },
        0,
      );
    }

    // page-in: new page rises from 25% while unclipping from its bottom edge.
    tl.fromTo(
      incoming,
      { y: "25%", clipPath: CLIP_COLLAPSED },
      { y: "0%", clipPath: CLIP_FULL, duration: 1 / rate, ease: "page-hop" },
      0,
    );

    safetyRef.current = setTimeout(() => {
      if (tlRef.current === tl) {
        tl.progress(1);
        release();
      }
    }, (1 / rate) * 1000 + 800);
  }, [displayed, speed]);

  useEffect(() => {
    if (!autoPlay) return;
    const rate = Math.max(0.2, speed / 100);
    const id = setInterval(() => {
      goTo((activeRef.current + 1) % PAGES.length);
    }, 2600 / rate);
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

      {outgoing !== null && (
        <div
          ref={outgoingRef}
          className="absolute inset-0 flex items-end p-6"
          style={{
            backgroundImage: `url(${images[outgoing % images.length]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <h1 className="uppercase text-white font-medium leading-[0.85]" style={{ fontSize: `clamp(calc(2.5rem * ${scale}),calc(10vw * ${scale}),calc(6rem * ${scale}))` }}>
            {PAGES[outgoing].label}
          </h1>
        </div>
      )}

      <div
        ref={incomingRef}
        className="absolute inset-0 flex items-end p-6"
        style={{
          backgroundImage: `url(${images[displayed % images.length]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          clipPath: CLIP_FULL,
        }}
      >
        <h1 className="uppercase text-white font-medium leading-[0.85]" style={{ fontSize: `clamp(calc(2.5rem * ${scale}),calc(10vw * ${scale}),calc(6rem * ${scale}))` }}>
          {PAGES[displayed].label}
        </h1>
      </div>
    </div>
  );
}
