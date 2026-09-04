"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The library mark: components as books on a shelf, with one open in the middle.
 * Drawn as SVG rather than a Lottie so it inherits the site's colour tokens and
 * can be driven by the same GSAP the components themselves use.
 */

const BASE = 300; // shelf line

// Leaning books at the outer edges: [x, width, height, rotation, spine, edge]
const LEANERS: [number, number, number, number, string, string][] = [
  [56, 26, 120, -13, "#62626f", "#8b8e9c"],
  [86, 24, 138, -10, "#e8730a", "#ff8a3d"],
  [113, 28, 126, -7, "#dad7de", "#ffffff"],
  [146, 22, 146, -5, "#f5b544", "#ffd79a"],
  [790, 24, 132, 6, "#ff8a3d", "#ffb37a"],
  [818, 27, 118, 9, "#31313a", "#62626f"],
  [849, 23, 140, 12, "#dad7de", "#ffffff"],
  [876, 25, 124, 15, "#e8730a", "#ff8a3d"],
];

// Horizontal stacks either side of the open book: [x, width, thickness, colour]
const LEFT_STACK: [number, number, number, string][] = [
  [186, 150, 26, "#e8730a"],
  [178, 158, 24, "#f5b544"],
  [190, 146, 22, "#dad7de"],
  [182, 152, 26, "#62626f"],
  [176, 160, 24, "#ff8a3d"],
];

const RIGHT_STACK: [number, number, number, string][] = [
  [618, 152, 24, "#31313a"],
  [610, 160, 26, "#ff8a3d"],
  [622, 146, 22, "#dad7de"],
  [614, 156, 24, "#f5b544"],
  [606, 164, 26, "#e8730a"],
];

const PAGE_COUNT = 13;
const SPINE_X = 480;

export default function BookShelfHero({ className }: { className?: string }) {
  const rootRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const books = root.querySelectorAll<SVGGElement>(".book");
    const pages = root.querySelectorAll<SVGGElement>(".page");
    const openBook = root.querySelector(".open-book");
    const shadow = root.querySelector(".shelf-shadow");

    // The SVG's natural state is the finished composition, so if motion is not
    // wanted we simply leave it alone rather than animating into place.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let safety: ReturnType<typeof setTimeout> | undefined;

    const ctx = gsap.context(() => {
      gsap.set(books, { transformOrigin: "50% 100%" });
      gsap.set(pages, { transformOrigin: `${SPINE_X}px ${BASE - 6}px` });

      const tl = gsap.timeline({ delay: 0.15 });

      // The entrance animates *from* hidden, so a stalled ticker (backgrounded
      // tab, throttling) would otherwise leave the hero blank. Snap it done.
      safety = setTimeout(() => {
        if (tl.progress() < 1) tl.progress(1);
      }, 3500);

      tl.from(shadow, { scaleX: 0.4, opacity: 0, duration: 1, ease: "power3.out" }, 0);

      // Books rise onto the shelf, working outwards from the middle.
      tl.from(
        books,
        {
          y: 70,
          opacity: 0,
          rotate: (i: number) => (i % 2 === 0 ? -6 : 6),
          duration: 0.9,
          ease: "back.out(1.4)",
          stagger: { each: 0.045, from: "center" },
        },
        0,
      );

      // The centre book opens and its pages fan out.
      tl.from(openBook, { scaleY: 0.6, opacity: 0, duration: 0.7, ease: "power3.out", transformOrigin: "50% 100%" }, 0.25);
      tl.from(
        pages,
        { rotate: 0, opacity: 0, duration: 0.9, ease: "power3.out", stagger: { each: 0.035, from: "center" } },
        0.4,
      );

      // Idle: pages breathe, the whole shelf drifts a little.
      tl.to(
        pages,
        {
          rotate: (i: number) => {
            const spread = (i - (PAGE_COUNT - 1) / 2) / ((PAGE_COUNT - 1) / 2);
            return spread * 78 + spread * 4;
          },
          duration: 2.6,
          ease: "sine.inOut",
          stagger: { each: 0.04, from: "center" },
          yoyo: true,
          repeat: -1,
        },
        ">-0.2",
      );

      gsap.to(root, { y: -6, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, root);

    return () => {
      if (safety) clearTimeout(safety);
      ctx.revert();
    };
  }, []);

  // Page fan angles, evenly spread either side of vertical.
  const pageAngle = (i: number) => {
    const spread = (i - (PAGE_COUNT - 1) / 2) / ((PAGE_COUNT - 1) / 2);
    return spread * 78;
  };

  return (
    <svg
      ref={rootRef}
      viewBox="30 140 900 180"
      className={className}
      role="img"
      aria-label="A shelf of books with one open in the middle"
    >
      <defs>
        <linearGradient id="shelfShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-void)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-void)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-void)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pageFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#dad7de" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <ellipse className="shelf-shadow" cx="480" cy={BASE + 8} rx="440" ry="10" fill="url(#shelfShadow)" />

      {LEANERS.map(([x, w, h, rot, spine, edge], i) => (
        <g key={`lean-${i}`} className="book" transform={`rotate(${rot} ${x + w / 2} ${BASE})`}>
          <rect x={x} y={BASE - h} width={w} height={h} rx="2" fill={spine} />
          <rect x={x + w - 5} y={BASE - h} width="5" height={h} rx="1" fill={edge} opacity="0.65" />
          <rect x={x + 4} y={BASE - h + 12} width={Math.max(w - 13, 4)} height="2" rx="1" fill="#08080a" opacity="0.35" />
          <rect x={x + 4} y={BASE - h + 18} width={Math.max(w - 17, 3)} height="2" rx="1" fill="#08080a" opacity="0.25" />
        </g>
      ))}

      {[LEFT_STACK, RIGHT_STACK].map((stack, si) => {
        let y = BASE;
        return stack.map(([x, w, t, color], i) => {
          y -= t;
          const top = y;
          return (
            <g key={`stack-${si}-${i}`} className="book">
              <rect x={x} y={top} width={w} height={t} rx="3" fill={color} />
              <rect x={x} y={top} width={w} height="3" rx="1.5" fill="#ffffff" opacity="0.22" />
              <rect x={x + 6} y={top + t / 2 - 1} width={w - 12} height="2" rx="1" fill="#08080a" opacity="0.25" />
            </g>
          );
        });
      })}

      {/* Open book in the middle: the one you are reading. */}
      <g className="open-book">
        {Array.from({ length: PAGE_COUNT }).map((_, i) => (
          <g key={`page-${i}`} className="page" transform={`rotate(${pageAngle(i)} ${SPINE_X} ${BASE - 6})`}>
            <path
              d={`M ${SPINE_X - 5} ${BASE - 6} L ${SPINE_X - 7} ${BASE - 128} Q ${SPINE_X} ${BASE - 140} ${SPINE_X + 7} ${BASE - 128} L ${SPINE_X + 5} ${BASE - 6} Z`}
              fill="url(#pageFace)"
              stroke="var(--color-fog)"
              strokeWidth="0.75"
              strokeOpacity="0.5"
            />
          </g>
        ))}
        {/* Covers and spine sit above the fan. */}
        <path
          d={`M ${SPINE_X - 96} ${BASE} L ${SPINE_X - 96} ${BASE - 34} Q ${SPINE_X} ${BASE - 48} ${SPINE_X + 96} ${BASE - 34} L ${SPINE_X + 96} ${BASE} Z`}
          fill="var(--color-graphite)"
        />
        <path
          d={`M ${SPINE_X - 92} ${BASE - 3} L ${SPINE_X - 92} ${BASE - 32} Q ${SPINE_X} ${BASE - 45} ${SPINE_X + 92} ${BASE - 32} L ${SPINE_X + 92} ${BASE - 3} Z`}
          fill="#dad7de"
          opacity="0.9"
        />
        <path
          d={`M ${SPINE_X - 13} ${BASE + 2} L ${SPINE_X - 13} ${BASE - 74} Q ${SPINE_X} ${BASE - 88} ${SPINE_X + 13} ${BASE - 74} L ${SPINE_X + 13} ${BASE + 2} Z`}
          fill="var(--accent)"
        />
        <path
          d={`M ${SPINE_X - 13} ${BASE + 2} L ${SPINE_X - 13} ${BASE - 74} Q ${SPINE_X} ${BASE - 88} ${SPINE_X} ${BASE - 84} L ${SPINE_X} ${BASE + 2} Z`}
          fill="#08080a"
          opacity="0.18"
        />
      </g>
    </svg>
  );
}
