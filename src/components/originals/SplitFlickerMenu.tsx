"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const DEFAULT_ITEMS = ["Work", "Portfolio", "Retrospective", "Lens", "Selected", "Enquire"];

export default function SplitFlickerMenu({
  items = DEFAULT_ITEMS,
  brand = "Obscura",
  menuLabel = "Menu",
  textColor = "#e0e0ca",
  bgImage = "/split-menu/hero-bg.jpg",
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  items?: string[];
  brand?: string;
  menuLabel?: string;
  textColor?: string;
  bgImage?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const bgRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const indexRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dividerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const labelSpanRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!autoPlay || hasInteracted) return;
    const openDelay = setTimeout(() => toggle(true), 700);
    const loop = setInterval(() => {
      toggle(true);
      setTimeout(() => toggle(false), 3200);
    }, 5000);
    return () => {
      clearTimeout(openDelay);
      clearInterval(loop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, hasInteracted]);

  useEffect(() => {
    const bg = bgRef.current;
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!bg || items.length === 0) return;
    const rate = Math.max(0.2, speed / 100);

    const splits = items.map((_, i) => {
      const label = labelRefs.current[i];
      const index = indexRefs.current[i];
      if (!label || !index) return null;
      const labelSplit = SplitText.create(label, { type: "chars", mask: "chars" });
      const indexSplit = SplitText.create(index, { type: "words", mask: "words" });
      gsap.set([labelSplit.chars, indexSplit.words], { yPercent: 100 });
      return { labelSplit, indexSplit };
    });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    tl.to(bg, { opacity: 1, duration: 0.75 / rate }, 0);

    splits.forEach((s, i) => {
      if (!s) return;
      const startTime = (0.35 + i * 0.12) / rate;
      const divider = dividerRefs.current[i];
      tl.to([s.indexSplit.words, s.labelSplit.chars[0]], { yPercent: 0, duration: 0.6 / rate }, startTime);
      if (divider) tl.to(divider, { scaleY: 1, duration: 0.8 / rate }, startTime + 0.05 / rate);
      tl.to(s.labelSplit.chars, { yPercent: 0, duration: 0.6 / rate, stagger: 0.02 / rate }, startTime + 0.1 / rate);
    });

    tlRef.current = tl;

    return () => {
      tlRef.current = null;
      tl.kill();
      splits.forEach((s) => {
        s?.labelSplit.revert();
        s?.indexSplit.revert();
      });
    };
  }, [speed]);

  function flickerButton(open: boolean) {
    const label = labelSpanRef.current;
    if (!label) return;
    label.textContent = open ? "Close" : "Menu";
    const split = new SplitText(label, { type: "chars" });
    gsap.fromTo(
      split.chars,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.05,
        ease: "power2.inOut",
        overwrite: true,
        stagger: { amount: 0.3, from: "random" },
        onComplete: () => split.revert(),
      },
    );
  }

  function toggle(next: boolean) {
    setIsOpen(next);
    if (next) tlRef.current?.play();
    else tlRef.current?.reverse();
    flickerButton(next);
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#151515]" style={{ fontFamily }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <nav className="absolute top-0 left-0 w-full flex items-center justify-between p-4 z-[100]" style={{ color: textColor }}>
        <span className="font-serif italic text-lg px-2">{brand}</span>
        <button
          ref={toggleRef}
          onClick={() => {
            setHasInteracted(true);
            toggle(!isOpen);
          }}
          className="uppercase text-xs font-mono px-2 py-1 cursor-pointer relative"
        >
          <span ref={labelSpanRef}>{menuLabel}</span>
          {!autoPlay && !hasInteracted && !isOpen && (
            <span className="absolute -top-0.5 -right-2 w-2 h-2 rounded-full bg-white">
              <span className="absolute inset-0 rounded-full bg-white animate-ping" />
            </span>
          )}
        </button>
      </nav>

      <div
        ref={bgRef}
        className="absolute inset-0 z-[5] opacity-0"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center gap-1 px-6 py-10" style={{ color: textColor }}>
        {items.map((label, i) => (
          <div
            key={label}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="inline-flex items-center whitespace-nowrap"
            style={{ fontSize: `clamp(calc(1.1rem * ${scale}), calc(4vw * ${scale}), calc(2rem * ${scale}))` }}
          >
            <span
              ref={(el) => {
                indexRefs.current[i] = el;
              }}
              className="self-start mt-1 mr-1 font-mono overflow-hidden inline-block"
              style={{ fontSize: `calc(0.55rem * ${scale})` }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className="font-serif italic overflow-hidden inline-block"
            >
              {label}
            </span>
            <span
              ref={(el) => {
                dividerRefs.current[i] = el;
              }}
              className="w-[2px] h-[1em] mx-4 origin-center"
              style={{ backgroundColor: textColor, transform: "rotate(20deg) scaleY(0)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
