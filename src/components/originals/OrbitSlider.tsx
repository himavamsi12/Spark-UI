"use client";

import { useEffect, useRef } from "react";

const TOTAL = 10;
const TITLES = [
  "Silent Bloom", "Tin Vessel", "Iris Study", "The Observer", "Soft Static",
  "Blue Descent", "Still Life No.7", "Nape", "Voltage", "Distant Wall",
];

export default function OrbitSlider({
  autoRotate = false,
  speed = 100,
  tiltMax = 30,
  fontFamily = "var(--font-commit-mono), monospace",
  textScale = 100,
}: {
  autoRotate?: boolean;
  speed?: number;
  tiltMax?: number;
  fontFamily?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const orbit = orbitRef.current;
    const preview = previewRef.current;
    const previewImg = previewImgRef.current;
    const titleEl = titleRef.current;
    if (!root || !stage || !orbit || !preview || !previewImg || !titleEl) return;

    orbit.innerHTML = "";
    const orbitRadius = 400;
    const angleStep = 360 / TOTAL;
    for (let i = 0; i < TOTAL; i++) {
      const panel = document.createElement("div");
      panel.className = "absolute w-full h-full overflow-hidden";
      panel.innerHTML = `<img src="/orbit-slider/img${i + 1}.jpg" style="width:100%;height:100%;object-fit:cover;display:block" />`;
      panel.style.transform = `rotateY(${i * angleStep}deg) translateZ(${orbitRadius}px)`;
      orbit.appendChild(panel);
    }

    const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
    const smoothing = 0.05;
    let targetRotation = 0;
    let currentRotation = 0;
    let shownIndex = 0;
    let targetTiltX = 0, targetTiltY = 0, currentTiltX = 0, currentTiltY = 0;
    const autoSpeed = (speed / 100) * 0.25;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      targetRotation -= e.deltaY * 0.2;
    }
    function onMove(e: MouseEvent) {
      const bounds = root!.getBoundingClientRect();
      const dx = (e.clientX - bounds.left) / bounds.width - 0.5;
      const dy = (e.clientY - bounds.top) / bounds.height - 0.5;
      targetTiltY = dx * tiltMax;
      targetTiltX = -dy * tiltMax;
    }
    function onLeave() {
      targetTiltX = 0;
      targetTiltY = 0;
    }

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);

    function showActive() {
      const steps = Math.round(-currentRotation / angleStep);
      const activeIndex = ((steps % TOTAL) + TOTAL) % TOTAL;
      if (activeIndex !== shownIndex) {
        shownIndex = activeIndex;
        previewImg!.src = `/orbit-slider/img${activeIndex + 1}.jpg`;
        titleEl!.textContent = TITLES[activeIndex];
      }
    }

    let raf = 0;
    function animate() {
      if (autoRotate) targetRotation -= autoSpeed;
      currentRotation = lerp(currentRotation, targetRotation, smoothing);
      orbit!.style.transform = `translate(-50%, -50%) rotateY(${currentRotation}deg)`;
      preview!.style.transform = `translate(-50%, -50%) rotateY(${-currentRotation}deg)`;
      currentTiltX = lerp(currentTiltX, targetTiltX, smoothing);
      currentTiltY = lerp(currentTiltY, targetTiltY, smoothing);
      stage!.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
      showActive();
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, [autoRotate, speed, tiltMax]);

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-[#eaeaea]" style={{ fontFamily, perspective: 2000 }}>
      <div ref={stageRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <div
          ref={orbitRef}
          className="absolute top-1/2 left-1/2 w-[100px] h-[125px]"
          style={{ transform: "translate(-50%, -50%)", transformStyle: "preserve-3d" }}
        />
      </div>
      <div ref={previewRef} className="absolute top-1/2 left-1/2 w-[250px] h-[325px] overflow-hidden" style={{ transform: "translate(-50%, -50%)" }}>
        <img ref={previewImgRef} src="/orbit-slider/img1.jpg" className="w-full h-full object-cover" alt="" />
      </div>
      <p
        ref={titleRef}
        className="absolute left-1/2 -translate-x-1/2 font-mono uppercase bg-black text-white"
        style={{
          bottom: "3rem",
          padding: "0.2rem 0.4rem",
          borderRadius: "3px",
          fontSize: `calc(0.7rem * ${scale})`,
        }}
      >
        Silent Bloom
      </p>
    </div>
  );
}
