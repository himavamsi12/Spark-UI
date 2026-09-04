"use client";

import { useEffect, useRef } from "react";

const TOTAL = 10;

export default function PerpetualSlider({
  speed = 100,
  autoPlay = true,
  title = "Perpetual Motion",
  fontFamily = "var(--font-neue-montreal)",
  textScale = 100,
}: {
  speed?: number;
  autoPlay?: boolean;
  title?: string;
  fontFamily?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const config = {
      lerp: 0.075,
      minSize: 0.1,
      growth: 0.25,
      aspect: 1 / 1.25,
    };
    const growthRatio = Math.exp(config.growth);
    const slideCount = Math.ceil(Math.log(1 + (growthRatio - 1) / config.minSize) / config.growth) + 4;
    const scrollSpeed = 3.5 * Math.max(0.2, speed / 100);

    const wrap = (v: number, max: number) => ((v % max) + max) % max;
    const edgeX = (position: number, width: number) => (width * config.minSize * (Math.pow(growthRatio, position) - 1)) / (growthRatio - 1);

    track.innerHTML = "";
    const slides: HTMLDivElement[] = [];
    const streamIndex: number[] = [];
    for (let i = 0; i < slideCount; i++) {
      const slide = document.createElement("div");
      slide.className = "absolute left-0 bottom-0 overflow-hidden";
      slide.style.willChange = "transform";
      const img = document.createElement("img");
      img.className = "w-full h-full object-cover block pointer-events-none";
      img.decoding = "async";
      slide.appendChild(img);
      track.appendChild(slide);
      slides.push(slide);
      streamIndex.push(i);
    }

    function setSlideImage(slide: HTMLDivElement, n: number) {
      if (slide.dataset.image === String(n)) return;
      slide.dataset.image = String(n);
      (slide.querySelector("img") as HTMLImageElement).src = `/perpetual-slider/slide-img-${n}.jpg`;
    }

    // Warm the cache so the first time a slide wraps onto a new image it does not
    // hitch decoding it mid-frame.
    for (let n = 1; n <= TOTAL; n++) {
      const pre = new Image();
      pre.src = `/perpetual-slider/slide-img-${n}.jpg`;
    }

    let scroll = 0;
    let scrollTarget = 0;

    // Cached because reading clientWidth inside the loop forces a synchronous
    // layout every frame, immediately after the previous frame wrote styles.
    let sliderWidth = root.clientWidth;
    const ro = new ResizeObserver(() => {
      sliderWidth = root!.clientWidth;
    });
    ro.observe(root);

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      scrollTarget += (e.deltaY + e.deltaX) * scrollSpeed * 0.0014;
    }
    let lastPointerX: number | null = null;
    function onPointerDown(e: PointerEvent) {
      lastPointerX = e.clientX;
      root!.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (lastPointerX === null) return;
      scrollTarget += (lastPointerX - e.clientX) * scrollSpeed * -0.005;
      lastPointerX = e.clientX;
    }
    function releasePointer() {
      lastPointerX = null;
    }

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", releasePointer);
    root.addEventListener("pointercancel", releasePointer);

    const rate = Math.max(0.2, speed / 100);
    const lastZ: number[] = new Array(slideCount).fill(NaN);
    let raf = 0;
    let lastTime = performance.now();

    function render(now: number) {
      // Advance by elapsed time rather than per frame, so the speed is the same on
      // 60Hz and 120Hz and a single long frame does not show up as a jump.
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      const frames = dt * 60;

      if (autoPlay) scrollTarget += 0.006 * rate * frames;
      scroll += (scrollTarget - scroll) * (1 - Math.pow(1 - config.lerp, frames));

      for (let i = 0; i < slideCount; i++) {
        const slide = slides[i];
        let idx = streamIndex[i];
        while (edgeX(idx + scroll, sliderWidth) > sliderWidth) idx -= slideCount;
        while (edgeX(idx + scroll + 1, sliderWidth) < 0) idx += slideCount;
        streamIndex[i] = idx;

        // Sub-pixel: rounding to whole pixels makes the narrow slides on the left
        // (which advance a fraction of a pixel per frame) stall and then snap.
        const left = edgeX(idx + scroll, sliderWidth);
        const right = edgeX(idx + scroll + 1, sliderWidth);
        const width = right - left;
        const height = width / config.aspect;

        setSlideImage(slide, wrap(idx, TOTAL) + 1);
        // Half-pixel bleed keeps neighbours from showing an antialiased hairline.
        slide.style.width = `${width + 0.5}px`;
        slide.style.height = `${height}px`;
        slide.style.transform = `translate3d(${left}px, 0px, 0px)`;

        // Restacking is only needed when the order actually changes.
        const z = Math.round(right);
        if (lastZ[i] !== z) {
          slide.style.zIndex = String(z);
          lastZ[i] = z;
        }
      }
      raf = requestAnimationFrame(render);
    }
    // Paint the initial layout synchronously (dt is 0, so nothing moves) rather
    // than leaving the slides unpositioned until the first animation frame.
    render(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", releasePointer);
      root.removeEventListener("pointercancel", releasePointer);
    };
  }, [speed, autoPlay]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-[#edede7] cursor-grab active:cursor-grabbing" style={{ fontFamily, touchAction: "none" }}>
      <div ref={trackRef} className="absolute inset-0" />
      <div className="absolute top-6 left-6 pointer-events-none">
        <h1 className="font-medium tracking-tight text-black" style={{ fontSize: `clamp(calc(1.5rem * ${scale}),calc(4vw * ${scale}),calc(3rem * ${scale}))`, lineHeight: 1 }}>
          {title}
        </h1>
      </div>
    </div>
  );
}
