"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_SPOTS = ["/inline-hover/img1.jpg", "/inline-hover/img2.jpg", "/inline-hover/img3.jpg"];

function Line({
  text,
  images,
  spotIndex,
  before,
  after,
  textColor,
  onSpotRef,
  onCardRef,
  onImgRef,
}: {
  text?: string;
  images: string[];
  spotIndex?: number;
  before?: string;
  after?: string;
  textColor: string;
  onSpotRef: (i: number, el: HTMLSpanElement | null) => void;
  onCardRef: (i: number, el: HTMLSpanElement | null) => void;
  onImgRef: (i: number, el: HTMLImageElement | null) => void;
}) {
  if (text !== undefined) {
    return <span className="flex items-center justify-center whitespace-nowrap">{text}</span>;
  }
  return (
    <span className="flex items-center justify-center whitespace-nowrap">
      {before}
      <span
        ref={(el) => onSpotRef(spotIndex!, el)}
        className="relative shrink-0 w-[0.4em] h-[0.4em] mx-[0.2em] translate-y-[0.05em] cursor-pointer"
        style={{ perspective: 800 }}
      >
        <span
          ref={(el) => onCardRef(spotIndex!, el)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.4em] h-[0.4em] rounded-[0.04em] border-2 overflow-hidden will-change-transform"
          style={{ borderColor: textColor, backgroundColor: textColor }}
        >
          <img
            ref={(el) => onImgRef(spotIndex!, el)}
            src={images[spotIndex!]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 will-change-transform"
            style={{ transform: "scale(1.5)" }}
            draggable={false}
          />
        </span>
      </span>
      {after}
    </span>
  );
}

export default function InlineHoverImage({
  images = DEFAULT_SPOTS,
  textColor = "#0f0f0f",
  tiltMax = 20,
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  images?: string[];
  textColor?: string;
  tiltMax?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const spotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cardRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const interactedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const rate = Math.max(0.2, speed / 100);
    const cleanups: (() => void)[] = [];
    const expandFns: (() => void)[] = [];
    const shrinkFns: (() => void)[] = [];

    images.forEach((_, i) => {
      const spot = spotRefs.current[i];
      const card = cardRefs.current[i];
      const image = imgRefs.current[i];
      if (!spot || !card || !image) return;

      const live = { x: 0, y: 0, tiltX: 0, tiltY: 0 };
      const aim = { x: 0, y: 0, tiltX: 0, tiltY: 0 };
      let isHovering = false;
      let frame: (() => void) | null = null;

      const startTracking = () => {
        frame = () => {
          live.x += (aim.x - live.x) * 0.075;
          live.y += (aim.y - live.y) * 0.075;
          live.tiltX += (aim.tiltX - live.tiltX) * 0.075;
          live.tiltY += (aim.tiltY - live.tiltY) * 0.075;
          gsap.set(card, { x: live.x, y: live.y, rotateX: live.tiltX, rotateY: live.tiltY });
          gsap.set(image, { x: -live.x, y: -live.y });
        };
        gsap.ticker.add(frame);
      };
      const stopTracking = () => {
        if (frame) gsap.ticker.remove(frame);
        frame = null;
      };

      const expand = () => {
        isHovering = true;
        Object.assign(live, { x: 0, y: 0, tiltX: 0, tiltY: 0 });
        Object.assign(aim, { x: 0, y: 0, tiltX: 0, tiltY: 0 });
        gsap.set(card, { x: 0, y: 0, rotateX: 0, rotateY: 0, xPercent: -50, yPercent: -50 });
        gsap.set(image, { x: 0, y: 0 });
        startTracking();
        gsap.to(card, { width: "9rem", height: "7rem", borderRadius: "0.4rem", duration: 0.75 / rate, ease: "power3.out", overwrite: "auto" });
        gsap.to(image, { opacity: 1, duration: 0.5 / rate, ease: "power2.out", overwrite: "auto" });
      };

      const aimAtCursor = (e: MouseEvent) => {
        if (!isHovering) return;
        const bounds = spot.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        let offsetX = e.clientX - centerX;
        let offsetY = e.clientY - centerY;
        const dist = Math.hypot(offsetX, offsetY);
        if (dist > 25) {
          const scale = 25 / dist;
          offsetX *= scale;
          offsetY *= scale;
        }
        aim.x = offsetX;
        aim.y = offsetY;
        const cardBounds = card.getBoundingClientRect();
        const ratioX = (e.clientX - centerX) / (cardBounds.width / 2 || 1);
        const ratioY = (e.clientY - centerY) / (cardBounds.height / 2 || 1);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        aim.tiltY = clamp(ratioX) * -tiltMax;
        aim.tiltX = clamp(ratioY) * tiltMax;
      };

      const shrink = () => {
        isHovering = false;
        aim.tiltX = aim.tiltY = 0;
        stopTracking();
        gsap.to(card, {
          width: "0.4em",
          height: "0.4em",
          borderRadius: "0.04em",
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          duration: 0.5 / rate,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(image, { opacity: 0, duration: 0.25 / rate, ease: "power2.in", overwrite: "auto" });
      };

      const onEnter = () => {
        interactedRef.current = true;
        expand();
      };
      spot.addEventListener("mouseenter", onEnter);
      spot.addEventListener("mousemove", aimAtCursor);
      spot.addEventListener("mouseleave", shrink);
      expandFns.push(expand);
      shrinkFns.push(shrink);

      cleanups.push(() => {
        stopTracking();
        spot.removeEventListener("mouseenter", onEnter);
        spot.removeEventListener("mousemove", aimAtCursor);
        spot.removeEventListener("mouseleave", shrink);
      });
    });

    let autoTimer: ReturnType<typeof setTimeout> | null = null;
    if (autoPlay) {
      let idx = 0;
      const cycle = () => {
        if (interactedRef.current) return;
        expandFns[idx]?.();
        autoTimer = setTimeout(() => {
          if (interactedRef.current) return;
          shrinkFns[idx]?.();
          idx = (idx + 1) % images.length;
          autoTimer = setTimeout(cycle, 500);
        }, 1400);
      };
      autoTimer = setTimeout(cycle, 500);
    }

    return () => {
      cleanups.forEach((fn) => fn());
      if (autoTimer) clearTimeout(autoTimer);
    };
  }, [tiltMax, speed, autoPlay]);

  const setSpotRef = (i: number, el: HTMLSpanElement | null) => {
    spotRefs.current[i] = el;
  };
  const setCardRef = (i: number, el: HTMLSpanElement | null) => {
    cardRefs.current[i] = el;
  };
  const setImgRef = (i: number, el: HTMLImageElement | null) => {
    imgRefs.current[i] = el;
  };

  return (
    <div ref={rootRef} className="relative w-full h-full flex items-center justify-center bg-[#def2e7] overflow-hidden px-6" style={{ fontFamily }}>
      <h2
        className="uppercase font-black text-center leading-[0.8] tracking-tight flex flex-col items-center gap-1"
        style={{ color: textColor, fontSize: `clamp(calc(1.5rem * ${scale}), calc(5vw * ${scale}), calc(3.5rem * ${scale}))` }}
      >
        <Line images={images} text="We frame the" textColor={textColor} onSpotRef={setSpotRef} onCardRef={setCardRef} onImgRef={setImgRef} />
        <Line images={images} before="Worlds" spotIndex={0} after="reality" textColor={textColor} onSpotRef={setSpotRef} onCardRef={setCardRef} onImgRef={setImgRef} />
        <Line images={images} text="Was too" textColor={textColor} onSpotRef={setSpotRef} onCardRef={setCardRef} onImgRef={setImgRef} />
        <Line images={images} before="Small" spotIndex={1} after="to" textColor={textColor} onSpotRef={setSpotRef} onCardRef={setCardRef} onImgRef={setImgRef} />
        <Line images={images} text="Ever hold" textColor={textColor} onSpotRef={setSpotRef} onCardRef={setCardRef} onImgRef={setImgRef} />
        <Line images={images} before="On" spotIndex={2} after="to" textColor={textColor} onSpotRef={setSpotRef} onCardRef={setCardRef} onImgRef={setImgRef} />
      </h2>
    </div>
  );
}
