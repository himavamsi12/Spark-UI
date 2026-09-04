"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(SplitText, CustomEase);

const DEFAULT_IMAGES = Array.from({ length: 6 }, (_, i) => `/outfit-reveal/img${i + 1}.jpg`);
const ROTATIONS = [7.5, -2.5, -10, 12.5, -5, 5];

export default function OutfitReveal({
  brand = "Archive",
  accentColor = "#141414",
  bgColor = "#e0e2db",
  images = DEFAULT_IMAGES,
  fontFamily = "var(--font-neue-montreal)",
  textScale = 100,
  speed = 100,
}: {
  brand?: string;
  accentColor?: string;
  bgColor?: string;
  images?: string[];
  fontFamily?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const preloaderRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const preloaderHeadingRef = useRef<HTMLHeadingElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CustomEase.get("hop-outfit")) CustomEase.create("hop-outfit", "0.8, 0, 0.2, 1");
    if (!CustomEase.get("hop2")) CustomEase.create("hop2", "0.9, 0, 0.1, 1");

    const preloader = preloaderRef.current;
    const imageEls = imgRefs.current.filter(Boolean) as HTMLDivElement[];
    const preloaderHeading = preloaderHeadingRef.current;
    const counterEl = counterRef.current;
    const nav = navRef.current;
    const header = headerRef.current;
    const footer = footerRef.current;
    if (!preloader || !preloaderHeading || !counterEl || !nav || !header || !footer || imageEls.length !== images.length) return;

    const rate = Math.max(0.2, speed / 100);

    const preloaderSplit = SplitText.create(preloaderHeading, { type: "chars", charsClass: "char", mask: "chars" });
    const navSplit = SplitText.create(nav.querySelectorAll("span"), { type: "words", wordsClass: "word", mask: "words" });
    const headerSplit = SplitText.create(header, { type: "chars", charsClass: "char" });
    const footerSplit = SplitText.create(footer.querySelectorAll("p"), { type: "words", wordsClass: "word", mask: "words" });

    gsap.set(imageEls, { rotate: (i: number) => ROTATIONS[i] });

    // Timings mirror the source timeline exactly (absolute positions included);
    // `rate` only scales the whole thing for the Speed control.
    const tl = gsap.timeline({ delay: 0.5 / rate });

    tl.to(imageEls, { scale: 1, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1 / rate, ease: "hop-outfit", stagger: 0.2 / rate });
    tl.to(preloaderSplit.chars, { y: "0%", duration: 1 / rate, ease: "hop2", stagger: { each: 0.125 / rate, from: "random" } }, `${0.35 / rate}`);
    tl.to(
      counterEl,
      {
        y: "0%",
        duration: 1 / rate,
        ease: "hop2",
        onStart: () => {
          const counter = { value: 0 };
          gsap.to(counter, {
            value: 100,
            duration: 2 / rate,
            delay: 0.5 / rate,
            ease: "power2.inOut",
            onUpdate: () => (counterEl!.textContent = String(Math.round(counter.value)).padStart(3, "0")),
          });
        },
      },
      "<",
    );

    tl.to(counterEl, { y: "-100%", duration: 0.75 / rate, ease: "hop2" }, 3.25 / rate);
    tl.to(preloaderSplit.chars, { y: "-100%", duration: 0.75 / rate, ease: "hop2", stagger: { each: 0.125 / rate, from: "random" } }, 3.25 / rate);
    tl.to(imageEls, { scale: 0, clipPath: "polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)", duration: 1 / rate, ease: "hop2", stagger: -0.075 / rate }, 3.5 / rate);
    tl.to(preloader, { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1 / rate, ease: "hop2" }, 4.35 / rate);

    tl.to(headerSplit.chars, { y: "0%", duration: 1 / rate, ease: "hop-outfit", stagger: { each: 0.075 / rate, from: "random" } }, 4.65 / rate);
    tl.to(navSplit.words, { y: "0%", duration: 1 / rate, ease: "hop-outfit", stagger: 0.075 / rate }, 4.75 / rate);
    tl.to(footerSplit.words, { y: "0%", duration: 1 / rate, ease: "hop-outfit", stagger: 0.075 / rate }, 4.75 / rate);

    return () => {
      tl.kill();
      preloaderSplit.revert();
      navSplit.revert();
      headerSplit.revert();
      footerSplit.revert();
    };
  }, [brand, speed, images]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ fontFamily, backgroundColor: bgColor }}>
      <nav className="absolute top-0 left-0 w-full p-4 flex items-start justify-between z-10">
        <span className="uppercase text-xs font-medium" style={{ color: accentColor }}>
          {brand}
        </span>
        <div ref={navRef} className="flex gap-3">
          {["Index", "Collection", "Material"].map((label) => (
            <span key={label} className="uppercase text-xs font-medium overflow-hidden inline-block" style={{ color: accentColor }}>
              {label}
            </span>
          ))}
        </div>
      </nav>

      <section className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ color: accentColor }}>
        <h1 ref={headerRef} className="uppercase font-medium overflow-hidden" style={{ fontSize: `clamp(calc(2.5rem * ${scale}),calc(12vw * ${scale}),calc(8rem * ${scale}))`, lineHeight: 0.85 }}>
          {brand}
        </h1>
        <div ref={footerRef} className="absolute bottom-0 left-0 w-full p-4 flex justify-between items-end">
          {["Permanence", "Craft"].map((label) => (
            <p key={label} className="uppercase text-xs font-medium overflow-hidden">
              {label}
            </p>
          ))}
        </div>
      </section>

      <div ref={preloaderRef} className="absolute inset-0 z-20 overflow-hidden text-white" style={{ backgroundColor: accentColor, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>
        <div className="absolute inset-0">
          {images.map((src, i) => (
            <div
              key={i}
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              className="absolute top-1/2 left-1/2 w-16 h-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              style={{ transform: "translate(-50%, -50%) scale(0)", clipPath: "polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)" }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 ref={preloaderHeadingRef} className="uppercase font-medium overflow-hidden" style={{ fontSize: `clamp(calc(1.5rem * ${scale}),calc(7vw * ${scale}),calc(4rem * ${scale}))`, lineHeight: 0.85 }}>
            {brand}
          </h1>
          <div className="absolute -top-4 left-full ml-3 overflow-hidden">
            <p ref={counterRef} className="text-sm">
              000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
