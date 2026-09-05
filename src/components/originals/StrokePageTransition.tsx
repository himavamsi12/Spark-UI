"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const DEFAULT_PAGES = ["Home", "About", "Contact"];

// The two hand-drawn scribbles the reference sweeps across the screen.
const PATH_A =
  "M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262";
const PATH_B =
  "M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012";

export default function StrokePageTransition({
  pages = DEFAULT_PAGES,
  strokeOne = "#d8d9d7",
  strokeTwo = "#6e44ff",
  background = "#f0f2ef",
  textColor = "#171717",
  strokeWidth = 200,
  coverWidth = 700,
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  navFont = "var(--font-dm-sans), sans-serif",
  textScale = 100,
  speed = 100,
}: {
  pages?: string[];
  strokeOne?: string;
  strokeTwo?: string;
  background?: string;
  textColor?: string;
  strokeWidth?: number;
  coverWidth?: number;
  fontFamily?: string;
  navFont?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const svgRef = useRef<SVGSVGElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const animatingRef = useRef(false);
  const [active, setActive] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = [...svg.querySelectorAll("path")];
    pathsRef.current = paths;
    // Each stroke starts fully retracted, ready to draw itself in.
    for (const path of paths) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }
    return () => {
      gsap.killTweensOf(paths);
    };
  }, []);

  function goTo(index: number) {
    if (index === active || animatingRef.current) return;
    animatingRef.current = true;
    setActive(index);

    const rate = Math.max(0.2, speed / 100);
    const paths = pathsRef.current;

    // Leave: strokes draw on and fatten until they blanket the page.
    const leave = gsap.timeline({
      onComplete: () => {
        setDisplayed(index);
        enter();
      },
    });
    for (const path of paths) {
      leave.to(
        path,
        {
          strokeDashoffset: 0,
          attr: { "stroke-width": coverWidth },
          duration: 1 / rate,
          ease: "power1.inOut",
        },
        0,
      );
    }

    // Enter: they keep travelling in the same direction and thin back out.
    function enter() {
      const tl = gsap.timeline({
        onComplete: () => {
          animatingRef.current = false;
        },
      });
      for (const path of paths) {
        const length = path.getTotalLength();
        tl.to(
          path,
          {
            strokeDashoffset: -length,
            attr: { "stroke-width": strokeWidth },
            duration: 1 / rate,
            ease: "power1.inOut",
            onComplete: () => {
              gsap.set(path, { strokeDashoffset: length });
            },
          },
          0,
        );
      }
    }
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        isolation: "isolate",
        background,
        color: textColor,
        containerType: "inline-size",
      }}
    >
      <nav
        className="absolute top-0 left-0 w-full flex justify-between items-center p-4 z-[2]"
        style={{ fontFamily: navFont }}
      >
        <button
          type="button"
          onClick={() => goTo(0)}
          className="p-4 font-medium tracking-[-0.02em] bg-transparent border-none cursor-pointer"
          style={{ color: textColor, fontSize: `calc(1rem * ${scale})` }}
        >
          Logo
        </button>
        <div className="flex" style={{ gap: "clamp(0.5rem, 2cqw, 1rem)" }}>
          {pages.map((label, i) => (
            <button
              key={`${label}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              className={`p-4 font-medium tracking-[-0.02em] bg-transparent border-none cursor-pointer transition-opacity ${
                active === i ? "opacity-100" : "opacity-55 hover:opacity-85"
              }`}
              style={{ color: textColor, fontSize: `calc(1rem * ${scale})` }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <section className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <h1
          className="uppercase font-extrabold leading-none tracking-[-0.02em]"
          style={{
            fontFamily,
            fontSize: `clamp(calc(2.5rem * ${scale}), calc(15cqw * ${scale}), calc(20rem * ${scale}))`,
          }}
        >
          {pages[displayed % pages.length]}
        </h1>
      </section>

      {/* Scaled past the edges so the stroke ends never show inside the frame. */}
      <div
        className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none z-[3]"
        style={{ transform: "translate(-50%, -50%) scale(1.5)" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 2453 2535"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path d={PATH_A} stroke={strokeOne} strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={PATH_B} stroke={strokeTwo} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
