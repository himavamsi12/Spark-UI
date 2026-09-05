"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_IMAGES = Array.from({ length: 12 }, (_, i) => `/scroll-tunnel/img${i + 1}.jpg`);

export default function ScrollTunnel({
  images = DEFAULT_IMAGES,
  background = "#000000",
  layerGap = 2500,
  scrollSpeed = 200,
  smoothing = 7,
  itemWidth = 180,
  itemHeight = 220,
  radiusX = 400,
  radiusY = 280,
  autoPlay = true,
}: {
  images?: string[];
  background?: string;
  layerGap?: number;
  scrollSpeed?: number;
  smoothing?: number;
  itemWidth?: number;
  itemHeight?: number;
  radiusX?: number;
  radiusY?: number;
  autoPlay?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tunnelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const tunnel = tunnelRef.current;
    if (!root || !tunnel) return;

    const gap = Math.max(400, layerGap);
    const lerp = Math.min(0.6, Math.max(0.01, smoothing / 100));
    const speed = Math.max(0.2, scrollSpeed / 100);

    const contentLayers = Math.ceil(images.length / 4);
    const totalLayers = Math.max(contentLayers, 6);
    const tunnelDepth = totalLayers * gap;
    const visibleDepth = 3 * gap;
    const exitPoint = 1500;

    tunnel.innerHTML = "";
    const layers: { el: HTMLDivElement; baseZ: number }[] = [];

    for (let i = 0; i < totalLayers; i++) {
      const layer = document.createElement("div");
      layer.style.position = "absolute";
      const startIndex = (i % contentLayers) * 4;

      for (let j = 0; j < 4; j++) {
        const n = startIndex + j;
        if (n >= images.length) break;

        // Four items to a layer, spaced evenly around an ellipse.
        const angle = (j / 4) * Math.PI * 2 - Math.PI / 2;
        const item = document.createElement("div");
        item.style.cssText = `position:absolute;width:${itemWidth}px;height:${itemHeight}px;left:${Math.cos(angle) * radiusX - 90}px;top:${Math.sin(angle) * radiusY - 110}px;`;

        const img = document.createElement("img");
        img.src = images[n];
        img.alt = "";
        img.draggable = false;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        item.appendChild(img);

        // Darkens toward black as a layer approaches and passes the camera.
        const overlay = document.createElement("div");
        overlay.style.cssText = `position:absolute;inset:0;background:${background};opacity:var(--overlay, 1);pointer-events:none;`;
        item.appendChild(overlay);

        layer.appendChild(item);
      }

      tunnel.appendChild(layer);
      layers.push({ el: layer, baseZ: -i * gap });
    }

    let target = 750;
    let current = 750;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      target += e.deltaY * 2 * speed;
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    function overlayFor(z: number) {
      if (z > exitPoint) return 1;
      if (z > 0) return z / exitPoint;
      if (z > -visibleDepth) {
        const progress = Math.abs(z) / visibleDepth;
        return progress * progress;
      }
      return 1;
    }

    const tick = () => {
      if (autoPlay) target += 12 * speed;
      current += (target - current) * lerp;

      for (const layer of layers) {
        // Wrapped into the tunnel's depth so layers recycle endlessly.
        let z = layer.baseZ + current;
        z = ((z % tunnelDepth) + tunnelDepth) % tunnelDepth;
        z = z - tunnelDepth + exitPoint;

        const overlay = overlayFor(z);
        gsap.set(layer.el, {
          z,
          "--overlay": Math.min(1, Math.max(0, overlay)),
          visibility: overlay >= 1 ? "hidden" : "visible",
        });
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      root.removeEventListener("wheel", onWheel);
    };
  }, [
    images,
    background,
    layerGap,
    scrollSpeed,
    smoothing,
    itemWidth,
    itemHeight,
    radiusX,
    radiusY,
    autoPlay,
  ]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background, perspective: "1000px" }}
    >
      <div
        ref={tunnelRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transformStyle: "preserve-3d" }}
      />
    </div>
  );
}
