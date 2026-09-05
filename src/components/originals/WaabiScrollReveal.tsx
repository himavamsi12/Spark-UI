"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_GALLERY = Array.from({ length: 16 }, (_, i) => `/waabi-scroll/img${i + 1}.jpg`);

// Columns start low and offset sideways in the reference's CSS, then each is
// tweened up to its own end point; the drift is that whole span, not 0 -> end.
const COLUMN_START_Y = [1000, 500, 500, 1000];
const COLUMN_END_Y = [-500, -250, -250, -500];
const COLUMN_OFFSET_X = [0, -225, 225, 0];

// The reference's flow, in frames: the hero occupies one and is pinned for 3.5
// while `.about` sits 2.75 further down, so the gallery starts climbing over
// the hero before the shrink has finished.
const HERO_PIN = 3.5;
const ABOUT_OFFSET = 3.75;

export default function WaabiScrollReveal({
  heroImage = "/waabi-scroll/hero.jpg",
  gallery = DEFAULT_GALLERY,
  headline = "A study of motion unfolding inside a single frame",
  copy = "The moment where stillness transforms into movement",
  aboutText = "Fragments of motion and atmosphere gathered into a drifting collection of quiet visual moments.",
  outro = "The frame settles back into quiet stillness.",
  background = "#e3e3db",
  outroBackground = "#cecec6",
  textColor = "#000000",
  heroTextColor = "#ffffff",
  finalImageSize = 150,
  fontFamily = "var(--font-inter), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  heroImage?: string;
  gallery?: string[];
  headline?: string;
  copy?: string;
  aboutText?: string;
  outro?: string;
  background?: string;
  outroBackground?: string;
  textColor?: string;
  heroTextColor?: string;
  finalImageSize?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLDivElement>(null);
  const heroHeaderRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const heroImg = heroImgRef.current;
    const heroHeader = heroHeaderRef.current;
    const heroCopy = heroCopyRef.current;
    if (!root || !track || !heroImg || !heroHeader || !heroCopy) return;

    const words = [...heroCopy.querySelectorAll<HTMLSpanElement>("[data-word]")];
    const columns = [...track.querySelectorAll<HTMLDivElement>("[data-col]")];

    // cq height units need a size container; publishing the measured height
    // instead keeps the pin length tied to the frame in any layout.
    const publishFrameHeight = () => {
      root!.style.setProperty("--frame-h", `${root!.clientHeight}px`);
    };
    publishFrameHeight();

    let isHeroCopyHidden = false;

    function applyHero(progress: number) {
      const w = root!.clientWidth;
      const h = root!.clientHeight;

      const heroHeaderProgress = Math.min(progress / 0.29, 1);
      gsap.set(heroHeader, { yPercent: -heroHeaderProgress * 100 });

      const heroWordsProgress = Math.max(0, Math.min((progress - 0.29) / 0.21, 1));
      const totalWords = words.length;
      words.forEach((word, i) => {
        const wordStart = i / totalWords;
        const wordEnd = (i + 1) / totalWords;
        gsap.set(word, {
          opacity: Math.max(0, Math.min((heroWordsProgress - wordStart) / (wordEnd - wordStart), 1)),
        });
      });

      if (progress > 0.64 && !isHeroCopyHidden) {
        isHeroCopyHidden = true;
        gsap.to(heroCopy, { opacity: 0, duration: 0.2 });
      } else if (progress <= 0.64 && isHeroCopyHidden) {
        isHeroCopyHidden = false;
        gsap.to(heroCopy, { opacity: 1, duration: 0.2 });
      }

      const heroImgProgress = Math.max(0, Math.min((progress - 0.71) / 0.29, 1));
      gsap.set(heroImg, {
        width: gsap.utils.interpolate(w, finalImageSize, heroImgProgress),
        height: gsap.utils.interpolate(h, finalImageSize, heroImgProgress),
        borderRadius: gsap.utils.interpolate(0, 10, heroImgProgress),
      });
    }

    // Sideways offset is fixed; only y is driven by scroll.
    columns.forEach((col, i) => {
      gsap.set(col, { x: COLUMN_OFFSET_X[i % COLUMN_OFFSET_X.length] });
    });

    function applyColumns(scroll: number) {
      const viewport = root!.clientHeight;
      const about = track!.querySelector<HTMLDivElement>("[data-about]");
      if (!about) return;
      // Mirrors "top bottom -> bottom top" on the about section.
      const top = about.offsetTop - scroll;
      const progress = gsap.utils.clamp(0, 1, (viewport - top) / (viewport + about.offsetHeight));
      columns.forEach((col, i) => {
        const from = COLUMN_START_Y[i % COLUMN_START_Y.length];
        const to = COLUMN_END_Y[i % COLUMN_END_Y.length];
        gsap.set(col, { y: gsap.utils.interpolate(from, to, progress) });
      });
    }

    const rate = Math.max(0.2, speed / 100);
    let scroll = 0;
    let target = 0;
    let userDriven = false;

    // Derived from the flow rather than scrollHeight: the columns are taller
    // than their section and overflow it, which would otherwise stretch the
    // scroll well past the outro.
    const maxScroll = () => Math.max(1, root!.clientHeight * (ABOUT_OFFSET + 1));

    function frame(value: number) {
      const pinLength = root!.clientHeight * HERO_PIN;
      // Hero stays put for its pin, then the whole track scrolls past it.
      const heroProgress = gsap.utils.clamp(0, 1, value / pinLength);
      applyHero(heroProgress);
      track!.style.transform = `translateY(${-value}px)`;
      applyColumns(value);
    }

    frame(0);

    function onWheel(e: WheelEvent) {
      const next = gsap.utils.clamp(0, maxScroll(), target + e.deltaY * rate);
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
        target += dir * dt * maxScroll() * 0.08 * rate;
        if (target >= maxScroll()) {
          target = maxScroll();
          dir = -1;
        } else if (target <= 0) {
          target = 0;
          dir = 1;
        }
      }
      scroll += (target - scroll) * Math.min(1, dt * 6);
      frame(scroll);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      publishFrameHeight();
      frame(scroll);
    });
    ro.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gsap.killTweensOf(heroCopy);
      root.removeEventListener("wheel", onWheel);
    };
  }, [gallery, copy, finalImageSize, speed, autoPlay]);

  const words = copy.split(/\s+/).filter(Boolean);
  const perColumn = Math.ceil(gallery.length / 4);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        isolation: "isolate",
        background,
        color: textColor,
        fontFamily,
        containerType: "inline-size",
      }}
    >
      {/* The hero is pinned, so it lives outside the scrolling track, and sits
          under it: the reference pins with pinSpacing false, leaving `.about` a
          later positioned sibling that rides up over the shrinking image. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          ref={heroImgRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden will-change-[width,height]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" draggable={false} className="w-full h-full object-cover" />
        </div>

        <div
          ref={heroHeaderRef}
          className="absolute inset-0 flex items-end will-change-transform"
          style={{ padding: "clamp(1.5rem, 4cqw, 4rem)", color: heroTextColor }}
        >
          <h1
            className="w-[75%] font-normal leading-none tracking-[-0.03em]"
            style={{ fontSize: `clamp(calc(1.6rem * ${scale}), calc(5cqw * ${scale}), calc(5rem * ${scale}))` }}
          >
            {headline}
          </h1>
        </div>

        <div
          className="absolute inset-0 flex items-end"
          style={{ padding: "clamp(1.5rem, 4cqw, 4rem)", color: heroTextColor }}
        >
          <h3
            ref={heroCopyRef}
            className="w-[50%] font-normal leading-none tracking-[-0.03em]"
            style={{ fontSize: `clamp(calc(1.1rem * ${scale}), calc(3cqw * ${scale}), calc(3rem * ${scale}))` }}
          >
            {words.map((word, i) => (
              <span key={`${word}-${i}`} data-word className="inline-block opacity-0">
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h3>
        </div>
      </div>

      <div ref={trackRef} className="absolute top-0 left-0 w-full z-[1] will-change-transform">
        {/* Spacer standing in for the pinned hero's scroll length. */}
        <div className="w-full" style={{ height: `calc(var(--frame-h, 100%) * ${ABOUT_OFFSET})` }} />

        <div data-about className="relative w-full flex items-center justify-center text-center" style={{ height: "var(--frame-h, 100%)" }}>
          <div
            className="w-full h-full flex justify-between items-center"
            style={{ padding: "clamp(1.5rem, 4cqw, 4rem)" }}
          >
            {[0, 1, 2, 3].map((col) => (
              <div
                key={col}
                data-col
                className="relative h-[125%] flex flex-col justify-around will-change-transform"
              >
                {gallery.slice(col * perColumn, col * perColumn + perColumn).map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="w-[125px] h-[125px] rounded-[10px] overflow-hidden shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" draggable={false} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%]">
            <h3
              className="font-normal leading-none tracking-[-0.03em]"
              style={{ fontSize: `clamp(calc(1rem * ${scale}), calc(2.5cqw * ${scale}), calc(3rem * ${scale}))` }}
            >
              {aboutText}
            </h3>
          </div>
        </div>

        <div
          className="w-full flex items-center justify-center text-center"
          style={{ height: "var(--frame-h, 100%)", background: outroBackground }}
        >
          <h3
            className="w-[35%] font-normal leading-none tracking-[-0.03em]"
            style={{ fontSize: `clamp(calc(1rem * ${scale}), calc(2.5cqw * ${scale}), calc(3rem * ${scale}))` }}
          >
            {outro}
          </h3>
        </div>
      </div>
    </div>
  );
}
