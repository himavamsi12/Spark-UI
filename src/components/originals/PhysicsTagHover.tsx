"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Matter from "matter-js";

type Service = { name: string; tags: string[]; images: string[] };

const DEFAULT_SERVICES: Service[] = [
  {
    name: "Silhouette",
    tags: ["Editorial", "Fashion Identity", "Monochrome", "Shadow Play", "Minimalism", "Studio Portraits"],
    images: ["/griflan-hover/service_1_img_1.jpg", "/griflan-hover/service_1_img_2.jpg", "/griflan-hover/service_1_img_3.jpg"],
  },
  {
    name: "Chroma",
    tags: ["Color Theory", "Graphics", "Poster Design", "Saturation", "Pop Art", "Visual Energy"],
    images: ["/griflan-hover/service_2_img_1.jpg", "/griflan-hover/service_2_img_2.jpg", "/griflan-hover/service_2_img_3.jpg"],
  },
  {
    name: "Persona",
    tags: ["Character Design", "Portraits", "Visual Storytelling", "Emotion", "Identity", "Artistic Direction"],
    images: ["/griflan-hover/service_3_img_1.jpg", "/griflan-hover/service_3_img_2.jpg", "/griflan-hover/service_3_img_3.jpg"],
  },
];

export default function PhysicsTagHover({
  services = DEFAULT_SERVICES,
  background = "#171717",
  nameColor = "#ff3831",
  activeNameColor = "#ffffd9",
  tagColor = "#ffffd9",
  gravity = 2,
  collapsedHeight = 160,
  expandedHeight = 400,
  fontFamily = "var(--font-barlow-condensed), sans-serif",
  tagFont = "var(--font-instrument-serif), serif",
  textScale = 100,
}: {
  services?: Service[];
  background?: string;
  nameColor?: string;
  activeNameColor?: string;
  tagColor?: string;
  gravity?: number;
  collapsedHeight?: number;
  expandedHeight?: number;
  fontFamily?: string;
  tagFont?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const { Engine, World, Bodies, Body } = Matter;
    const disposers: (() => void)[] = [];

    root.querySelectorAll<HTMLDivElement>("[data-service]").forEach((service) => {
      const images = service.querySelectorAll<HTMLDivElement>("[data-img]");
      const nameEl = service.querySelector("h1");
      const labels = JSON.parse(service.dataset.tags || "[]") as string[];

      let engine: Matter.Engine | null = null;
      let els: HTMLDivElement[] = [];
      let bodies: Matter.Body[] = [];
      let raf = 0;
      let container: HTMLDivElement | null = null;
      let hovered = false;
      let dropTimer: gsap.core.Tween | null = null;

      const cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        if (engine) Engine.clear(engine);
        container?.remove();
        els = [];
        bodies = [];
        engine = null;
        raf = 0;
        container = null;
      };
      disposers.push(cleanup);

      function createTags() {
        cleanup();
        const w = service.offsetWidth;
        const h = service.offsetHeight;

        container = document.createElement("div");
        container.style.cssText =
          "position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;pointer-events:none;";
        service.appendChild(container);

        engine = Engine.create({ gravity: { x: 0, y: gravity, scale: 0.001 } });

        // Floor sits above the bottom edge so tags settle on the name, plus
        // walls wide enough that nothing escapes sideways.
        const wall = 20;
        const floorOffset = 50;
        World.add(engine.world, [
          Bodies.rectangle(w / 2, h - floorOffset + wall / 2, w * 3, wall, { isStatic: true }),
          Bodies.rectangle(-wall / 2, h / 2, wall, h * 3, { isStatic: true }),
          Bodies.rectangle(w + wall / 2, h / 2, wall, h * 3, { isStatic: true }),
        ]);

        labels.forEach((label, i) => {
          const tag = document.createElement("div");
          tag.textContent = label;
          tag.style.cssText = `position:absolute;white-space:nowrap;opacity:0;will-change:transform,opacity;border-radius:4rem;padding:0.5rem 1.5rem;border:1px solid ${tagColor};color:${tagColor};background:${background};font-family:${tagFont};font-size:${0.9 * scale}rem;`;
          container!.appendChild(tag);

          const tw = tag.offsetWidth;
          const th = tag.offsetHeight;
          const body = Bodies.rectangle(
            w * 0.25 + Math.random() * w * 0.5,
            -(th / 2) - i * 5,
            tw,
            th,
            { chamfer: { radius: th / 2 }, restitution: 0.15, friction: 0.6, density: 0.002 },
          );
          Body.setAngle(body, (Math.random() - 0.5) * 0.4);
          World.add(engine!.world, body);

          gsap.to(tag, { opacity: 1, duration: 0.3, delay: i * 0.04, ease: "power2.out" });
          els.push(tag);
          bodies.push(body);
        });

        // Matter owns the positions; the DOM just mirrors them each frame.
        const update = () => {
          Engine.update(engine!, 1000 / 60);
          for (let i = 0; i < els.length; i++) {
            const b = bodies[i];
            els[i].style.transform = `translate(${b.position.x - els[i].offsetWidth / 2}px, ${b.position.y - els[i].offsetHeight / 2}px) rotate(${b.angle}rad)`;
          }
          raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
      }

      const onEnter = () => {
        hovered = true;
        gsap.killTweensOf([service, ...Array.from(images), nameEl].filter(Boolean) as Element[]);
        gsap.to(service, { height: expandedHeight, duration: 0.75, ease: "elastic.out(1,0.5)" });
        gsap.to(nameEl, { color: activeNameColor, duration: 0.25, ease: "power4.out" });
        gsap.to(images, { y: "-50%", duration: 0.75, ease: "elastic.out(1,0.5)", stagger: 0.075 });
        // Tags only drop once the row has begun opening.
        dropTimer = gsap.delayedCall(0.2, () => hovered && createTags());
      };

      const onLeave = () => {
        hovered = false;
        dropTimer?.kill();
        gsap.killTweensOf([service, ...Array.from(images), nameEl].filter(Boolean) as Element[]);
        if (els.length) {
          gsap.to(els, { opacity: 0, duration: 0.25, ease: "power2.out", onComplete: cleanup });
        } else cleanup();
        gsap.to(nameEl, { color: nameColor, duration: 0.25, ease: "power4.out" });
        gsap.to(images, { y: "50%", duration: 0.75, ease: "elastic.out(1,0.5)", stagger: 0.075 });
        gsap.to(service, { height: collapsedHeight, duration: 0.5, ease: "elastic.out(1,0.75)" });
      };

      service.addEventListener("mouseenter", onEnter);
      service.addEventListener("mouseleave", onLeave);
      disposers.push(() => {
        service.removeEventListener("mouseenter", onEnter);
        service.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => disposers.forEach((d) => d());
  }, [
    services,
    background,
    nameColor,
    activeNameColor,
    tagColor,
    gravity,
    collapsedHeight,
    expandedHeight,
    tagFont,
    scale,
  ]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full flex flex-col justify-center items-center p-8 overflow-hidden"
      style={{ background, color: nameColor, fontFamily, containerType: "inline-size" }}
    >
      {services.map((service, i) => (
        <div
          key={`${service.name}-${i}`}
          data-service
          data-tags={JSON.stringify(service.tags)}
          className="relative flex items-end overflow-hidden cursor-pointer"
          style={{ width: "max-content", height: collapsedHeight, willChange: "height" }}
        >
          <div className="relative z-[2]">
            <h1
              className="uppercase font-black leading-none tracking-[-0.01em]"
              style={{ background, fontSize: `clamp(calc(2rem * ${scale}),calc(11cqw * ${scale}),calc(10rem * ${scale}))` }}
            >
              {service.name}
            </h1>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[25rem] h-[20rem] overflow-hidden">
            {service.images.map((src, j) => (
              <div
                key={src}
                data-img
                className="absolute top-1/2 left-1/2 w-60 h-40 rounded-[0.35rem] overflow-hidden"
                style={{
                  transform: `translate(-50%, 50%) rotate(${j === 0 ? -5 : j === 1 ? 5 : 0}deg)`,
                  transformOrigin: j === 0 ? "bottom left" : j === 1 ? "bottom right" : "center",
                  marginTop: j === 2 ? 0 : "-1.5rem",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" draggable={false} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
