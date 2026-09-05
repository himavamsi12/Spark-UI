"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

export default function SmudgeRevealer({
  frontText = "Dig in",
  backText = "The things worth finding are never on the surface. They live in the parts you almost scrolled past.",
  frontBackground = "#2a2b2a",
  frontColor = "#edf2ed",
  backBackground = "#cbd4c2",
  backColor = "#323332",
  smoothing = 10,
  sizeFromSpeed = 20,
  blur = 25,
  expandMultiplier = 200,
  expandTime = 2,
  dissolveTime = 3,
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  textScale = 100,
}: {
  frontText?: string;
  backText?: string;
  frontBackground?: string;
  frontColor?: string;
  backBackground?: string;
  backColor?: string;
  smoothing?: number;
  sizeFromSpeed?: number;
  blur?: number;
  expandMultiplier?: number;
  expandTime?: number;
  dissolveTime?: number;
  fontFamily?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  // Ids must be unique per instance or several copies on one page share a mask.
  const uid = useId().replace(/[:]/g, "");
  const maskId = `smudge-mask-${uid}`;
  const gooId = `smudge-goo-${uid}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const blobs = blobsRef.current;
    if (!root || !blobs) return;

    const smooth = Math.min(0.5, Math.max(0.02, smoothing / 100));
    const sizeFactor = Math.max(0.02, sizeFromSpeed / 100);
    const expand = Math.max(1, expandMultiplier / 100);

    const pointer = { x: 0, y: 0 };
    const smoothed = { x: 0, y: 0 };
    let started = false;

    function move(x: number, y: number) {
      if (!started) {
        pointer.x = smoothed.x = x;
        pointer.y = smoothed.y = y;
        started = true;
        return;
      }
      pointer.x = x;
      pointer.y = y;
    }

    const onMouse = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      move(e.clientX - r.left, e.clientY - r.top);
    };
    const onTouch = (e: TouchEvent) => {
      const r = root.getBoundingClientRect();
      move(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    };
    root.addEventListener("mousemove", onMouse);
    root.addEventListener("touchmove", onTouch, { passive: true });

    // Each stamp is a circle that swells, then shrinks away. The goo filter
    // welds overlapping circles into one shape, so a fast drag reads as a
    // smear rather than a string of dots.
    function stamp(x: number, y: number, radius: number) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", String(radius));
      circle.setAttribute("fill", "#fff");
      blobs!.prepend(circle);

      const r = { current: radius };
      const tl = gsap.timeline({
        onUpdate: () => circle.setAttribute("r", String(Math.max(0, r.current))),
        onComplete: () => {
          tl.kill();
          circle.remove();
        },
      });
      tl.to(r, { current: radius * expand, duration: expandTime, ease: "power1.inOut" });
      tl.to(r, { current: 0, duration: dissolveTime, ease: "power3.in" }, expandTime);
    }

    let raf = 0;
    function loop() {
      if (started) {
        smoothed.x += (pointer.x - smoothed.x) * smooth;
        smoothed.y += (pointer.y - smoothed.y) * smooth;
        // The gap the smoothing has yet to close stands in for speed, so the
        // faster the cursor moves the larger the stamp.
        const speed = Math.hypot(pointer.x - smoothed.x, pointer.y - smoothed.y);
        if (speed > 0.01) stamp(smoothed.x, smoothed.y, speed * sizeFactor);
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("mousemove", onMouse);
      root.removeEventListener("touchmove", onTouch);
      gsap.killTweensOf(blobs.children);
      blobs.innerHTML = "";
    };
  }, [smoothing, sizeFromSpeed, expandMultiplier, expandTime, dissolveTime]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{ fontFamily, containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0 flex justify-center items-end p-8 text-center select-none uppercase leading-[0.9]"
        style={{ background: frontBackground, color: frontColor }}
      >
        <h1 style={{ fontSize: `clamp(calc(3rem * ${scale}),calc(22.5cqw * ${scale}),calc(30rem * ${scale}))` }}>
          {frontText}
        </h1>
      </div>

      <div
        className="absolute inset-0 flex justify-center items-center p-8 text-center select-none uppercase leading-[0.9]"
        style={{
          background: backBackground,
          color: backColor,
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
        }}
      >
        <h3 style={{ fontSize: `clamp(calc(1rem * ${scale}),calc(5cqw * ${scale}),calc(6rem * ${scale}))` }}>
          {backText}
        </h3>
      </div>

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Blur, then crush the alpha ramp: the classic goo filter, which is
              what fuses neighbouring stamps into a single smear. */}
          <filter id={gooId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -14" />
          </filter>
        </defs>
        <mask id={maskId}>
          <g ref={blobsRef} filter={`url(#${gooId})`} />
        </mask>
      </svg>
    </div>
  );
}
