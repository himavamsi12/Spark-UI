"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const DEFAULT_IMAGES = Array.from({ length: 5 }, (_, i) => `/steelworks-reveal/img-${i + 1}.jpg`);
const ROTATIONS = [-15, 5, -7.5, 10, -2.5];

/** Splits a string into masked lines, each able to ride up independently. */
function MaskedLines({
  text,
  className,
  style,
  register,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  register: (el: HTMLSpanElement | null) => void;
}) {
  return (
    <span className={`block overflow-hidden ${className ?? ""}`} style={style}>
      <span ref={register} className="block will-change-transform" style={{ transform: "translateY(125%)" }}>
        {text}
      </span>
    </span>
  );
}

export default function SteelworksReveal({
  images = DEFAULT_IMAGES,
  brand = "Foundry & Form",
  tagline = "Industrial Design Consultancy",
  navItems = ["Work", "Catalogue", "About"],
  headline = "We design objects that carry the weight of their own conviction, where every curve and joint exists not for beauty but because the material demanded it.",
  contactLabel = "Say Hello",
  contactLinks = ["info@foundryandform.com", "View Enquiries"],
  background = "#0f0f0f",
  preloaderColor = "#ffffff",
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  replayKey = 0,
}: {
  images?: string[];
  brand?: string;
  tagline?: string;
  navItems?: string[];
  headline?: string;
  contactLabel?: string;
  contactLinks?: string[];
  background?: string;
  preloaderColor?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  replayKey?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navLines = useRef<(HTMLSpanElement | null)[]>([]);
  const headLines = useRef<(HTMLSpanElement | null)[]>([]);
  const socialLines = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!CustomEase.get("hop")) CustomEase.create("hop", "0.9, 0, 0.1, 1");
    if (!CustomEase.get("glide")) CustomEase.create("glide", "0.8, 0, 0.2, 1");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const rate = Math.max(0.2, speed / 100);
    const cards = imgRefs.current.filter(Boolean) as HTMLDivElement[];
    const nav = navLines.current.filter(Boolean) as HTMLSpanElement[];
    const head = headLines.current.filter(Boolean) as HTMLSpanElement[];
    const social = socialLines.current.filter(Boolean) as HTMLSpanElement[];

    const width = root.clientWidth;
    const introScale = 0.2;
    const gap = 40;
    const scaledWidth = width * introScale;
    const rowWidth = scaledWidth * cards.length + gap * (cards.length - 1);
    const centeredStart = (width - rowWidth) / 2;
    const offScreenStart = centeredStart - width * 1.3;

    const centeredX: number[] = [];
    cards.forEach((card, i) => {
      const cx = centeredStart + i * (scaledWidth + gap) + scaledWidth / 2 - width / 2;
      const ox = offScreenStart + i * (scaledWidth + gap) + scaledWidth / 2 - width / 2;
      centeredX[i] = cx;
      gsap.set(card, {
        scale: introScale,
        x: ox,
        rotation: ROTATIONS[i % ROTATIONS.length],
        borderRadius: "2.5rem",
      });
    });

    gsap.set([...nav, ...head, ...social], { yPercent: 125 });
    gsap.set(overlayRef.current, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });
    gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left" });

    const tl = gsap.timeline({ delay: 0.4 / rate });

    // Loading bar fills from the left, then empties from the right.
    tl.to(barRef.current, {
      scaleX: 1,
      duration: 1.5 / rate,
      ease: "glide",
      onComplete: () => gsap.set(barRef.current, { transformOrigin: "right" }),
    });
    tl.to(barRef.current, { scaleX: 0, duration: 1.25 / rate, ease: "hop" });

    // The curtain lifts while the bar is still emptying.
    tl.to(
      overlayRef.current,
      { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1 / rate, ease: "hop" },
      `<${0.75 / rate}`,
    );

    // The row slides in, each card a beat behind the one before it.
    cards.forEach((card, i) => {
      tl.to(card, { x: centeredX[i], duration: 1.5 / rate, ease: "glide" }, `<${0.025 / rate}`);
    });

    // Outer cards clear the frame while the middle one takes it over.
    const outerLeft = cards.slice(0, Math.floor(cards.length / 2));
    const outerRight = cards.slice(Math.ceil(cards.length / 2));
    const hero = cards[Math.floor(cards.length / 2)];

    tl.to(outerLeft, { x: "-100vw", duration: 1.5 / rate, ease: "glide" }, "spread");
    tl.to(outerRight, { x: "100vw", duration: 1.5 / rate, ease: "glide" }, "spread");
    tl.to(
      hero,
      { scale: 1, x: 0, rotation: 0, borderRadius: 0, duration: 1.5 / rate, ease: "glide" },
      "<",
    );

    tl.to(nav, { yPercent: 0, duration: 1 / rate, stagger: 0.1 / rate, ease: "power3.out" }, `<${1 / rate}`);
    tl.to(head, { yPercent: 0, duration: 1 / rate, stagger: 0.1 / rate, ease: "power3.out" }, "<");
    tl.to(
      social,
      { yPercent: 0, duration: 1 / rate, stagger: 0.1 / rate, ease: "power3.out" },
      `<${0.25 / rate}`,
    );

    return () => {
      tl.kill();
    };
  }, [images, speed, replayKey, headline, brand, tagline, navItems, contactLabel, contactLinks]);

  // The headline is broken into chunks so each rides up on its own, standing
  // in for SplitText's line masking without the plugin.
  const headlineChunks = headline.split(/(?<=,)\s+|(?<=\.)\s+/).filter(Boolean);
  const chunks = headlineChunks.length > 1 ? headlineChunks : [headline];

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background, fontFamily, containerType: "inline-size" }}
    >
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          ref={(el) => {
            imgRefs.current[i] = el;
          }}
          className="absolute inset-0 overflow-hidden will-change-transform"
          style={{ borderRadius: "0.5rem", transformOrigin: "center center" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} className="w-full h-full object-cover" />
        </div>
      ))}

      <div className="absolute inset-0 h-full flex flex-col justify-between z-[2] px-8 py-[15%] text-white">
        <div />
        <div className="w-3/5">
          {chunks.map((chunk, i) => (
            <MaskedLines
              key={i}
              text={chunk}
              register={(el) => {
                headLines.current[i] = el;
              }}
              style={{
                fontSize: `clamp(calc(0.9rem * ${scale}),calc(3cqw * ${scale}),calc(3rem * ${scale}))`,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: `calc(0.8rem * ${scale})` }}>
          <MaskedLines
            text={contactLabel}
            register={(el) => {
              socialLines.current[0] = el;
            }}
          />
          {contactLinks.map((link, i) => (
            <MaskedLines
              key={link}
              text={link}
              register={(el) => {
                socialLines.current[i + 1] = el;
              }}
            />
          ))}
        </div>
      </div>

      <nav className="absolute top-0 left-0 w-full flex items-start justify-between p-8 z-[3] text-white">
        <div style={{ fontSize: `calc(0.8rem * ${scale})` }}>
          <MaskedLines
            text={brand}
            register={(el) => {
              navLines.current[0] = el;
            }}
          />
          <MaskedLines
            text={tagline}
            register={(el) => {
              navLines.current[1] = el;
            }}
          />
        </div>
        <div className="flex gap-16" style={{ fontSize: `calc(0.8rem * ${scale})` }}>
          {navItems.map((item, i) => (
            <MaskedLines
              key={item}
              text={item}
              register={(el) => {
                navLines.current[i + 2] = el;
              }}
            />
          ))}
        </div>
      </nav>

      <div ref={overlayRef} className="absolute inset-0 z-10" style={{ background }}>
        <div ref={barRef} className="absolute top-0 w-full h-2" style={{ background: preloaderColor }} />
      </div>
    </div>
  );
}
