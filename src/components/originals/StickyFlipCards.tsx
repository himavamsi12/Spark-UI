"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowDown, Unlock, Layers, Boxes, Infinity as InfinityIcon } from "lucide-react";

const CARD_ICONS = [Unlock, Layers, Boxes, InfinityIcon];

const DEFAULT_TITLES = ["Final Hold", "Layered Time", "Weight & Flow", "Soft Motion"];
const DEFAULT_BODIES = [
  "Everything settles into place, leaving a lasting frame that feels complete.",
  "Moments stack, overlap, and reveal themselves slowly as the scroll continues.",
  "Elements carry presence, easing in and out with balance, never rushed, never still.",
  "Subtle shifts and gentle transitions that build a quiet sense of rhythm as you move forward.",
];
const DEFAULT_CARD_COLORS = ["#fd4400", "#e7ebdf", "#2668fd", "#fdcb40"];

// Scroll budget, in svh, matching the reference's phase table.
const CARDS_ENTER_END = 100;
const CARD_FLIP_TRIGGER = 200;
const CARD_DISMISS_START = 300;
const CARD_DISMISS_DURATION = 100;

const FLIP_TILT = [-10, -20, -5, 10];
const DISMISS_TILT = [-50, -60, -45, 50];

/** Reference picks card text by hand; luminance reproduces every one of its pairs. */
function readableOn(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.4 ? "#0f0f0f" : "#ffffff";
}

export default function StickyFlipCards({
  headline = "Scroll down and watch everything fall into place",
  frontTitle = "First Frame",
  frontBadge = "Start here",
  frontBody = "A single moment, held in place before everything begins to move.",
  cardTitles = DEFAULT_TITLES,
  cardBodies = DEFAULT_BODIES,
  cardColors = DEFAULT_CARD_COLORS,
  frontColor = "#fd4400",
  background = "#fbfff2",
  textColor = "#0f0f0f",
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  bodyFont = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  headline?: string;
  frontTitle?: string;
  frontBadge?: string;
  frontBody?: string;
  cardTitles?: string[];
  cardBodies?: string[];
  cardColors?: string[];
  frontColor?: string;
  background?: string;
  textColor?: string;
  fontFamily?: string;
  bodyFont?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRefs = useRef<(HTMLDivElement | null)[]>([]);

  const count = cardTitles.length;

  useEffect(() => {
    const root = rootRef.current;
    const front = frontRef.current;
    const heroHeadline = headlineRef.current;
    const backCards = backRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!root || !front || !heroHeadline || !backCards.length) return;

    const cards = [front, ...backCards];
    const total = CARD_DISMISS_START + backCards.length * CARD_DISMISS_DURATION;
    const svhToProgress = (svh: number) => svh / total;

    // Cards leave in reverse order, so the one on top peels away first.
    const dismissRanges = backCards.map((_, i) => {
      const dismissOrder = backCards.length - 1 - i;
      return [
        svhToProgress(CARD_DISMISS_START + dismissOrder * CARD_DISMISS_DURATION),
        svhToProgress(CARD_DISMISS_START + (dismissOrder + 1) * CARD_DISMISS_DURATION),
      ] as const;
    });

    gsap.set(cards, { xPercent: -50 });
    gsap.set(front, { rotationY: 0 });
    gsap.set(backCards, { rotationY: -180 });

    let isFlipped = false;

    const revealBackCards = () => {
      gsap.to(front, { rotationY: 180, duration: 1, ease: "elastic.out(1,0.5)" });
      backCards.forEach((card, i) => {
        gsap.to(card, {
          rotationY: 0,
          rotationZ: FLIP_TILT[i % FLIP_TILT.length],
          duration: 1,
          ease: "elastic.out(1,0.5)",
        });
      });
    };

    const concealBackCards = () => {
      gsap.to(front, { rotationY: 0, duration: 1, ease: "elastic.out(1,0.5)" });
      gsap.to(backCards, { rotationY: -180, rotationZ: 0, duration: 1, ease: "elastic.out(1,0.5)" });
    };

    function apply(progress: number) {
      const enterProgress = gsap.utils.clamp(
        0,
        1,
        gsap.utils.mapRange(0, svhToProgress(CARDS_ENTER_END), 0, 1, progress),
      );

      gsap.set(cards, { yPercent: gsap.utils.mapRange(0, 1, 50, -50, enterProgress) });
      gsap.set(heroHeadline, { yPercent: gsap.utils.mapRange(0, 1, 0, -100, enterProgress) });

      if (progress > svhToProgress(CARD_FLIP_TRIGGER) && !isFlipped) {
        revealBackCards();
        isFlipped = true;
      } else if (progress <= svhToProgress(CARD_FLIP_TRIGGER) && isFlipped) {
        concealBackCards();
        isFlipped = false;
      }

      backCards.forEach((card, i) => {
        const [dismissStart, dismissEnd] = dismissRanges[i];
        const dismissProgress = gsap.utils.clamp(
          0,
          1,
          gsap.utils.mapRange(dismissStart, dismissEnd, 0, 1, progress),
        );
        gsap.set(card, { yPercent: gsap.utils.mapRange(0, 1, -50, -250, dismissProgress) });
        // Left alone at rest so the elastic flip tilt can finish playing; the
        // dismiss picks up from exactly the angle that tween lands on.
        if (dismissProgress > 0) {
          gsap.set(card, {
            rotation: gsap.utils.mapRange(
              0,
              1,
              FLIP_TILT[i % FLIP_TILT.length],
              DISMISS_TILT[i % DISMISS_TILT.length],
              dismissProgress,
            ),
          });
        }
      });
    }

    apply(0);

    // The reference pins the hero for seven viewport heights and scrubs; the
    // wheel stands in for that here over the same distance.
    const rate = Math.max(0.2, speed / 100);
    let progress = 0;
    let target = 0;
    let userDriven = false;

    function onWheel(e: WheelEvent) {
      const travel = root!.clientHeight * (total / 100);
      const next = gsap.utils.clamp(0, 1, target + (e.deltaY / travel) * rate);
      if (next === target) return;
      e.preventDefault();
      userDriven = true;
      target = next;
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    let dir = 1;
    let last = performance.now();
    function loop(now: number) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (autoPlay && !userDriven) {
        target += dir * dt * 0.1 * rate;
        if (target >= 1) {
          target = 1;
          dir = -1;
        } else if (target <= 0) {
          target = 0;
          dir = 1;
        }
      }
      progress += (target - progress) * Math.min(1, dt);
      apply(progress);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      gsap.killTweensOf(cards);
      root.removeEventListener("wheel", onWheel);
    };
  }, [count, speed, autoPlay]);

  const cardBase =
    "absolute top-1/2 left-1/2 flex flex-col justify-between items-center text-center rounded-2xl will-change-transform [backface-visibility:hidden]";
  const cardSize = {
    width: "clamp(170px, 25cqw, 300px)",
    aspectRatio: "4 / 5",
    padding: "clamp(1rem, 3cqw, 2.5rem) clamp(0.75rem, 2cqw, 1.5rem)",
  } as const;

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        isolation: "isolate",
        background,
        color: textColor,
        fontFamily: bodyFont,
        containerType: "inline-size",
      }}
    >
      <div
        ref={headlineRef}
        className="absolute inset-0 flex items-center justify-center will-change-transform"
      >
        <h1
          className="w-[60%] text-center uppercase font-black leading-[0.85]"
          style={{ fontFamily, fontSize: `clamp(calc(1.6rem * ${scale}), calc(5cqw * ${scale}), calc(7rem * ${scale}))` }}
        >
          {headline}
        </h1>
      </div>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        <div
          ref={frontRef}
          className={cardBase}
          style={{ ...cardSize, background: frontColor, color: readableOn(frontColor) }}
        >
          <h3
            className="uppercase font-black leading-[0.85]"
            style={{ fontFamily, fontSize: `clamp(calc(1.1rem * ${scale}), calc(3cqw * ${scale}), calc(2.5rem * ${scale}))` }}
          >
            {frontTitle}
          </h3>
          <span
            className="uppercase font-medium rounded"
            style={{
              background: "#fff",
              color: "#0f0f0f",
              padding: "0.5rem",
              fontSize: `calc(0.75rem * ${scale})`,
            }}
          >
            {frontBadge}
          </span>
          <p className="leading-[1.1]" style={{ fontSize: `calc(0.85rem * ${scale})` }}>
            {frontBody}
          </p>
          <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0">
            <ArrowDown size={20} />
          </div>
        </div>

        {cardTitles.map((title, i) => {
          const color = cardColors[i % cardColors.length];
          const Icon = CARD_ICONS[i % CARD_ICONS.length];
          return (
            <div
              key={`${title}-${i}`}
              ref={(el) => {
                backRefs.current[i] = el;
              }}
              className={cardBase}
              style={{ ...cardSize, background: color, color: readableOn(color) }}
            >
              <h3
                className="uppercase font-black leading-[0.85]"
                style={{ fontFamily, fontSize: `clamp(calc(1.1rem * ${scale}), calc(3cqw * ${scale}), calc(2.5rem * ${scale}))` }}
              >
                {title}
              </h3>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{ background: readableOn(color), color }}
              >
                <Icon size={22} />
              </div>
              <p className="leading-[1.1]" style={{ fontSize: `calc(0.85rem * ${scale})` }}>
                {cardBodies[i % cardBodies.length]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
