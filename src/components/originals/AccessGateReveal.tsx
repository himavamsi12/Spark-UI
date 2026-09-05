"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const FULL = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const SWEPT = "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";

/** The readout printed on the layer behind the gate. */
const DEFAULT_BACKDROP_TOP = [
  ["ARC//117 Delta Trace", "ARC//117 Delta Trace", "ARC//117 Delta Trace", "ARC//117 Delta Trace", "ARC//117 Delta Trace"],
  ["Sector / Hollow Frame", "0.392 02SD 008923"],
  ["Material / Unknown Fiber", "Status / Soft Resonance"],
  [],
  [":::..:::.::::..:::"],
];

const DEFAULT_BACKDROP_BOTTOM = [
  ["Surface Memory"],
  ["// / / ///// / / / ///"],
  ["Phase Offset > 17%"],
  ["Fragments Aligning", "Pattern Emerging"],
  ["Collapse Pending", "Return -- Layer Zero"],
  ["F-9"],
];

/** One line of text inside a mask, able to ride up or down on its own. */
function Masked({
  text,
  register,
  style,
}: {
  text: string;
  register?: (el: HTMLSpanElement | null) => void;
  style?: React.CSSProperties;
}) {
  return (
    <span className="block overflow-hidden" style={style}>
      <span ref={register} className="block will-change-transform" style={{ transform: "translateY(100%)" }}>
        {text}
      </span>
    </span>
  );
}

export default function AccessGateReveal({
  headline = "The system is now visible",
  status = "Initiating",
  meta = ["Phase 01", "Sequence", "Signal Scan", "07 Layers", "PX-17"],
  buttonLabel = "Click to Enter",
  grantedLabel = "Access Granted",
  logo = "/access-gate/logo-light.png",
  backdropLogo = "/access-gate/logo.png",
  background = "#000000",
  foreground = "#ffffff",
  backdropText = "#7a7a7a",
  trackColor = "#2b2b2b",
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  monoFont = "'Geist Mono', var(--font-commit-mono), monospace",
  textScale = 100,
  speed = 100,
  replayKey = 0,
}: {
  headline?: string;
  status?: string;
  meta?: string[];
  buttonLabel?: string;
  grantedLabel?: string;
  logo?: string;
  backdropLogo?: string;
  background?: string;
  foreground?: string;
  backdropText?: string;
  trackColor?: string;
  fontFamily?: string;
  monoFont?: string;
  textScale?: number;
  speed?: number;
  replayKey?: number;
}) {
  const scale = textScale / 100;
  const preloaderRef = useRef<HTMLDivElement>(null);
  const revealerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const trackRef = useRef<SVGCircleElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);

  const metaLines = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRef = useRef<HTMLSpanElement>(null);
  const outroRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const ready = useRef(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!CustomEase.get("hop")) CustomEase.create("hop", "0.9, 0, 0.1, 1");
    if (!CustomEase.get("glide")) CustomEase.create("glide", "0.8, 0, 0.2, 1");
  }, []);

  useEffect(() => {
    const rate = Math.max(0.2, speed / 100);
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!track || !progress) return;

    const length = track.getTotalLength();
    gsap.set([track, progress], { strokeDasharray: length, strokeDashoffset: length });

    const lines = metaLines.current.filter(Boolean) as HTMLSpanElement[];
    const words = wordRefs.current.filter(Boolean) as HTMLSpanElement[];
    gsap.set([...lines, labelRef.current, outroRef.current, ...words], { yPercent: 100 });
    gsap.set(preloaderRef.current, { scale: 1, clipPath: FULL, display: "flex" });
    gsap.set(revealerRef.current, { clipPath: FULL });
    // The page sits scaled down behind the gate and grows into place.
    gsap.set(heroRef.current, { scale: 0.75 });
    gsap.set(logoRef.current, { opacity: 1 });
    gsap.killTweensOf(labelRef.current);
    gsap.set(labelRef.current, { opacity: 1 });
    gsap.set(btnRef.current, { scale: 1 });
    gsap.set(ringRef.current, { rotation: 0, transformOrigin: "50% 50%" });
    ready.current = false;
    setArmed(false);

    const tl = gsap.timeline({ delay: 0.4 / rate });

    tl.to(lines, { yPercent: 0, duration: 0.75 / rate, ease: "power3.out", stagger: 0.1 / rate });
    // Ring draws itself and turns three quarters while the readout arrives.
    tl.to(track, { strokeDashoffset: 0, duration: 2 / rate, ease: "hop" }, "<");
    tl.to(ringRef.current, { rotation: 270, duration: 2 / rate, ease: "hop" }, "<");

    // Progress advances in uneven jumps with randomised pauses, so the load
    // reads as real work rather than a constant sweep.
    const stops = [0.2, 0.25, 0.85, 1].map((base, i) =>
      i === 3 ? 1 : base + (Math.random() - 0.5) * 0.1,
    );
    stops.forEach((stop, i) => {
      tl.to(progress, {
        strokeDashoffset: length - length * stop,
        duration: 0.75 / rate,
        ease: "glide",
        delay: (i === 0 ? 0.3 : 0.3 + Math.random() * 0.2) / rate,
      });
    });

    tl.to(logoRef.current, { opacity: 0, duration: 0.35 / rate, ease: "power1.out" }, `-=${0.25 / rate}`);
    tl.to(btnRef.current, { scale: 0.9, duration: 1.5 / rate, ease: "hop" }, `-=${0.5 / rate}`);
    tl.to(
      labelRef.current,
      {
        yPercent: 0,
        duration: 0.75 / rate,
        ease: "power3.out",
        onComplete: () => {
          ready.current = true;
          setArmed(true);
          gsap.to(labelRef.current, {
            opacity: 0.45,
            duration: 0.9 / rate,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        },
      },
      `-=${0.75 / rate}`,
    );

    return () => {
      tl.kill();
    };
  }, [speed, replayKey, meta, status, headline]);

  function enter() {
    if (!ready.current) return;
    ready.current = false;
    setArmed(false);

    const rate = Math.max(0.2, speed / 100);
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!track || !progress) return;
    const length = track.getTotalLength();

    gsap.killTweensOf(labelRef.current);
    gsap.set(labelRef.current, { opacity: 1 });

    const tl = gsap.timeline();
    tl.to(preloaderRef.current, { scale: 0.75, duration: 1.25 / rate, ease: "hop" });
    // The ring unwinds past zero, so it empties the way it filled.
    tl.to([track, progress], { strokeDashoffset: -length, duration: 1.25 / rate, ease: "hop" }, "<");
    tl.to(labelRef.current, { yPercent: -100, duration: 0.75 / rate, ease: "power3.out" }, `-=${1.25 / rate}`);
    tl.to(outroRef.current, { yPercent: 0, duration: 0.75 / rate, ease: "power3.out" }, `-=${0.75 / rate}`);
    // Gate sweeps aside to the backdrop, then the backdrop sweeps to the page.
    tl.to(preloaderRef.current, { clipPath: SWEPT, duration: 1.5 / rate, ease: "hop" });
    tl.to(
      revealerRef.current,
      {
        clipPath: SWEPT,
        duration: 1.5 / rate,
        ease: "hop",
        onComplete: () => gsap.set(preloaderRef.current, { display: "none" }),
      },
      `-=${1.45 / rate}`,
    );
    tl.to(heroRef.current, { scale: 1, duration: 1.25 / rate, ease: "hop" });
    tl.to(
      wordRefs.current.filter(Boolean) as HTMLSpanElement[],
      { yPercent: 0, duration: 1 / rate, ease: "glide", stagger: 0.05 / rate },
      `-=${1.75 / rate}`,
    );
  }

  const readout = { fontFamily: monoFont, fontSize: `calc(0.75rem * ${scale})` };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ isolation: "isolate", fontFamily, containerType: "inline-size" }}>
      {/* Readout layer behind everything, seen around the scaled-down page */}
      <div
        className="absolute inset-0 flex flex-col justify-between z-0"
        style={{ background: foreground, color: backdropText }}
      >
        <div className="w-full p-6 flex justify-between items-start" style={readout}>
          {DEFAULT_BACKDROP_TOP.map((col, i) => (
            <div key={i} className="flex flex-col">
              {col.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {i === 3 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={backdropLogo}
                  alt=""
                  draggable={false}
                  className="w-10 h-10 p-1 object-contain"
                  style={{ border: `1px dashed ${backdropText}` }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="w-full p-6 flex justify-between items-end" style={readout}>
          {DEFAULT_BACKDROP_BOTTOM.map((col, i) => (
            <div key={i} className="flex flex-col">
              {col.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Page, scaled down until the gate clears. Sits above the backdrop,
          so sweeping its revealer is what finally shows the headline. */}
      <div
        ref={heroRef}
        className="absolute inset-0 z-[1] flex items-center justify-center text-center p-6"
        style={{ background, color: foreground, willChange: "transform" }}
      >
        {/* Sits inside the page and sweeps away last */}
        <div ref={revealerRef} className="absolute inset-0 z-[1]" style={{ background: foreground }} />
        <h1
          className="relative z-[2] uppercase font-extrabold leading-[0.8] tracking-[-0.02em] flex flex-wrap justify-center gap-x-[0.2em]"
          style={{ width: "90%", fontSize: `clamp(calc(1.75rem * ${scale}),calc(15cqw * ${scale}),calc(15rem * ${scale}))` }}
        >
          {headline.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block overflow-hidden">
              <span
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className="inline-block will-change-transform"
                style={{ transform: "translateY(100%)" }}
              >
                {word}
              </span>
            </span>
          ))}
        </h1>
      </div>

      {/* The gate itself */}
      <div
        ref={preloaderRef}
        className="absolute inset-0 flex flex-col justify-between z-[2]"
        style={{ background, color: foreground, willChange: "transform, clip-path" }}
      >
        <div className="w-full p-6 flex justify-between" style={readout}>
          <Masked
            text={status}
            register={(el) => {
              metaLines.current[0] = el;
            }}
          />
        </div>

        {/* Two stacked sub-columns 6rem apart, then a single line opposite. */}
        <div className="w-full p-6 flex justify-between" style={readout}>
          <div className="flex gap-24 items-end">
            <div className="flex flex-col">
              {meta.slice(0, 2).map((line, i) => (
                <Masked
                  key={line}
                  text={line}
                  register={(el) => {
                    metaLines.current[i + 1] = el;
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col">
              {meta.slice(2, 4).map((line, i) => (
                <Masked
                  key={line}
                  text={line}
                  register={(el) => {
                    metaLines.current[i + 3] = el;
                  }}
                />
              ))}
            </div>
          </div>
          {meta[4] && (
            <Masked
              text={meta[4]}
              register={(el) => {
                metaLines.current[5] = el;
              }}
            />
          )}
        </div>

        <div
          ref={btnRef}
          onClick={enter}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(20rem,60cqw)] aspect-square ${
            armed ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <svg ref={ringRef} className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" fill="none">
            <circle ref={trackRef} cx="160" cy="160" r="155" stroke={trackColor} strokeWidth="2" />
            <circle ref={progressRef} cx="160" cy="160" r="155" stroke={foreground} strokeWidth="2" />
          </svg>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* Fades out as the call to action rises. Pinned to `armed` for the
              same reason as the label, so it can never be left covering it. */}
          <img
            ref={logoRef}
            src={logo}
            alt=""
            draggable={false}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 object-contain pointer-events-none"
            style={{ opacity: armed ? 0 : 1 }}
          />

          {/* Both labels share the centre of the ring. They are
              pointer-events-none so the click always lands on the button,
              and the call to action is also pinned open by `armed`, so it
              cannot be left hidden if the timeline is interrupted. */}
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block overflow-hidden uppercase pointer-events-none z-[2]"
            style={{ fontFamily: monoFont, fontSize: `calc(0.9rem * ${scale})` }}
          >
            <span
              ref={labelRef}
              className="block will-change-transform"
              style={{ transform: armed ? "translateY(0%)" : "translateY(100%)" }}
            >
              {buttonLabel}
            </span>
          </span>
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block overflow-hidden uppercase pointer-events-none z-[1]"
            style={{ fontFamily: monoFont, fontSize: `calc(0.9rem * ${scale})` }}
          >
            <span ref={outroRef} className="block will-change-transform" style={{ transform: "translateY(100%)" }}>
              {grantedLabel}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
