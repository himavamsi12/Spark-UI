"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const DEFAULT_SOCIALS = ["Bluesky", "Pinterest", "YouTube", "Instagram", "LinkedIn", "X"];
const DEFAULT_LEGAL = ["Cookie Policy", "Accessibility", "Data Rights", "Disclosures"];
const DEFAULT_PRIMARY = ["Home", "Experiments", "Latest Updates", "Documentation", "Community"];
const DEFAULT_SECONDARY = ["Playground", "Build Something", "Activity Feed", "Profile"];
const DEFAULT_PANELS = ["#57cea5", "#063124", "#0b5c43", "#21ba80"];

const CLOSED_CLIP = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
const OPEN_CLIP = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

export default function OverlayMenu({
  heroImage = "/overlay-menu/hero.jpg",
  logo = "/overlay-menu/logo.png",
  socials = DEFAULT_SOCIALS,
  legal = DEFAULT_LEGAL,
  primaryLinks = DEFAULT_PRIMARY,
  secondaryLinks = DEFAULT_SECONDARY,
  panelColors = DEFAULT_PANELS,
  menuColor = "#084331",
  linkColor = "#ffffff",
  mutedColor = "#318b6f",
  fontFamily = "var(--font-plus-jakarta-sans), sans-serif",
  textScale = 100,
  speed = 100,
}: {
  heroImage?: string;
  logo?: string;
  socials?: string[];
  legal?: string[];
  primaryLinks?: string[];
  secondaryLinks?: string[];
  panelColors?: string[];
  menuColor?: string;
  linkColor?: string;
  mutedColor?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const togglerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const toggler = togglerRef.current;
    if (!root || !toggler) return;

    const rate = Math.max(0.2, speed / 100);
    const panels = root.querySelectorAll<HTMLDivElement>("[data-panel]");
    const items = root.querySelector<HTMLDivElement>("[data-items]");
    if (!items) return;

    gsap.set(panels, { scaleY: 0 });
    gsap.set(items, { clipPath: CLOSED_CLIP });

    let isMenuOpen = false;
    let isAnimating = false;

    // SplitText needs the fonts settled or it measures the fallback and the
    // masked lines end up the wrong height.
    let splits: SplitText[] = [];
    const groups: HTMLElement[][] = [];

    const buildSplits = () => {
      const linkGroups = [
        [...root.querySelectorAll<HTMLAnchorElement>("[data-group='socials'] a, [data-group='legal'] a")],
        [...root.querySelectorAll<HTMLAnchorElement>("[data-group='primary'] a")],
        [...root.querySelectorAll<HTMLAnchorElement>("[data-group='secondary'] a")],
      ];
      for (const anchors of linkGroups) {
        const lines: HTMLElement[] = [];
        for (const a of anchors) {
          const split = SplitText.create(a, { type: "lines", mask: "lines", linesClass: "line" });
          splits.push(split);
          lines.push(...(split.lines as HTMLElement[]));
        }
        groups.push(lines);
      }
      gsap.set(groups.flat(), { yPercent: 100 });
    };

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        isAnimating = false;
      },
      onReverseComplete: () => {
        gsap.set(groups.flat(), { yPercent: 100 });
        isAnimating = false;
      },
    });

    tl.to(panels, { scaleY: 1, duration: 0.75 / rate, stagger: 0.1 / rate, ease: "power3.inOut" });
    tl.to(items, { clipPath: OPEN_CLIP, duration: 0.75 / rate, ease: "power3.inOut" }, `-=${0.6 / rate}`);

    function animateLinksIn() {
      for (const lines of groups) {
        gsap.fromTo(
          lines,
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: 0.75 / rate,
            stagger: 0.05 / rate,
            ease: "power3.out",
            delay: 0.85 / rate,
          },
        );
      }
    }

    function onClick() {
      if (isAnimating) return;
      isAnimating = true;
      toggler!.classList.toggle("open");

      if (!isMenuOpen) {
        tl.play();
        animateLinksIn();
      } else {
        tl.reverse();
      }
      isMenuOpen = !isMenuOpen;
    }

    let ready = false;
    const start = () => {
      if (ready) return;
      ready = true;
      buildSplits();
      toggler.addEventListener("click", onClick);
    };

    if (document.fonts?.status === "loaded") start();
    else document.fonts?.ready.then(start).catch(start);

    return () => {
      toggler.removeEventListener("click", onClick);
      tl.kill();
      for (const s of splits) s.revert();
      splits = [];
    };
  }, [speed, socials, legal, primaryLinks, secondaryLinks]);

  const linkClass = "block no-underline leading-[1.1] mb-2 tracking-[-0.02em]";

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden bg-[#141414]"
      style={{ isolation: "isolate", fontFamily, containerType: "inline-size" }}
    >
      <style>{`
        .om-toggler span { transition: transform 0.4s ease; }
        .om-toggler.open span:first-child { transform: translateY(3.5px) rotate(45deg) scaleX(0.75); }
        .om-toggler.open span:nth-child(2) { transform: translateY(-3.5px) rotate(-45deg) scaleX(0.75); }
        .om-root .line { position: relative; will-change: transform; }
      `}</style>

      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Panels and the menu itself share a wrapper that starts at the top edge,
          so every layer grows downward from under the bar. */}
      <div className="om-root absolute top-0 left-0 w-full h-full pointer-events-none z-[1]">
        {panelColors.map((color, i) => (
          <div
            key={`${color}-${i}`}
            data-panel
            className="absolute inset-0 origin-top will-change-transform"
            style={{ background: color }}
          />
        ))}

        <div
          data-items
          className="relative w-full h-full flex gap-8 will-change-[clip-path] overflow-hidden"
          style={{
            background: menuColor,
            clipPath: CLOSED_CLIP,
            padding: "clamp(3rem, 8cqw, 8rem)",
            color: linkColor,
          }}
        >
          <div className="flex-[2] flex flex-col justify-between gap-8 min-w-0">
            <div data-group="socials">
              {socials.map((label, i) => (
                <a key={`${label}-${i}`} href="#" className={linkClass} style={{ color: linkColor, fontSize: `calc(1rem * ${scale})` }}>
                  {label}
                </a>
              ))}
            </div>
            <div data-group="legal">
              {legal.map((label, i) => (
                <a key={`${label}-${i}`} href="#" className={linkClass} style={{ color: mutedColor, fontSize: `calc(0.8rem * ${scale})` }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex-[4] flex gap-8 justify-between min-w-0">
            <div data-group="primary">
              {primaryLinks.map((label, i) => (
                <a
                  key={`${label}-${i}`}
                  href="#"
                  className={linkClass}
                  style={{ color: linkColor, fontSize: `clamp(calc(1.25rem * ${scale}), calc(3.5cqw * ${scale}), calc(3rem * ${scale}))` }}
                >
                  {label}
                </a>
              ))}
            </div>
            <div data-group="secondary">
              {secondaryLinks.map((label, i) => (
                <a key={`${label}-${i}`} href="#" className={linkClass} style={{ color: linkColor, fontSize: `calc(1.15rem * ${scale})` }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <nav className="absolute top-0 left-0 w-full flex justify-between items-center p-4 z-[2]">
        <span className="p-4 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="w-10 h-10 object-contain" draggable={false} />
        </span>
        <button
          ref={togglerRef}
          type="button"
          aria-label="Toggle menu"
          className="om-toggler p-4 flex flex-col justify-center items-center gap-[5px] bg-transparent border-none cursor-pointer"
        >
          <span className="block w-10 h-[2px] bg-white" />
          <span className="block w-10 h-[2px] bg-white" />
        </button>
      </nav>
    </div>
  );
}
