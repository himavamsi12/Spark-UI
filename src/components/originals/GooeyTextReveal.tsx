"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export default function GooeyTextReveal({
  text = "The Weight of Old Light",
  color = "#f5f5f0",
  bgColor = "#0f0f0f",
  speed = 100,
  gooey = true,
  fontFamily = "var(--font-de-fonte-plus)",
  textScale = 100,
}: {
  text?: string;
  color?: string;
  bgColor?: string;
  speed?: number;
  gooey?: boolean;
  fontFamily?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const filterId = useId().replace(/:/g, "");

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    const rate = Math.max(0.2, speed / 100);

    const split = SplitText.create(heading, { type: "lines", linesClass: "line" });
    const blurLayers = split.lines.map((line) => {
      const inner = document.createElement("span");
      inner.style.display = "inline-block";
      inner.style.willChange = "filter";
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
      (line as HTMLElement).style.display = "block";
      if (gooey) (line as HTMLElement).style.filter = `url(#${filterId}) blur(0.4px)`;
      return inner;
    });

    gsap.set(blurLayers, { filter: "blur(0.35em)" });
    const tween = gsap.to(blurLayers, {
      filter: "blur(0em)",
      duration: 1.5 / rate,
      ease: "power3.out",
      stagger: 0.1 / rate,
      delay: 0.2,
    });

    return () => {
      tween.kill();
      split.revert();
    };
  }, [text, speed, gooey, filterId]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden px-8" style={{ fontFamily, backgroundColor: bgColor }}>
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
      <h1
        ref={headingRef}
        className="uppercase font-black text-center leading-[0.95]"
        style={{ color, fontSize: `clamp(calc(1.75rem * ${scale}), calc(5vw * ${scale}), calc(3.5rem * ${scale}))` }}
      >
        {text}
      </h1>
    </div>
  );
}
