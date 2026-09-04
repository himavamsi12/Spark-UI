"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const ITEMS = [
  { x: "-20vw", y: "-30vh", rotation: -20 },
  { x: "25vw", y: "-20vh", rotation: 15 },
  { x: "-32vw", y: "30vh", rotation: 12 },
  { x: "15vw", y: "25vh", rotation: -15 },
];

// Four staggered circle wipes, matching the source's .preloader-revealer stack.
const REVEALERS = ["#c49241", "#f75828", "#e01b22", "#17100a"];
const NAV_ITEMS = ["Menu", "Locations", "Our Story", "Reserve", "FAQ", "Order"];
const FOOTER_ITEMS = ["Locally Sourced", "Always Welcome"];

export default function ConfettiReveal({
  bgColor = "#17100a",
  revealColor = "#f75828",
  heroText = "The table you will keep coming back to every week",
  fontFamily = "var(--font-instrument-sans), sans-serif",
  textScale = 100,
  speed = 100,
}: {
  bgColor?: string;
  revealColor?: string;
  heroText?: string;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const revealerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const navLogoRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const heroImgBgRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const preloader = preloaderRef.current;
    const revealers = revealerRefs.current.filter(Boolean) as HTMLDivElement[];
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    const logo = logoRef.current;
    const navLogo = navLogoRef.current;
    const navItems = navItemsRef.current;
    const footer = footerRef.current;
    const heroImgBg = heroImgBgRef.current;
    const heroImg = heroImgRef.current;
    const heading = headingRef.current;
    if (!root || !preloader || !logo || !navLogo || !navItems || !footer || !heroImgBg || !heroImg || !heading || items.length !== 4) return;

    const rate = Math.max(0.2, speed / 100);
    const isMobile = root.clientWidth < 520;

    const navSplit = SplitText.create(navItems.querySelectorAll("span"), { type: "words", mask: "words", wordsClass: "nav-word" });
    const headingSplit = SplitText.create(heading, { type: "lines, words, chars", charsClass: "char", wordsClass: "word" });
    const footerSplit = SplitText.create(footer.querySelectorAll("p"), { type: "lines", mask: "lines", linesClass: "footer-line" });

    gsap.set(revealers, { clipPath: "circle(0% at 50% 50%)" });
    gsap.set(items, { scale: 0, x: 0, y: 0 });
    gsap.set(logo, { scale: 0.5, opacity: 0 });
    gsap.set(navLogo, { scale: 0 });
    gsap.set(navSplit.words, { yPercent: 100 });
    gsap.set(headingSplit.chars, { y: 50, opacity: 0, scale: 0.5 });
    gsap.set(footerSplit.lines, { yPercent: 100 });
    gsap.set(heroImgBg, { scale: 0 });
    gsap.set(heroImg, { yPercent: -50 });

    const floatingTweens: gsap.core.Tween[] = [];
    const tl = gsap.timeline({ delay: 0.5 / rate });

    tl.to(revealers, { clipPath: "circle(100% at 50% 50%)", duration: 1 / rate, stagger: 0.25 / rate, ease: "power2.inOut" });
    tl.set(revealers, { display: "none" });

    items.forEach((item, i) => {
      const target = ITEMS[i];
      const image = item.querySelector("img");
      tl.to(
        item,
        {
          x: isMobile ? "0vw" : target.x,
          y: target.y,
          scale: 1,
          rotation: target.rotation,
          duration: 1 / rate,
          ease: "power3.out",
          onStart: () => {
            if (!image) return;
            floatingTweens.push(
              gsap.to(image, {
                y: gsap.utils.random(-15, -25),
                duration: gsap.utils.random(1.5, 2.5),
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: gsap.utils.random(0, 0.5),
              }),
            );
          },
        },
        i === 0 ? `-=${0.55 / rate}` : `<${0.075 / rate}`,
      );
    });

    tl.to(logo, { scale: 1, opacity: 1, duration: 1 / rate, ease: "power3.out" }, "<");
    tl.to({}, { duration: 1 / rate });
    tl.add(() => floatingTweens.forEach((t) => t.kill()));

    items.forEach((item, i) => {
      const target = ITEMS[i];
      tl.to(
        item,
        {
          x: `${parseFloat(target.x) * 3.5}vw`,
          y: `${parseFloat(target.y) * 3.5}vh`,
          scale: 2.5,
          rotation: target.rotation * 2.5,
          duration: 0.75 / rate,
          ease: "power2.in",
        },
        i === 0 ? ">" : `<${0.075 / rate}`,
      );
    });

    tl.to(logo, { y: "-120%", scale: 2.5, duration: 0.75 / rate, ease: "power2.in" }, "<");
    tl.to(navLogo, { scale: 1, duration: 0.75 / rate, ease: "power3.out" }, `-=${0.4 / rate}`);
    tl.to(navSplit.words, { yPercent: 0, duration: 0.75 / rate, stagger: 0.05 / rate, ease: "power3.out" }, "<0.1");
    tl.to(
      headingSplit.chars,
      { y: 0, opacity: 1, scale: 1, duration: 1.5 / rate, stagger: 0.015 / rate, ease: "elastic.out(0.75, 0.25)" },
      "<0.15",
    );
    tl.to(footerSplit.lines, { yPercent: 0, duration: 0.75 / rate, stagger: 0.1 / rate, ease: "power3.out" }, "<0.2");
    tl.to(heroImgBg, { scale: 1, duration: 1 / rate, ease: "power3.out" }, "<0.1");
    tl.to(heroImg, { yPercent: 0, duration: 1 / rate, ease: "power3.out" }, "<0.3");
    tl.set(preloader, { autoAlpha: 0 });

    return () => {
      tl.kill();
      floatingTweens.forEach((t) => t.kill());
      navSplit.revert();
      headingSplit.revert();
      footerSplit.revert();
    };
  }, [speed]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden" style={{ fontFamily, backgroundColor: bgColor }}>
      <nav className="absolute top-0 left-0 w-full flex items-center justify-between p-4 z-10">
        <div ref={navLogoRef} className="w-8 h-8 rounded-full" style={{ backgroundColor: revealColor }} />
        <div ref={navItemsRef} className="flex gap-3 uppercase font-semibold" style={{ color: "#f5e1bf", fontSize: `calc(10px * ${scale})` }}>
          {NAV_ITEMS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </nav>

      <section className="relative w-full h-full flex flex-col items-center justify-center gap-6 px-8 text-center">
        <h1 ref={headingRef} className="uppercase font-extrabold leading-[0.85]" style={{ color: "#f5e1bf", fontSize: `clamp(calc(1.5rem * ${scale}),calc(5vw * ${scale}),calc(3rem * ${scale}))` }}>
          {heroText}
        </h1>
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div ref={heroImgBgRef} className="absolute inset-0 rounded-full" style={{ backgroundColor: revealColor }} />
          <img ref={heroImgRef} src="/confetti-reveal/item6.png" alt="" className="relative w-[130%] h-[130%] object-contain" style={{ transform: "rotate(15deg)" }} />
        </div>
        <div ref={footerRef} className="absolute bottom-0 left-0 w-full p-4 flex justify-between uppercase font-semibold" style={{ color: "#f5e1bf", fontSize: `calc(10px * ${scale})` }}>
          {FOOTER_ITEMS.map((label) => (
            <p key={label}>{label}</p>
          ))}
        </div>
      </section>

      <div ref={preloaderRef} className="absolute inset-0 z-20" style={{ backgroundColor: bgColor }}>
        {REVEALERS.map((color, i) => (
          <div
            key={color + i}
            ref={(el) => {
              revealerRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={{ backgroundColor: color, clipPath: "circle(0% at 50% 50%)", willChange: "clip-path" }}
          />
        ))}
        {ITEMS.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 w-16 aspect-square -translate-x-1/2 -translate-y-1/2"
          >
            <img src={`/confetti-reveal/item${i + 1}.png`} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        ))}
        <div ref={logoRef} className="absolute top-1/2 left-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: revealColor }} />
      </div>
    </div>
  );
}
