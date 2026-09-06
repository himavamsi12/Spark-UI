"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A deck of component covers receding along one diagonal axis and drifting
 * up-to-the-right, like cards pulled from a drawer.
 *
 * The cards sit on a straight line at a constant (dx, dy) step, so translating
 * the track by exactly one set's span lands every card where its predecessor
 * was, which is what makes the wrap invisible. A per-card scale or depth ramp
 * would break that, so depth is read purely from the overlap and the shared angle.
 */

const COVERS = [
  "/spotlight-zoom-scroll/img1.jpg",
  "/name-reveal-scroll/project_img_1.jpg",
  "/circular-gallery/img1.jpg",
  "/clip-mask-transition/img1.jpg",
  "/perpetual-slider/slide-img-1.jpg",
  "/outfit-reveal/img1.jpg",
  "/magnetic-marquee/marquee-img-1.jpg",
  "/grid-wipe-transition/img1.jpg",
  "/counter-reveal/img1.jpg",
  "/slit-reveal-scroll/hero-outro-img-1.jpg",
  "/dual-slider/slide_img_left_1.jpg",
  "/list-hover-cards/item_10_card_1.jpg",
];

const CARD_W = 300;
const CARD_H = 198;
const STEP_X = 103; // horizontal gap between neighbours, small so they overlap
const STEP_Y = 2; // each card sits slightly higher, barely any tilt
const SETS = 3;
/**
 * Empty strip above the deck so a lifted card isn't clipped by the container's
 * overflow. The box grows upward and the cards are pushed down by the same
 * amount, so the deck and everything around it stay exactly where they were.
 */
const HEADROOM = 90;

const SET_SPAN_X = COVERS.length * STEP_X;
const SET_SPAN_Y = COVERS.length * STEP_Y;

const BASE_TILT = "rotateX(9deg) rotateY(-32deg) rotateZ(-1deg)";

export default function ComponentFlowHero({ className }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fallRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    const fallEls = fallRefs.current.filter((el): el is HTMLDivElement => !!el);
    if (!track || !fallEls.length) return;

    // Cards sit at rest from the start; only the drift ever moves them.
    gsap.set(fallEls, { y: 0, x: 0, rotate: 0, opacity: 1 });

    const proxy = { p: 0 };
    const driftTween = gsap.to(proxy, {
      p: 1,
      duration: 15, // ~70px/s along the diagonal, visible drift but still calm
      ease: "none",
      repeat: -1,
      paused: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onUpdate: () => {
        // Travel exactly one set along the diagonal, then start over.
        gsap.set(track, {
          x: -proxy.p * SET_SPAN_X,
          y: proxy.p * SET_SPAN_Y,
        });
      },
    });

    // Hovering a card holds the deck still. Done with plain listeners rather
    // than React state so the moving deck sliding under the cursor never
    // triggers a re-render mid-lift.
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".cfh-card")) driftTween.pause();
    };
    const onOut = (e: MouseEvent) => {
      const to = e.relatedTarget as HTMLElement | null;
      // Sliding straight onto a neighbouring card should stay paused.
      if (to?.closest?.(".cfh-card")) return;
      driftTween.resume();
    };
    track.addEventListener("mouseover", onOver);
    track.addEventListener("mouseout", onOut);

    return () => {
      track.removeEventListener("mouseover", onOver);
      track.removeEventListener("mouseout", onOut);
      gsap.killTweensOf(fallEls);
      driftTween.kill();
    };
  }, []);

  const cards = Array.from({ length: COVERS.length * SETS });

  return (
    <div
      className={`relative overflow-hidden pointer-events-none ${className ?? ""}`}
      style={{
        height: 360 + HEADROOM,
        marginTop: -HEADROOM,
        perspective: "1500px",
        maskImage:
          "linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)",
      }}
    >
      <style>{`
        /* .cfh-card is a static hit area: it never moves, so lifting the art
           can't slide it out from under the cursor and start a hover flicker.
           Only .cfh-lift animates. */
        .cfh-card {
          transform: ${BASE_TILT};
          transform-style: preserve-3d;
          transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* Just enough z to sort in front of its coplanar siblings. A large
           translateZ also pushes the card outward from the perspective origin,
           which reads as a sideways slide rather than a clean lift. */
        .cfh-card:hover { transform: translateZ(12px) ${BASE_TILT}; }

        .cfh-lift {
          will-change: transform;
          transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cfh-card:hover .cfh-lift { transform: translateY(-46px) scale(1.04); }

        @media (prefers-reduced-motion: reduce) {
          .cfh-card, .cfh-lift, .cfh-card img { transition: none; }
        }
      `}</style>

      <div
        ref={trackRef}
        className="cfh-track absolute will-change-transform"
        style={{ left: 0, top: 0, transformStyle: "preserve-3d" }}
      >
        {cards.map((_, i) => (
          <div
            key={i}
            className="cfh-card absolute pointer-events-auto cursor-pointer"
            style={{
              width: CARD_W,
              height: CARD_H,
              // Laid along the diagonal, front card at the bottom-left.
              left: i * STEP_X,
              top: HEADROOM + 100 - i * STEP_Y,
            }}
          >
            {/* Owns only the entrance fall: a separate node from .cfh-card's
                fixed 3D tilt and .cfh-lift's hover transform, so none of the
                three transforms fight each other. */}
            <div
              ref={(el) => {
                fallRefs.current[i] = el;
              }}
              className="w-full h-full"
            >
              <div className="cfh-lift w-full h-full rounded-cards overflow-hidden border border-pearl/12 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.95)]">
                <img
                  src={COVERS[i % COVERS.length]}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
