"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const PALETTE: [number, number, number][] = [
  [124, 245, 255],
  [140, 224, 255],
  [157, 124, 255],
  [199, 124, 255],
  [255, 124, 232],
  [255, 111, 181],
];
const PALETTE_WEIGHTS = [0.45, 0.2, 0.15, 0.125, 0.1, 0.078];

type Star = { dirX: number; dirY: number; offset: number; length: number; width: number; color: [number, number, number] };

export default function StarfieldScroll({
  headers = ["The whole galaxy opens up", "Leaving the known world behind", "And then everything goes still"],
  fontFamily = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  headers?: [string, string, string] | string[];
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const headerEls = headerRefs.current.filter(Boolean) as HTMLHeadingElement[];
    if (!root || !canvas || headerEls.length !== 3) return;

    const ctx = canvas.getContext("2d")!;
    const settings = {
      starCount: 1000,
      holeRadius: 50,
      reachScale: 1.25,
      minStreakLength: 25,
      maxStreakLength: 350,
      minStreakWidth: 2.5,
      maxStreakWidth: 3.5,
      layers: 4,
      glowRadius: 300,
      glowSoftness: 3,
      acceleration: 1.5,
      tailFade: 0.25,
      restingFill: 0.25,
    };

    let width = 0, height = 0, centerX = 0, centerY = 0, maxDistance = 0, pixelRatio = 1;
    let stars: Star[] = [];
    let scrollProgress = 0;

    function random(min: number, max: number) {
      return min + Math.random() * (max - min);
    }
    function pickWeightedColor(): [number, number, number] {
      let roll = Math.random();
      for (let i = 0; i < PALETTE.length; i++) {
        roll -= PALETTE_WEIGHTS[i];
        if (roll <= 0) return PALETTE[i];
      }
      return PALETTE[0];
    }
    function createStars() {
      stars = [];
      for (let i = 0; i < settings.starCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        stars.push({
          dirX: Math.cos(angle),
          dirY: Math.sin(angle),
          offset: Math.random(),
          length: random(settings.minStreakLength, settings.maxStreakLength),
          width: random(settings.minStreakWidth, settings.maxStreakWidth),
          color: pickWeightedColor(),
        });
      }
    }
    function resizeCanvas() {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * pixelRatio;
      canvas!.height = height * pixelRatio;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      centerX = width / 2;
      centerY = height / 2;
      maxDistance = Math.hypot(width / 2, height / 2) * settings.reachScale;
    }
    function drawStarfield() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      const filled = settings.restingFill + scrollProgress * (1 - settings.restingFill);
      const speedFactor = Math.pow(filled, 1 / settings.acceleration);

      for (const star of stars) {
        const travel = Math.max(0, speedFactor * settings.layers - star.offset) % 1;
        const headDistance = settings.holeRadius + travel * (maxDistance - settings.holeRadius);
        const streakLength = star.length * (0.2 + travel * 0.8);
        const tailDistance = Math.max(settings.holeRadius, headDistance - streakLength);
        const tailX = centerX + star.dirX * tailDistance;
        const tailY = centerY + star.dirY * tailDistance;
        const headX = centerX + star.dirX * headDistance;
        const headY = centerY + star.dirY * headDistance;

        let opacity = 1;
        if (headDistance < settings.glowRadius) {
          const t = (headDistance - settings.holeRadius) / (settings.glowRadius - settings.holeRadius);
          opacity = Math.pow(Math.max(0, t), settings.glowSoftness);
        }
        if (opacity <= 0.01) continue;

        const [r, g, b] = star.color;
        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
        gradient.addColorStop(settings.tailFade, `rgba(${r},${g},${b},${opacity})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},${opacity})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.width * (0.5 + travel * 0.9);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
      }
    }

    createStars();
    resizeCanvas();
    drawStarfield();

    const ro = new ResizeObserver(() => {
      resizeCanvas();
      drawStarfield();
    });
    ro.observe(root);

    const headerWords = headerEls.map((h) => SplitText.create(h, { type: "words", wordsClass: "word" }).words as HTMLElement[]);
    headerWords.forEach((words, index) => gsap.set(words, { opacity: index === 0 ? 1 : 0 }));
    gsap.set([headerEls[1], headerEls[2]], { scale: 0.85 });

    function applyProgress(p: number) {
      scrollProgress = p;
      drawStarfield();
      const scaled = p * 3;
      headerWords.forEach((words, i) => {
        const local = gsap.utils.clamp(0, 1, scaled - i);
        const opacity = i === 0 ? 1 - local : i === 3 - 1 ? local : Math.min(local, 1 - (scaled - i - 1));
        gsap.set(words, { opacity: gsap.utils.clamp(0, 1, opacity) });
        gsap.set(headerEls[i], { scale: 0.85 + 0.15 * gsap.utils.clamp(0, 1, 1 - Math.abs(scaled - i - 0.5)) });
      });
    }
    applyProgress(0);

    const rate = Math.max(0.2, speed / 100);
    let progress = 0;
    let target = 0;

    let userDriven = false;
    function onWheel(e: WheelEvent) {
      const next = gsap.utils.clamp(0, 1, target + e.deltaY * 0.0006 * rate);
      // At either end, let the wheel fall through so the page keeps scrolling.
      if (next === target) return;
      e.preventDefault();
      userDriven = true;
      target = next;
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    let autoDir = 1;
    function loop() {
      if (autoPlay && !userDriven) {
        target += autoDir * 0.0055 * rate;
        if (target >= 1) {
          target = 1;
          autoDir = -1;
        } else if (target <= 0) {
          target = 0;
          autoDir = 1;
        }
      }
      progress += (target - progress) * 0.08;
      applyProgress(progress);
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("wheel", onWheel);
      headerWords.forEach((_, i) => void i);
    };
  }, [speed, autoPlay]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-[#0f0f0f] flex items-center justify-center p-4" style={{ fontFamily }}>
      <canvas ref={canvasRef} className="absolute inset-4 rounded-2xl border border-white/10" />
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <h1
            key={i}
            ref={(el) => {
              headerRefs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] text-center uppercase font-medium text-white leading-none"
            style={{ fontSize: `clamp(calc(1.1rem * ${scale}),calc(3.5vw * ${scale}),calc(2.5rem * ${scale}))` }}
          >
            {headers[i]}
          </h1>
        ))}
      </div>
    </div>
  );
}
