"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

const DEFAULT_IMAGES = ["/grid-shutter/img1.jpg", "/grid-shutter/img2.jpg", "/grid-shutter/img3.jpg"];
const DEFAULT_PAGES = ["Genesis", "Cascade", "Orbit"];

export default function GridShutterTransition({
  brand = "Duskfield",
  pages = DEFAULT_PAGES,
  images = DEFAULT_IMAGES,
  shutterColor = "#f2f0e6",
  rows = 4,
  columns = 16,
  fontFamily = "var(--font-instrument-serif), serif",
  navFont = "var(--font-instrument-sans), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = true,
}: {
  brand?: string;
  pages?: string[];
  images?: string[];
  shutterColor?: string;
  rows?: number;
  columns?: number;
  fontFamily?: string;
  navFont?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  const gridRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const animating = useRef(false);
  const activeRef = useRef(0);

  const rowCount = Math.max(1, Math.round(rows));
  const colCount = Math.max(1, Math.round(columns));

  // Blocks are sized in pixels off the live container, so the grid is rebuilt
  // whenever it resizes, exactly as the reference does on window resize.
  const buildGrid = useCallback(() => {
    const container = gridRef.current;
    if (!container) return;
    container.innerHTML = "";
    blocksRef.current = [];

    const blockWidth = container.clientWidth / colCount;
    const blockHeight = container.clientHeight / rowCount;

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const block = document.createElement("div");
        // +1px so neighbouring blocks overlap and never show a seam.
        block.style.cssText = `position:absolute;will-change:transform;background-color:${shutterColor};width:${blockWidth + 1}px;height:${blockHeight + 1}px;left:${col * blockWidth}px;top:${row * blockHeight}px;transform-origin:${row % 2 === 0 ? "left" : "right"} center;`;
        container.appendChild(block);
        blocksRef.current.push(block);
      }
    }
    gsap.set(blocksRef.current, { scaleX: 0 });
  }, [rowCount, colCount, shutterColor]);

  useEffect(() => {
    buildGrid();
    const container = gridRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => buildGrid());
    ro.observe(container);
    return () => ro.disconnect();
  }, [buildGrid]);

  const rowBlocks = (row: number) =>
    blocksRef.current.slice(row * colCount, row * colCount + colCount);

  const goTo = useCallback(
    (index: number) => {
      if (index === activeRef.current || animating.current) return;
      animating.current = true;
      activeRef.current = index;
      setActive(index);

      const rate = Math.max(0.2, speed / 100);
      tlRef.current?.kill();
      const tl = gsap.timeline({
        onComplete: () => {
          animating.current = false;
        },
      });
      tlRef.current = tl;

      // Close: every row runs at the same time, but alternate rows stagger
      // from the opposite end, which is what gives the shutter its weave.
      for (let row = 0; row < rowCount; row++) {
        tl.to(
          rowBlocks(row),
          {
            scaleX: 1,
            duration: 0.6 / rate,
            ease: "power3.inOut",
            stagger: { each: 0.025 / rate, from: row % 2 === 0 ? "start" : "end" },
          },
          "<",
        );
      }

      // Screen is covered, so the page can change unseen.
      tl.add(() => setDisplayed(index));

      for (let row = 0; row < rowCount; row++) {
        tl.to(
          rowBlocks(row),
          {
            scaleX: 0,
            duration: 0.6 / rate,
            ease: "power3.inOut",
            stagger: { each: 0.025 / rate, from: row % 2 === 0 ? "start" : "end" },
          },
          row === 0 ? ">" : "<",
        );
      }
    },
    [rowCount, speed],
  );

  useEffect(() => {
    if (!autoPlay) return;
    const rate = Math.max(0.2, speed / 100);
    const id = setInterval(() => {
      goTo((activeRef.current + 1) % pages.length);
    }, 3600 / rate);
    return () => clearInterval(id);
  }, [autoPlay, speed, pages.length, goTo]);

  useEffect(() => () => void tlRef.current?.kill(), []);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#0f0f0f]"
      style={{ isolation: "isolate", fontFamily, containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundImage: `url(${images[displayed % images.length]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1
          className="font-medium leading-none text-[#f2f0e6] tracking-[-0.03em]"
          style={{ fontSize: `clamp(calc(2rem * ${scale}),calc(15cqw * ${scale}),calc(20rem * ${scale}))` }}
        >
          {pages[displayed % pages.length]}
        </h1>
      </div>

      <nav
        className="absolute top-0 left-0 w-full flex items-start justify-between p-4 z-10 text-[#f2f0e6]"
        style={{ fontFamily: navFont }}
      >
        <span className="font-medium tracking-[-0.02em]" style={{ fontSize: `calc(0.8rem * ${scale})` }}>
          {brand}
        </span>
        <div className="flex gap-4">
          {pages.map((label, i) => (
            <button
              key={`${label}-${i}`}
              onClick={() => goTo(i)}
              className={`font-medium tracking-[-0.02em] transition-opacity ${
                active === i ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
              style={{ fontSize: `calc(0.8rem * ${scale})` }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div ref={gridRef} className="absolute inset-0 pointer-events-none z-[100] overflow-hidden" />
    </div>
  );
}
