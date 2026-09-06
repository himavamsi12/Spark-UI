"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

// Same order as COVERS - clicking a card jumps to its real component page.
const COVER_SLUGS = [
  "spotlight-zoom-scroll",
  "name-reveal-scroll",
  "circular-gallery",
  "clip-mask-page-transition",
  "perpetual-slider",
  "outfit-reveal",
  "magnetic-marquee",
  "grid-wipe-transition",
  "counter-reveal-hero",
  "slit-reveal-scroll",
  "dual-column-slider",
  "list-hover-cards",
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

// How far (in px) a card's influence reaches along the deck before it fades
// to nothing - about 2.5 card-steps, so the wave clearly touches neighbours
// on both sides of the one under the cursor without spreading so wide the
// whole row looks evenly lifted.
const WAVE_RADIUS = STEP_X * 2.6;
// >1 sharpens the curve so it drops off fast right next to the peak (the
// hovered card) instead of staying near-full-height for the first neighbour.
const WAVE_POWER = 2.4;
const LIFT_Y = -46;
const LIFT_SCALE = 0.04;

export default function ComponentFlowHero({ className }: { className?: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fallRefs = useRef<(HTMLDivElement | null)[]>([]);
  const liftRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const fallEls = fallRefs.current.filter((el): el is HTMLDivElement => !!el);
    const liftEls = liftRefs.current.filter((el): el is HTMLDivElement => !!el);
    if (!container || !track || !fallEls.length) return;

    // Cards sit at rest from the start; only the drift ever moves them.
    gsap.set(fallEls, { y: 0, x: 0, rotate: 0, opacity: 1 });

    // Lifting one card also nudges its neighbours, tapering off with distance,
    // so the row reads as one curve responding to the cursor rather than a
    // single card popping up in isolation.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const quickTos = reducedMotion
      ? []
      : liftEls.map((el) => ({
          y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
          scale: gsap.quickTo(el, "scale", { duration: 0.5, ease: "power3.out" }),
        }));

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      liftEls.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(e.clientX - (rect.left + rect.width / 2));
        const angle = (Math.min(dist, WAVE_RADIUS) / WAVE_RADIUS) * (Math.PI / 2);
        const falloff = Math.pow(Math.cos(angle), WAVE_POWER);
        quickTos[i].y(LIFT_Y * falloff);
        quickTos[i].scale(1 + LIFT_SCALE * falloff);
      });
    };
    const onLeave = () => {
      quickTos.forEach(({ y, scale }) => {
        y(0);
        scale(1);
      });
    };

    if (!reducedMotion) {
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerleave", onLeave);
    }

    // proxy.p is an unbounded "how many set-widths along the diagonal" value.
    // Only its fractional part is ever rendered, so the deck can be dragged
    // as far as you like in either direction without running out of the
    // pre-rendered sets - the drift and the drag both just add to the same
    // number.
    const proxy = { p: 0 };
    const render = () => {
      const wrapped = ((proxy.p % 1) + 1) % 1;
      gsap.set(track, { x: -wrapped * SET_SPAN_X, y: wrapped * SET_SPAN_Y });
    };
    render();

    let hoverPaused = false;
    let dragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartP = 0;

    const ticker = (_time: number, deltaMs: number) => {
      if (hoverPaused || dragging) return;
      proxy.p += deltaMs / 1000 / 15; // ~70px/s along the diagonal, same pace as before
      render();
    };
    if (!reducedMotion) gsap.ticker.add(ticker);

    // Hovering a card holds the deck still. Done with plain listeners rather
    // than React state so the moving deck sliding under the cursor never
    // triggers a re-render mid-lift.
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".cfh-card")) hoverPaused = true;
    };
    const onOut = (e: MouseEvent) => {
      const to = e.relatedTarget as HTMLElement | null;
      // Sliding straight onto a neighbouring card should stay paused.
      if (to?.closest?.(".cfh-card")) return;
      hoverPaused = false;
    };
    track.addEventListener("mouseover", onOver);
    track.addEventListener("mouseout", onOut);

    // Drag-to-scrub: grab the deck and pull it through by hand, like flipping
    // a stack of covers. A plain click (no real movement) falls through to
    // the click handler below instead, so tapping a cover still navigates.
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".cfh-card")) return;
      dragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartP = proxy.p;
      container.classList.add("cfh-dragging");
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 4) dragMoved = true;
      proxy.p = dragStartP - dx / SET_SPAN_X;
      render();
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      container.classList.remove("cfh-dragging");
    };
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // Click-through: a cover that wasn't just dragged navigates to the real
    // component page it's standing in for.
    const onClick = (e: MouseEvent) => {
      if (dragMoved) return;
      const card = (e.target as HTMLElement).closest(".cfh-card") as HTMLElement | null;
      if (!card) return;
      const idx = Number(card.dataset.idx);
      const slug = COVER_SLUGS[idx % COVER_SLUGS.length];
      if (slug) router.push(`/components/${slug}`);
    };
    container.addEventListener("click", onClick);

    return () => {
      track.removeEventListener("mouseover", onOver);
      track.removeEventListener("mouseout", onOut);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("click", onClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      gsap.ticker.remove(ticker);
      gsap.killTweensOf(fallEls);
      gsap.killTweensOf(liftEls);
    };
  }, [router]);

  const cards = Array.from({ length: COVERS.length * SETS });

  return (
    <div
      ref={containerRef}
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
        .cfh-card { cursor: grab; touch-action: pan-y; }
        .cfh-dragging .cfh-card { cursor: grabbing; }

        .cfh-lift {
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .cfh-card, .cfh-card img { transition: none; }
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
            data-idx={i}
            className="cfh-card absolute pointer-events-auto"
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
              <div
                ref={(el) => {
                  liftRefs.current[i] = el;
                }}
                className="cfh-lift w-full h-full rounded-cards overflow-hidden border border-pearl/12 shadow-[0_30px_70px_-24px_rgba(0,0,0,0.95)]"
              >
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
