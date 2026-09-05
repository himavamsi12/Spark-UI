"use client";

import { useEffect, useRef } from "react";

const DEFAULT_IMAGES = Array.from({ length: 15 }, (_, i) => `/ascii-reveal/img${i + 1}.jpg`);

/** Scattered placement from the reference, as [column, row] pairs. */
const PLACEMENT: [number, number][] = [
  [1, 1], [2, 1], [5, 1],
  [1, 2], [3, 2], [6, 2], [8, 2],
  [1, 3], [2, 3], [4, 3], [7, 3], [10, 3],
  [2, 4], [6, 4], [9, 4],
];

// The reference declares eight columns but places tiles as far as column ten,
// so those last tiles collapse to zero width. The track count is taken from
// the placements instead.
const GRID_COLUMNS = Math.max(...PLACEMENT.map(([col]) => col));
const GRID_ROWS = Math.max(...PLACEMENT.map(([, row]) => row));

export default function AsciiImageReveal({
  images = DEFAULT_IMAGES,
  characters = "........:::=+xX#0369",
  background = "#111111",
  inkColor = "#c8c8c8",
  columns = 25,
  fontSize = 14,
  imageStagger = 100,
  cellAppear = 2,
  scrambleCount = 10,
  scrambleSpeed = 100,
  replayKey = 0,
}: {
  images?: string[];
  characters?: string;
  background?: string;
  inkColor?: string;
  columns?: number;
  fontSize?: number;
  imageStagger?: number;
  cellAppear?: number;
  scrambleCount?: number;
  scrambleSpeed?: number;
  replayKey?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const CHARS = characters.length ? characters : "........:::=+xX#0369";
    const COLS = Math.max(6, Math.round(columns));
    const SIZE = Math.max(6, Math.round(fontSize));

    // Everything after the last "." is treated as "dark", and only those cells
    // scramble before settling.
    const denseIndex = CHARS.lastIndexOf(".");
    const denseChars = CHARS.slice(denseIndex + 1).split("");

    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return;
    measure.font = `${SIZE}px monospace`;
    const charW = Math.ceil(measure.measureText("M").width);
    const charH = SIZE;
    // Rows are derived so the character cells land on the 4:5 tile.
    const ROWS = Math.round(COLS * (5 / 4) * (charW / charH));

    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    const cleanups: (() => void)[] = [];

    const tiles = Array.from(root.querySelectorAll<HTMLDivElement>("[data-tile]"));

    tiles.forEach((tile, index) => {
      const img = tile.querySelector("img");
      const canvas = tile.querySelector("canvas");
      if (!img || !canvas) return;

      const run = () => {
        // --- sample the image down to a grid of characters ---------------
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const tileAspect = 4 / 5;
        let cropX = 0, cropY = 0, cropW = img.naturalWidth, cropH = img.naturalHeight;
        if (imageAspect > tileAspect) {
          cropW = img.naturalHeight * tileAspect;
          cropX = (img.naturalWidth - cropW) / 2;
        } else {
          cropH = img.naturalWidth / tileAspect;
          cropY = (img.naturalHeight - cropH) / 2;
        }

        const sampler = document.createElement("canvas");
        sampler.width = COLS;
        sampler.height = ROWS;
        const sctx = sampler.getContext("2d", { willReadFrequently: true });
        if (!sctx) return;
        sctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, COLS, ROWS);

        let data: Uint8ClampedArray;
        try {
          data = sctx.getImageData(0, 0, COLS, ROWS).data;
        } catch {
          return; // cross-origin image, nothing to sample
        }

        const grid: string[][] = [];
        const density: number[][] = [];
        for (let row = 0; row < ROWS; row++) {
          const chars: string[] = [];
          const levels: number[] = [];
          for (let col = 0; col < COLS; col++) {
            const p = (row * COLS + col) * 4;
            const brightness =
              (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
            const i = Math.min(CHARS.length - 1, Math.floor((1 - brightness) * CHARS.length));
            chars.push(CHARS[i]);
            levels.push(i);
          }
          grid.push(chars);
          density.push(levels);
        }

        // --- draw ---------------------------------------------------------
        const dpr = 2;
        canvas.width = COLS * charW * dpr;
        canvas.height = ROWS * charH * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${charH}px monospace`;
        ctx.textBaseline = "top";
        canvas.style.opacity = "1";

        const draw = (col: number, row: number, ch: string) => {
          ctx.fillStyle = background;
          ctx.fillRect(col * charW, row * charH, charW, charH);
          ctx.fillStyle = inkColor;
          ctx.fillText(ch, col * charW, row * charH);
        };

        const total = COLS * ROWS;
        const scrambleState: (number | null)[] = new Array(total).fill(null);
        let settled = 0;

        const order = Array.from({ length: total }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }

        const finish = () => {
          canvas.style.opacity = "0";
        };

        // Cells pop in in random order; dark ones arrive as noise and keep
        // rerolling for a while before landing on their real character.
        order.forEach((cellIndex, i) => {
          timers.push(
            setTimeout(
              () => {
                const row = Math.floor(cellIndex / COLS);
                const col = cellIndex % COLS;
                if (density[row][col] > denseIndex) {
                  draw(col, row, denseChars[Math.floor(Math.random() * denseChars.length)]);
                  scrambleState[cellIndex] = Math.max(1, Math.round(scrambleCount));
                } else {
                  draw(col, row, grid[row][col]);
                  scrambleState[cellIndex] = 0;
                  if (++settled === total) finish();
                }
              },
              index * imageStagger + i * cellAppear,
            ),
          );
        });

        const ticker = setInterval(() => {
          let busy = false;
          for (let cellIndex = 0; cellIndex < total; cellIndex++) {
            const remaining = scrambleState[cellIndex];
            if (remaining === null || remaining === 0) continue;
            busy = true;
            const row = Math.floor(cellIndex / COLS);
            const col = cellIndex % COLS;
            if (remaining === 1) {
              draw(col, row, grid[row][col]);
              scrambleState[cellIndex] = 0;
              if (++settled === total) finish();
            } else {
              draw(col, row, denseChars[Math.floor(Math.random() * denseChars.length)]);
              scrambleState[cellIndex] = remaining - 1;
            }
          }
          if (!busy && settled === total) clearInterval(ticker);
        }, Math.max(16, scrambleSpeed));
        intervals.push(ticker);
      };

      if (img.complete && img.naturalWidth) run();
      else {
        img.addEventListener("load", run);
        cleanups.push(() => img.removeEventListener("load", run));
      }
    });

    return () => {
      for (const t of timers) clearTimeout(t);
      for (const i of intervals) clearInterval(i);
      for (const c of cleanups) c();
    };
  }, [
    images,
    characters,
    background,
    inkColor,
    columns,
    fontSize,
    imageStagger,
    cellAppear,
    scrambleCount,
    scrambleSpeed,
    replayKey,
  ]);

  return (
    <div
      ref={rootRef}
      className="w-full h-full grid gap-6 p-6"
      style={{
        background,
        gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
      }}
    >
      {images.map((src, i) => {
        const spot = PLACEMENT[i % PLACEMENT.length];
        return (
          <div
            key={`${src}-${i}`}
            data-tile
            className="relative w-full self-center overflow-hidden"
            style={{ aspectRatio: "4 / 5", gridColumn: spot[0], gridRow: spot[1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
            <canvas className="absolute inset-0 w-full h-full transition-opacity duration-300" />
          </div>
        );
      })}
    </div>
  );
}
