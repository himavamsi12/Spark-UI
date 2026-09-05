"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const FULL = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const SWEPT = "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";

/** One line of text inside a mask, able to ride up or down on its own. */
function Masked({
  text,
  register,
  className,
  style,
}: {
  text: string;
  register: (el: HTMLSpanElement | null) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`block overflow-hidden ${className ?? ""}`} style={style}>
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
  buttonLabel = "Engage",
  grantedLabel = "Access Granted",
  logo = "/access-gate/logo-light.png",
  background = "#000000",
  foreground = "#ffffff",
  trackColor = "#2b2b2b",
  fontFamily = "var(--font-barlow-condensed), sans-serif",
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
  background?: string;
  foreground?: string;
  trackColor?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  replayKey?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const revealerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
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
    gsap.set([...lines, labelRef.current, outroRef.current], { yPercent: 100 });
    gsap.set(words, { yPercent: 100 });
    gsap.set(preloaderRef.current, { scale: 1, clipPath: FULL, display: "flex" });
    gsap.set(revealerRef.current, { clipPath: FULL });
    gsap.set(heroRef.current, { scale: 1.1 });
    gsap.set(logoRef.current, { opacity: 1 });
    gsap.set(btnRef.current, { scale: 1 });
    ready.current = false;
    setArmed(false);

    const tl = gsap.timeline({ delay: 0.4 / rate });

    tl.to(lines, { yPercent: 0, duration: 0.75 / rate, ease: "power3.out", stagger: 0.1 / rate });
    // The ring draws itself while the readout lines arrive.
    tl.to(track, { strokeDashoffset: 0, duration: 2 / rate, ease: "hop" }, "<");
    tl.to(".acc-ring", { rotation: 270, duration: 2 / rate, ease: "hop" }, "<");

    // Progress advances in uneven jumps, so the load reads as real work
    // rather than a constant sweep.
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
        },
      },
      `-=${0.75 / rate}`,
    );

    return () => {
      tl.kill();
    };
  }, [speed, replayKey, meta, status]);

  function enter() {
    if (!ready.current) return;
    ready.current = false;
    setArmed(false);

    const rate = Math.max(0.2, speed / 100);
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!track || !progress) return;
    const length = track.getTotalLength();

    const tl = gsap.timeline();
    tl.to(preloaderRef.current, { scale: 0.75, duration: 1.25 / rate, ease: "hop" });
    // The ring unwinds past zero, so it empties the way it filled.
    tl.to([track, progress], { strokeDashoffset: -length, duration: 1.25 / rate, ease: "hop" }, "<");
    tl.to(labelRef.current, { yPercent: -100, duration: 0.75 / rate, ease: "power3.out" }, `-=${1.25 / rate}`);
    tl.to(outroRef.current, { yPercent: 0, duration: 0.75 / rate, ease: "power3.out" }, `-=${0.75 / rate}`);
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

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background, color: foreground, fontFamily, containerType: "inline-size" }}
    >
      <div ref={heroRef} className="absolute inset-0 flex items-end p-6">
        <div ref={revealerRef} className="absolute inset-0" style={{ background: foreground }} />
        <h1
          className="relative uppercase font-extrabold leading-[0.8] tracking-[-0.02em] flex flex-wrap gap-x-[0.2em]"
          style={{ fontSize: `clamp(calc(1.75rem * ${scale}),calc(9cqw * ${scale}),calc(15rem * ${scale}))` }}
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

      <div
        ref={preloaderRef}
        className="absolute inset-0 flex flex-col justify-between p-6 z-10"
        style={{ background, color: foreground }}
      >
        <div style={{ fontSize: `calc(0.75rem * ${scale})` }}>
          <Masked
            text={status}
            register={(el) => {
              metaLines.current[0] = el;
            }}
          />
        </div>

        <div className="flex justify-between" style={{ fontSize: `calc(0.7rem * ${scale})` }}>
          <div className="flex gap-10">
            {meta.slice(0, 4).map((line, i) => (
              <Masked
                key={line}
                text={line}
                register={(el) => {
                  metaLines.current[i + 1] = el;
                }}
              />
            ))}
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
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(20rem,60cqw)] aspect-square flex items-center justify-center ${
            armed ? "cursor-pointer" : "cursor-default"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={logoRef} src={logo} alt="" className="absolute w-10 h-10 object-contain" draggable={false} />

          <span
            className="absolute block overflow-hidden uppercase tracking-widest"
            style={{ fontSize: `calc(0.8rem * ${scale})` }}
          >
            <span ref={labelRef} className="block will-change-transform" style={{ transform: "translateY(100%)" }}>
              {buttonLabel}
            </span>
          </span>
          <span
            className="absolute block overflow-hidden uppercase tracking-widest"
            style={{ fontSize: `calc(0.8rem * ${scale})` }}
          >
            <span ref={outroRef} className="block will-change-transform" style={{ transform: "translateY(100%)" }}>
              {grantedLabel}
            </span>
          </span>

          <svg className="acc-ring absolute inset-0 w-full h-full" viewBox="0 0 320 320" fill="none">
            <circle ref={trackRef} cx="160" cy="160" r="155" stroke={trackColor} strokeWidth="2" />
            <circle ref={progressRef} cx="160" cy="160" r="155" stroke={foreground} strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
