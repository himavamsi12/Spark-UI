"use client";

import { useEffect, useRef, useState } from "react";
import CardPreview from "./CardPreview";
import type { ComponentEntry } from "@/lib/types";
import { ORIGINAL_COMPONENTS } from "./originals";
import { getOriginalDefaults } from "@/lib/originalControls";

export default function MediaPreview({
  entry,
  className,
  still = false,
}: {
  entry: ComponentEntry;
  className?: string;
  still?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Synchronous first check so we never depend on the observer firing to show
    // anything, since IntersectionObserver callbacks can be deferred (backgrounded
    // tabs, prerender), which would otherwise leave the preview permanently blank.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    const vw = window.innerWidth || 0;
    setVisible(rect.bottom > -200 && rect.top < vh + 200 && rect.right > -200 && rect.left < vw + 200);

    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Several originals capture `wheel` with preventDefault to drive their own
  // scroll-linked progress. That is correct on their detail page, but inside a
  // card it swallows the page scroll. A capture-phase listener here runs before
  // any descendant's handler, so the wheel never reaches them in a thumbnail.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const block = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", block, { capture: true });
    return () => el.removeEventListener("wheel", block, { capture: true });
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible && !still) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [visible, still]);

  if (entry.source === "original") {
    const Comp = ORIGINAL_COMPONENTS[entry.slug];
    // Only mount the live component once it is actually near the viewport, and
    // leave it un-animated for `still` thumbnails. Mounting every original at
    // once (each with its own rAF/canvas/WebGL loop) saturates the main thread.
    return (
      <div ref={wrapRef} className={`relative bg-black overflow-hidden ${className ?? ""}`}>
        {Comp && visible && <Comp {...getOriginalDefaults(entry.slug)} autoPlay={!still} />}
      </div>
    );
  }

  if (!entry.video && !entry.poster) {
    return (
      <CardPreview
        effect={entry.effect}
        seed={entry.seed}
        palette={entry.palette}
        label={entry.name}
        className={className}
        still={still}
      />
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      {entry.poster && (
        <img
          src={entry.poster}
          alt={entry.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}
      {entry.video && visible && (
        <video
          ref={videoRef}
          src={entry.video}
          poster={entry.poster ?? undefined}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
