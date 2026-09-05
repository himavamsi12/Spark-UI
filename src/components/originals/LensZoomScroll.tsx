"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

export default function LensZoomScroll({
  headline = "Insert Something Wildly Impressive Right Here",
  lensImage = "/lens-zoom/img.jpg",
  artwork = "/lens-zoom/doodle.svg",
  background = "#eb5e55",
  glaresPerLens = 2,
  finalZoomScale = 22,
  zoomFocusPoint = "47% 21%",
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  headline?: string;
  lensImage?: string;
  artwork?: string;
  background?: string;
  glaresPerLens?: number;
  finalZoomScale?: number;
  zoomFocusPoint?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const holder = holderRef.current;
    if (!root || !holder) return;

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const markup = await fetch(artwork).then((r) => r.text());
      if (cancelled) return;
      holder.innerHTML = markup;

      const svg = holder.querySelector("svg");
      if (!svg) return;

      const defs = document.createElementNS(SVG_NS, "defs");
      svg.insertBefore(defs, svg.firstChild);

      const glareBands: { band: SVGRectElement; sweepDistance: number }[] = [];
      const lensImages: SVGImageElement[] = [];

      // The artwork marks each lens with a 0.6-opacity path sitting directly
      // after the lens shape. That path is replaced by a clipped group holding
      // the photo and its sweeping glare bands.
      const glarePaths = [...svg.querySelectorAll("path")].filter(
        (p) => parseFloat(getComputedStyle(p).opacity) === 0.6,
      );

      glarePaths.forEach((glarePath, lensIndex) => {
        const lensShape = glarePath.previousElementSibling as SVGGraphicsElement | null;
        if (!lensShape) return;

        const bounds = lensShape.getBBox();
        const clipId = `lens-clip-${lensIndex}-${Math.random().toString(36).slice(2, 7)}`;
        const clipPath = document.createElementNS(SVG_NS, "clipPath");
        clipPath.setAttribute("id", clipId);
        clipPath.appendChild(lensShape.cloneNode(true));
        defs.appendChild(clipPath);

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("clip-path", `url(#${clipId})`);

        const image = document.createElementNS(SVG_NS, "image");
        image.setAttribute("href", lensImage);
        image.setAttributeNS(XLINK_NS, "xlink:href", lensImage);
        image.setAttribute("x", String(bounds.x));
        image.setAttribute("y", String(bounds.y));
        image.setAttribute("width", String(bounds.width));
        image.setAttribute("height", String(bounds.height));
        image.setAttribute("preserveAspectRatio", "xMidYMid slice");
        image.setAttribute("opacity", "0");
        group.appendChild(image);
        lensImages.push(image);

        const count = Math.max(1, Math.round(glaresPerLens));
        const bandWidth = bounds.width * 0.22;
        const sweepDistance = bounds.width + bandWidth * 2;
        const spacing = sweepDistance / count;

        for (let i = 0; i < count; i++) {
          const band = document.createElementNS(SVG_NS, "rect");
          band.setAttribute("x", String(bounds.x + bounds.width * 0.3 - i * spacing));
          band.setAttribute("y", String(bounds.y - bounds.height * 0.25));
          band.setAttribute("width", String(bandWidth));
          band.setAttribute("height", String(bounds.height * 1.5));
          band.setAttribute("fill", "#ffffff");
          band.setAttribute("opacity", "0.6");
          group.appendChild(band);
          glareBands.push({ band, sweepDistance });
        }

        glarePath.parentNode?.insertBefore(group, glarePath);
        glarePath.remove();
      });

      gsap.set(svg, { transformOrigin: zoomFocusPoint, transformBox: "fill-box" });

      const words = wordsRef.current.filter(Boolean) as HTMLSpanElement[];
      gsap.set(words, { opacity: 0 });

      function apply(progress: number) {
        // Glare finishes its sweep at 75%, before the zoom takes over.
        const glareProgress = Math.min(progress / 0.75, 1);
        for (const { band, sweepDistance } of glareBands) {
          gsap.set(band, { x: glareProgress * sweepDistance });
        }

        gsap.set(svg, { scale: 1 + progress * 2 * (finalZoomScale - 1) });

        // The photo inside each lens only starts to appear halfway in.
        const fade = progress >= 0.5 ? (progress - 0.5) / 0.5 : 0;
        for (const image of lensImages) gsap.set(image, { opacity: fade });

        if (words.length) {
          if (progress >= 0.65 && progress <= 0.85) {
            const textProgress = (progress - 0.65) / 0.2;
            words.forEach((word, index) => {
              gsap.set(word, { opacity: textProgress >= index / words.length ? 1 : 0 });
            });
          } else {
            gsap.set(words, { opacity: progress > 0.85 ? 1 : 0 });
          }
        }
      }

      apply(0);

      // The reference pins for three viewport heights and scrubs; the wheel
      // stands in for that here at the same scroll distance.
      const rate = Math.max(0.2, speed / 100);
      let progress = 0;
      let target = 0;
      let userDriven = false;

      function onWheel(e: WheelEvent) {
        const travel = root!.clientHeight * 3;
        const next = gsap.utils.clamp(0, 1, target + (e.deltaY / travel) * rate);
        if (next === target) return;
        e.preventDefault();
        userDriven = true;
        target = next;
      }
      root!.addEventListener("wheel", onWheel, { passive: false });

      let raf = 0;
      let dir = 1;
      let last = performance.now();
      function loop(now: number) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (autoPlay && !userDriven) {
          target += dir * dt * 0.12 * rate;
          if (target >= 1) {
            target = 1;
            dir = -1;
          } else if (target <= 0) {
            target = 0;
            dir = 1;
          }
        }
        progress += (target - progress) * Math.min(1, dt / 0.3);
        apply(progress);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        root!.removeEventListener("wheel", onWheel);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [artwork, lensImage, glaresPerLens, finalZoomScale, zoomFocusPoint, speed, autoPlay, headline]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden text-white"
      style={{ isolation: "isolate", background, fontFamily, containerType: "inline-size" }}
    >
      {/* The artwork sits on the floor of the frame and grows from there. */}
      {/* The reference sizes the drawing at 700px wide inside a full-height
          viewport, which crops it at roughly 78% of the height. Sizing by
          height instead reproduces that same crop at any container size. */}
      <div
        ref={holderRef}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[78%] [&>svg]:h-full [&>svg]:w-auto"
      />

      <h1
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5 text-center uppercase font-black leading-[0.9] z-[2] flex flex-wrap justify-center gap-x-[0.25em]"
        style={{ fontSize: `clamp(calc(1.25rem * ${scale}),calc(5cqw * ${scale}),calc(7rem * ${scale}))` }}
      >
        {headline.split(" ").map((word, i) => (
          <span
            key={`${word}-${i}`}
            ref={(el) => {
              wordsRef.current[i] = el;
            }}
            className="inline-block"
          >
            {word}
          </span>
        ))}
      </h1>
    </div>
  );
}
