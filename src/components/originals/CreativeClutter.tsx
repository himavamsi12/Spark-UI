"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Zap, Grid3x3, BookOpen } from "lucide-react";

gsap.registerPlugin(Flip);

const ITEMS = [
  "music",
  "appicon",
  "cd",
  "cursor",
  "dialog",
  "folder",
  "lighter",
  "macmini",
  "paper",
  "passport",
  "portrait",
] as const;

const SIZES: Record<string, number> = {
  music: 325,
  appicon: 100,
  cd: 400,
  cursor: 125,
  dialog: 300,
  folder: 150,
  lighter: 225,
  macmini: 250,
  paper: 375,
  passport: 250,
  portrait: 375,
};

/** Each mode is a full set of positions; Flip animates between them. */
const ARRANGEMENTS = {
  chaos: {
    header: { x: 50, y: 47.5, center: true },
    items: [
      { id: "music", x: -2.5, y: -2.5, rotation: -15 },
      { id: "appicon", x: 20, y: 15, rotation: 5 },
      { id: "cd", x: 72.5, y: 5, rotation: 0 },
      { id: "cursor", x: 72.5, y: 75, rotation: 0 },
      { id: "dialog", x: 80, y: 60, rotation: 15 },
      { id: "folder", x: 90, y: 50, rotation: 5 },
      { id: "lighter", x: 2.5, y: 45, rotation: -10 },
      { id: "macmini", x: 9.5, y: 55, rotation: 15 },
      { id: "paper", x: 5, y: 15, rotation: 10 },
      { id: "passport", x: -2.5, y: 65, rotation: -35 },
      { id: "portrait", x: 65, y: 20, rotation: -5 },
    ],
  },
  cleanup: {
    header: { x: 70, y: 37.5, center: false },
    items: [
      { id: "music", x: 76.5, y: -5, rotation: 0 },
      { id: "appicon", x: 64.5, y: 6, rotation: 0 },
      { id: "cd", x: 0, y: 47.5, rotation: 0 },
      { id: "cursor", x: 63.5, y: 23, rotation: 0 },
      { id: "dialog", x: 34.5, y: 59, rotation: 0 },
      { id: "folder", x: 24.5, y: 33, rotation: 0 },
      { id: "lighter", x: -6, y: 3.5, rotation: 0 },
      { id: "macmini", x: 82.5, y: 66, rotation: 0 },
      { id: "paper", x: 9, y: -3.5, rotation: 0 },
      { id: "passport", x: 60, y: 65.5, rotation: 0 },
      { id: "portrait", x: 36.5, y: 5.5, rotation: 0 },
    ],
  },
  notebook: {
    header: { x: 50, y: 47.5, center: true },
    items: [
      { id: "music", x: 45, y: 0.5, rotation: 20 },
      { id: "appicon", x: 65, y: 70, rotation: 25 },
      { id: "cd", x: 27.5, y: 15, rotation: 10 },
      { id: "cursor", x: 75, y: 35, rotation: 0 },
      { id: "dialog", x: 30, y: 57.5, rotation: 10 },
      { id: "folder", x: 25, y: 40, rotation: 10 },
      { id: "lighter", x: 30, y: 7.5, rotation: 30 },
      { id: "macmini", x: 50, y: 50, rotation: -5 },
      { id: "paper", x: 10, y: 10, rotation: -30 },
      { id: "passport", x: 16.5, y: 50, rotation: -20 },
      { id: "portrait", x: 57.5, y: 20, rotation: 10 },
    ],
  },
} as const;

type Mode = keyof typeof ARRANGEMENTS;

const MODE_BUTTONS: { mode: Mode; icon: typeof Zap; label: string }[] = [
  { mode: "chaos", icon: Zap, label: "Chaos" },
  { mode: "cleanup", icon: Grid3x3, label: "Cleanup" },
  { mode: "notebook", icon: BookOpen, label: "Notebook" },
];

export default function CreativeClutter({
  title = "Creative Clutter",
  body = "The best ideas live somewhere between a coffee stain and a half-open folder, scattered things have a way of finding others when you stop trying to organize.",
  background = "#e8e6df",
  textColor = "#141414",
  itemScale = 100,
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
}: {
  title?: string;
  body?: string;
  background?: string;
  textColor?: string;
  itemScale?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const deskRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("chaos");
  const modeRef = useRef<Mode>("chaos");

  const setLayout = useCallback(
    (next: Mode) => {
      const desk = deskRef.current;
      const header = headerRef.current;
      if (!desk || !header) return;

      const w = desk.offsetWidth;
      const h = desk.offsetHeight;
      const layout = ARRANGEMENTS[next];
      const factor = itemScale / 100;

      // Below 1000px the header always centres, matching the reference.
      const isNarrow = w < 1000;
      const centred = isNarrow || layout.header.center;
      const offsetX = centred ? header.offsetWidth / 2 : 0;
      const offsetY = centred ? header.offsetHeight / 2 : 0;
      const hx = isNarrow ? 50 : layout.header.x;
      const hy = isNarrow ? 47.5 : layout.header.y;

      gsap.set(header, { x: (hx / 100) * w - offsetX, y: (hy / 100) * h - offsetY, rotation: 0 });

      for (const { id, x, y, rotation } of layout.items) {
        gsap.set(desk.querySelector(`[data-item="${id}"]`), {
          x: (x / 100) * w,
          y: (y / 100) * h,
          width: SIZES[id] * factor,
          height: SIZES[id] * factor,
          rotation,
        });
      }
    },
    [itemScale],
  );

  useEffect(() => {
    setLayout(modeRef.current);
    const desk = deskRef.current;
    if (!desk) return;
    const ro = new ResizeObserver(() => setLayout(modeRef.current));
    ro.observe(desk);
    return () => ro.disconnect();
  }, [setLayout]);

  function switchMode(next: Mode) {
    if (next === modeRef.current) return;
    const desk = deskRef.current;
    const header = headerRef.current;
    if (!desk || !header) return;

    const targets = [header, ...Array.from(desk.querySelectorAll("[data-item]"))];
    // Flip records where everything is, the layout moves it, then Flip
    // animates the difference.
    const state = Flip.getState(targets);
    modeRef.current = next;
    setMode(next);
    setLayout(next);

    Flip.from(state, {
      duration: 1.25 / Math.max(0.2, speed / 100),
      ease: "power3.inOut",
      stagger: { amount: 0.1, from: "center" },
      absolute: true,
    });
  }

  return (
    <div
      ref={deskRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background, fontFamily, containerType: "inline-size" }}
    >
      <div ref={headerRef} className="absolute top-0 left-0 w-[min(420px,60%)] z-[2]" style={{ color: textColor }}>
        <h1
          className="font-medium leading-[0.95] tracking-[-0.02em] mb-2"
          style={{ fontSize: `clamp(calc(1.25rem * ${scale}),calc(4cqw * ${scale}),calc(3rem * ${scale}))` }}
        >
          {title}
        </h1>
        <p className="leading-snug opacity-70" style={{ fontSize: `calc(0.8rem * ${scale})` }}>
          {body}
        </p>
      </div>

      {ITEMS.map((id) => (
        <div key={id} data-item={id} className="absolute top-0 left-0 will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/creative-clutter/${id}.png`}
            alt=""
            draggable={false}
            className="w-full h-full object-contain"
          />
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[3]">
        {MODE_BUTTONS.map(({ mode: m, icon: Icon, label }) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            title={label}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: mode === m ? textColor : "transparent",
              color: mode === m ? background : textColor,
              border: `1px solid ${textColor}33`,
            }}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
    </div>
  );
}
