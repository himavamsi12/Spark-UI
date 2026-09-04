"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const TAPES = [
  "/cassette-menu/menu-item-1.png",
  "/cassette-menu/menu-item-2.png",
  "/cassette-menu/menu-item-3.png",
  "/cassette-menu/menu-item-4.png",
];

export default function CassetteMenu({
  overlayColor = "#7b70f5",
  bloomColor = "#beb9f9",
  accentColor = "#f5e089",
  heroText = "Slide One Out",
  fontFamily = "var(--font-google-sans-flex)",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  overlayColor?: string;
  bloomColor?: string;
  accentColor?: string;
  heroText?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  /** Demo-only: self-plays the open/close cycle so the effect is visible without a click. Not part of real usage. */
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const tapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!autoPlay || hasInteracted) return;
    const openDelay = setTimeout(() => setIsOpen(true), 700);
    const closeDelay = setTimeout(() => setIsOpen(false), 700 + 2600);
    const loop = setInterval(() => {
      setIsOpen(true);
      setTimeout(() => setIsOpen(false), 2600);
    }, 4400);
    return () => {
      clearTimeout(openDelay);
      clearTimeout(closeDelay);
      clearInterval(loop);
    };
  }, [autoPlay, hasInteracted]);

  useEffect(() => {
    const root = rootRef.current;
    const menuOverlay = overlayRef.current;
    const menuOverlayBg = bgRef.current;
    const player = playerRef.current;
    const tapes = tapeRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!root || !menuOverlay || !menuOverlayBg || !player || tapes.length === 0) return;

    const isMobile = root.clientWidth < 520;
    const rate = Math.max(0.2, speed / 100);

    gsap.set(player, { yPercent: 300, rotation: 30 });
    gsap.set(tapes, { yPercent: 325, rotation: 30 });

    const openTl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    openTl
      .to(menuOverlay, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1 / rate }, 0)
      .to(menuOverlayBg, { y: "0%", duration: 1 / rate }, 0);
    openTl.to([player, ...tapes], { yPercent: 0, rotation: -15, duration: 1 / rate }, 0.2 / rate);
    openTl.to(tapes, { y: -175, rotation: 0, duration: 0.5 / rate }, `-=${0.5 / rate}`);
    openTl.to(
      player,
      { yPercent: isMobile ? 200 : 175, rotation: 0, duration: 1 / rate, ease: "power2.inOut" },
      1.1 / rate,
    );
    openTl.to(
      tapes,
      {
        y: 0,
        xPercent: isMobile ? 0 : (i: number) => (i - 1.5) * 110,
        yPercent: isMobile ? (i: number) => -75 + i * 65 : 5,
        duration: 1 / rate,
        ease: "power3.inOut",
        stagger: 0.035 / rate,
      },
      "<",
    );

    const closeTl = gsap.timeline({ paused: true, defaults: { ease: "power3.inOut" } });
    if (isMobile) {
      closeTl.to(
        tapes,
        { xPercent: 0, x: 0, y: 0, rotation: 0, yPercent: 250, duration: 1 / rate, overwrite: "auto" },
        0,
      );
    } else {
      closeTl.to(
        tapes,
        {
          xPercent: 0,
          yPercent: 5,
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.65 / rate,
          stagger: 0.035 / rate,
          overwrite: "auto",
        },
        0,
      );
      closeTl.to(tapes, { yPercent: 250, duration: 1 / rate }, `-=${0.35 / rate}`);
    }
    closeTl.to(
      player,
      {
        keyframes: {
          yPercent: isMobile ? [200, 210, 200] : [175, 185, 175],
          rotation: [0, -4, 0],
          easeEach: "power2.inOut",
        },
        duration: 0.35 / rate,
      },
      isMobile ? 0.65 / rate : 1 / rate,
    );
    closeTl.to([player, ...tapes], { yPercent: 300, duration: 0.5 / rate }, 1.5 / rate);
    closeTl
      .to(
        menuOverlay,
        { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)", duration: 0.75 / rate },
        isMobile ? `-=${0.5 / rate}` : `-=${0.35 / rate}`,
      )
      .to(menuOverlayBg, { y: "25%", duration: 0.75 / rate }, "<");

    if (isOpen) openTl.restart();
    else closeTl.restart();

    return () => {
      openTl.kill();
      closeTl.kill();
    };
  }, [isOpen, speed]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-[#0f0f0f]" style={{ fontFamily }}>
      <nav className="absolute top-0 left-0 w-full p-4 flex justify-between z-[100]">
        <div
          className="px-4 py-2 uppercase text-xs font-semibold rounded-md border-2 border-[#0f0f0f]"
          style={{ backgroundColor: accentColor }}
        >
          Analog Bloom
        </div>
        <button
          onClick={() => {
            setHasInteracted(true);
            setIsOpen((v) => !v);
          }}
          className="relative px-4 py-2 uppercase text-xs font-semibold rounded-md border-2 border-[#0f0f0f] transition-transform active:scale-90 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          Menu
          {!autoPlay && !hasInteracted && !isOpen && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: overlayColor }}
            >
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: overlayColor }}
              />
            </span>
          )}
        </button>
      </nav>

      <div
        ref={overlayRef}
        className="absolute inset-0 overflow-hidden z-10"
        style={{
          backgroundColor: overlayColor,
          clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
          willChange: "clip-path",
        }}
      >
        <div
          ref={bgRef}
          className="absolute rounded-full"
          style={{
            bottom: "-50%",
            left: "50%",
            width: "75%",
            aspectRatio: "1",
            backgroundColor: bloomColor,
            transform: "translateX(-50%) translateY(25%)",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          {TAPES.map((src, i) => (
            <div
              key={src}
              ref={(el) => {
                tapeRefs.current[i] = el;
              }}
              className="absolute z-[1]"
              style={{ width: "34%", maxWidth: 200, aspectRatio: "7/5", willChange: "transform" }}
            >
              <img src={src} alt="" className="w-full h-full object-contain" draggable={false} />
            </div>
          ))}

          <div
            ref={playerRef}
            className="absolute z-[2]"
            style={{ width: "42%", maxWidth: 260, aspectRatio: "16/9", willChange: "transform" }}
          >
            <img src="/cassette-menu/cassette.png" alt="" className="w-full h-full object-contain" draggable={false} />
          </div>
        </div>
      </div>

      <section className="relative w-full h-full flex items-center justify-center">
        <h1 className="uppercase font-semibold text-white text-center px-6" style={{ fontSize: `clamp(calc(1.25rem * ${scale}), calc(4vw * ${scale}), calc(3rem * ${scale}))` }}>
          {heroText}
        </h1>
      </section>
    </div>
  );
}
