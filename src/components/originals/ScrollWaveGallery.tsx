"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_IMAGES = Array.from({ length: 12 }, (_, i) => `/scroll-wave/img${i + 1}.jpg`);
const ASPECT_RATIOS = ["3/2", "4/3", "5/4", "7/5"];

const IMAGE_BASE_HEIGHT = 375;

// Lenis' default lerp; these triggers have no scrub, so they track it directly.
const smoothing = (dt: number) => 1 - Math.pow(0.9, dt * 60);

export default function ScrollWaveGallery({
  images = DEFAULT_IMAGES,
  intro = "Loose Structure",
  outro = "Thanks for scrolling",
  background = "#e3e4d8",
  textColor = "#000000",
  baseAmp = 10,
  flowAmp = 15,
  detailAmp = 2.5,
  clipMax = 20,
  fontFamily = "var(--font-instrument-serif), serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  images?: string[];
  intro?: string;
  outro?: string;
  background?: string;
  textColor?: string;
  baseAmp?: number;
  flowAmp?: number;
  detailAmp?: number;
  clipMax?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const items = [...track.querySelectorAll<HTMLDivElement>("[data-wave-image]")];
    if (!items.length) return;

    // The three sine layers the reference stacks: a slow swing, a faster flow,
    // and a fine detail wobble on top.
    const waves = {
      base: { amp: baseAmp / 100, freq: 1.0, speed: 1.0, phase: 5.0 },
      flow: { amp: flowAmp / 100, freq: 5.0, speed: 5.0, phase: 10.0 },
      detail: { amp: detailAmp / 100, freq: 5.0, speed: 1.5, phase: 2.5 },
    };
    const clipPower = 2;
    const total = items.length;

    // cq height units need a size container; publishing the measured height
    // instead keeps the sections tied to the frame in any layout.
    function publishFrameHeight() {
      root!.style.setProperty("--frame-h", `${root!.clientHeight}px`);
    }
    publishFrameHeight();

    function sizeImages() {
      const sizeFactor = Math.min(root!.clientWidth / 750, 1);
      const shrinkStartIndex = Math.floor(total * 0.75);
      items.forEach((item, i) => {
        const shrinkFactor =
          i >= shrinkStartIndex ? (i - shrinkStartIndex + 1) / (total - shrinkStartIndex) : 0;
        item.style.height = `${Math.round(IMAGE_BASE_HEIGHT * sizeFactor * (1 - shrinkFactor * 0.5))}px`;
      });
    }
    sizeImages();

    // Each image's own progress is how far it has travelled across the frame,
    // which is what "top bottom -> bottom top" measures in the reference.
    function apply(scroll: number) {
      const viewport = root!.clientHeight;
      const w = root!.clientWidth;

      items.forEach((item, index) => {
        const normalizedIndex = index / (total - 1);
        const itemTop = item.offsetTop - scroll;
        const span = viewport + item.offsetHeight;
        const progress = gsap.utils.clamp(0, 1, (viewport - itemTop) / span);

        const { base, flow, detail } = waves;

        const baseWave = Math.sin(
          normalizedIndex * base.freq + (1 - progress) * base.speed + base.phase,
        );
        const flowWave =
          0.5 + Math.sin(normalizedIndex * flow.freq + flow.phase + progress * flow.speed);
        const detailWave =
          0.5 + Math.sin(normalizedIndex * detail.freq + detail.phase + progress * detail.speed);

        const translateX =
          (w - item.offsetWidth) / 2 -
          w * 0.1 +
          baseWave * w * base.amp +
          flowWave * w * flow.amp +
          detailWave * w * detail.amp;

        const centerOffset = Math.abs(progress - 0.5) * 2;
        const clipAmount = Math.pow(centerOffset, clipPower) * clipMax;

        item.style.translate = `${translateX}px`;
        item.style.clipPath = `inset(0 ${clipAmount}% 0 ${clipAmount}%)`;
      });
    }

    const rate = Math.max(0.2, speed / 100);
    let scroll = 0;
    let target = 0;
    let userDriven = false;

    const maxScroll = () => Math.max(1, track!.scrollHeight - root!.clientHeight);

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
        target += dir * dt * maxScroll() * 0.09 * rate;
        if (target >= maxScroll()) {
          target = maxScroll();
          dir = -1;
        } else if (target <= 0) {
          target = 0;
          dir = 1;
        }
      }
      scroll += (target - scroll) * smoothing(dt);
      track!.style.transform = `translateY(${-scroll}px)`;
      apply(scroll);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      publishFrameHeight();
      sizeImages();
      apply(scroll);
    });
    ro.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("wheel", onWheel);
    };
  }, [images, baseAmp, flowAmp, detailAmp, clipMax, speed, autoPlay]);

  const headingStyle = {
    fontFamily,
    fontSize: `clamp(calc(2rem * ${scale}), calc(6cqw * ${scale}), calc(7rem * ${scale}))`,
  };

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{ isolation: "isolate", background, color: textColor, containerType: "inline-size" }}
    >
      <div ref={trackRef} className="absolute top-0 left-0 w-full will-change-transform">
        <div className="w-full flex items-center justify-center p-8" style={{ height: "var(--frame-h, 100%)" }}>
          <h1 className="text-center font-medium leading-none" style={headingStyle}>
            {intro}
          </h1>
        </div>

        <div className="flex flex-col items-start p-8 overflow-hidden">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              data-wave-image
              className="relative overflow-hidden will-change-[transform,clip-path]"
              style={{
                aspectRatio: ASPECT_RATIOS[i % ASPECT_RATIOS.length],
                clipPath: "inset(0 20% 0 20%)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="w-full flex items-center justify-center p-8" style={{ height: "var(--frame-h, 100%)" }}>
          <h1 className="text-center font-medium leading-none" style={headingStyle}>
            {outro}
          </h1>
        </div>
      </div>
    </div>
  );
}
