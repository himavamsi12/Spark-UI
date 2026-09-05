"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_IMAGES = Array.from(
  { length: 20 },
  (_, i) => `/accordion-frames/spotlight-${i + 1}.jpg`,
);

export default function AccordionFrames({
  images = DEFAULT_IMAGES,
  background = "#0f0f0f",
  indicatorColor = "#ffffff",
  collapsedWidth = 20,
  expandedWidth = 400,
  panelGap = 5,
  panelHeight = 400,
  duration = 100,
}: {
  images?: string[];
  background?: string;
  indicatorColor?: string;
  collapsedWidth?: number;
  expandedWidth?: number;
  panelGap?: number;
  panelHeight?: number;
  duration?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [focusedRaw, setFocused] = useState(0);

  const count = images.length;
  // Clamped here rather than reset in an effect, so shrinking the image list
  // cannot leave the focus pointing past the end.
  const focused = Math.min(focusedRaw, count - 1);
  // 1s at 100, so the control reads as a percentage of the reference timing.
  const seconds = 1 / Math.max(0.2, duration / 100);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Panels are laid out by measuring every panel to the left of this one, so
  // the row stays centred no matter which panel is open.
  const panelPosition = useCallback(
    (index: number) => {
      const total = (count - 1) * (collapsedWidth + panelGap) + expandedWidth;
      let left = (trackWidth - total) / 2;
      for (let i = 0; i < index; i++) {
        left += (i === focused ? expandedWidth : collapsedWidth) + panelGap;
      }
      return { left, width: index === focused ? expandedWidth : collapsedWidth };
    },
    [count, collapsedWidth, expandedWidth, panelGap, trackWidth, focused],
  );

  const ease = "cubic-bezier(0.075, 0.82, 0.165, 1)";
  const indicator = panelPosition(focused);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background }}>
      <div
        ref={trackRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1400px]"
      >
        <div className="relative w-full" style={{ height: panelHeight }}>
          {/* Full-height rule through the open frame, drawn with the same
              transition so it travels with the panel rather than snapping. */}
          <div
            className="absolute top-0 h-full pointer-events-none z-[100]"
            style={{
              left: indicator.left,
              width: indicator.width,
              border: `3px solid ${indicatorColor}`,
              transition: `all ${seconds}s ${ease}`,
              willChange: "left, width",
            }}
          >
            <span
              className="absolute left-1/2 -translate-x-1/2 bottom-full w-[3px] h-[100svh]"
              style={{ background: indicatorColor }}
            />
            <span
              className="absolute left-1/2 -translate-x-1/2 top-full w-[3px] h-[100svh]"
              style={{ background: indicatorColor }}
            />
          </div>

          {images.map((src, i) => {
            const { left, width } = panelPosition(i);
            return (
              <div
                key={`${src}-${i}`}
                onMouseEnter={() => setFocused(i)}
                onClick={() => setFocused(i)}
                className="absolute top-0 h-full overflow-hidden cursor-pointer"
                style={{ left, width, transition: `all ${seconds}s ${ease}`, willChange: "left, width" }}
              >
                {/* The picture keeps the open width at all times, so a collapsed
                    panel is a slice of it rather than a squeezed copy. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute left-1/2 -translate-x-1/2 h-full object-cover pointer-events-none select-none"
                  style={{ width: expandedWidth }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
