"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const DEFAULT_IMAGES = [
  "/mosaic-flip/img1.jpg",
  "/mosaic-flip/img2.jpg",
  "/mosaic-flip/img3.jpg",
  "/mosaic-flip/img4.jpg",
  "/mosaic-flip/img5.jpg",
  "/mosaic-flip/img6.jpg",
];

const DEFAULT_LABELS = [
  "NX-09",
  "1997 Hallway Tape",
  "Deep Space",
  "Sleep Phase Anomaly",
  "Still-life.mov",
  "Monoform™",
];

const FACES = ["front", "rear", "right", "left", "top", "bottom"] as const;

export default function MosaicFlipHover({
  images = DEFAULT_IMAGES,
  labels = DEFAULT_LABELS,
  idleImage = "/mosaic-flip/default.jpg",
  background = "#171717",
  tileEdge = "#222222",
  tilesX = 12,
  tilesY = 9,
  tileSize = 60,
  breatheDepth = 40,
  fontFamily = "var(--font-dm-mono), monospace",
  textScale = 100,
  speed = 100,
}: {
  images?: string[];
  labels?: string[];
  idleImage?: string;
  background?: string;
  tileEdge?: string;
  tilesX?: number;
  tilesY?: number;
  tileSize?: number;
  breatheDepth?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Everything the hover handlers need, kept on a ref so rebuilding the grid
  // does not re-bind them.
  const api = useRef<{ reveal: (i: number) => void } | null>(null);

  const cols = Math.max(2, Math.round(tilesX));
  const rows = Math.max(2, Math.round(tilesY));
  const size = Math.max(20, Math.round(tileSize));

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const rate = Math.max(0.2, speed / 100);
    const previewW = cols * size;
    const previewH = rows * size;
    const half = size / 2;

    preview.innerHTML = "";
    const tiles: { el: HTMLDivElement; faces: Record<string, HTMLDivElement>; row: number; col: number }[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = document.createElement("div");
        tile.style.cssText = `width:${size}px;height:${size}px;position:relative;transform-style:preserve-3d;will-change:transform;`;
        const faces: Record<string, HTMLDivElement> = {};

        for (const side of FACES) {
          const face = document.createElement("div");
          const rotate =
            side === "rear" ? "rotateY(180deg)"
            : side === "right" ? "rotateY(90deg)"
            : side === "left" ? "rotateY(-90deg)"
            : side === "top" ? "rotateX(90deg)"
            : side === "bottom" ? "rotateX(-90deg)"
            : "";
          face.style.cssText = `position:absolute;width:${size}px;height:${size}px;background-size:cover;background-position:center;backface-visibility:hidden;transform:${rotate} translateZ(${half}px);`;
          tile.appendChild(face);
          faces[side] = face;
        }

        preview.appendChild(tile);
        tiles.push({ el: tile, faces, row, col });
      }
    }

    // Each face shows its own slice of the picture, so the tiles together read
    // as one image rather than a grid of thumbnails.
    function paint(tile: (typeof tiles)[number], side: string, src: string) {
      const face = tile.faces[side];
      face.style.backgroundImage = `url(${src})`;
      face.style.backgroundSize = `${previewW}px ${previewH}px`;
      face.style.backgroundPosition = `${-(tile.col * size)}px ${-(tile.row * size)}px`;
    }

    for (const tile of tiles) {
      for (const side of ["front", "rear", "right", "left"]) paint(tile, side, idleImage);
      tile.faces.top.style.background = tileEdge;
      tile.faces.bottom.style.background = tileEdge;
    }

    // Idle drift: every tile eases to a new depth forever, staggered on start
    // so the grid never pulses in unison.
    const breathe = (el: HTMLDivElement) => {
      gsap.to(el, {
        z: gsap.utils.random(-breatheDepth, breatheDepth),
        duration: gsap.utils.random(0.6, 1.4) / rate,
        ease: "sine.inOut",
        onComplete: () => breathe(el),
      });
    };
    const delayed = tiles.map((t, i) => gsap.delayedCall(i * 0.015, () => breathe(t.el)));

    let activeProject = 0;
    let revealCount = 0;
    let isRevealing = false;
    let queued: number | null = null;

    function reveal(projectIndex: number) {
      if (isRevealing) {
        queued = projectIndex;
        return;
      }
      if (projectIndex === activeProject) return;

      isRevealing = true;
      queued = null;

      // Paint the face that is currently turned away, so the swap is unseen.
      const hidden = revealCount % 2 === 0 ? "rear" : "front";
      const src = projectIndex === 0 ? idleImage : images[(projectIndex - 1) % images.length];
      for (const tile of tiles) {
        paint(tile, hidden, src);
        paint(tile, "right", idleImage);
        paint(tile, "left", idleImage);
      }

      revealCount++;
      activeProject = projectIndex;

      gsap.to(
        tiles.map((t) => t.el),
        {
          rotateY: revealCount * 180,
          duration: 0.5 / rate,
          ease: "power3.inOut",
          stagger: { each: 0.05 / rate, from: "center", grid: [rows, cols] },
          onComplete: () => {
            isRevealing = false;
            if (queued !== null && queued !== activeProject) reveal(queued);
          },
        },
      );
    }

    api.current = { reveal };

    return () => {
      for (const d of delayed) d.kill();
      gsap.killTweensOf(tiles.map((t) => t.el));
      api.current = null;
    };
  }, [images, idleImage, tileEdge, cols, rows, size, breatheDepth, speed]);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function queueReveal(index: number) {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // A short delay so sweeping across the list does not fire every project.
    hoverTimer.current = setTimeout(() => api.current?.reveal(index), 50);
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ isolation: "isolate", background, perspective: "800px", transformStyle: "preserve-3d", fontFamily }}
    >
      <div
        ref={previewRef}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gridTemplateRows: `repeat(${rows}, ${size}px)`,
          transformStyle: "preserve-3d",
        }}
      />

      <nav
        className="absolute bottom-12 right-12 flex flex-col z-10"
        onMouseLeave={() => {
          setActive(0);
          queueReveal(0);
        }}
      >
        {labels.map((label, i) => (
          <button
            key={`${label}-${i}`}
            onMouseEnter={() => {
              setActive(i + 1);
              queueReveal(i + 1);
            }}
            className={`uppercase text-right py-0.5 transition-opacity duration-300 ${
              active === i + 1 ? "opacity-100" : "opacity-50 hover:opacity-100"
            }`}
            style={{ color: "#fff", fontSize: `calc(1rem * ${scale})` }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
