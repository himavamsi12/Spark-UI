"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_IMAGES = Array.from({ length: 10 }, (_, i) => `/spiral-gallery/img${i + 1}.jpg`);

// The reference's hero is 150svh and the canvas fills it, so the WebGL viewport
// is taller than the frame and scrolls with the page behind the type.
const HERO_FRAMES = 1.5;
const TRACK_FRAMES = HERO_FRAMES + 1;

// The reference's hero is 1.5x a roughly 16:9 window, so its camera frames the
// ribbon at about this aspect. three's field of view is vertical, so a wider
// frame than this only reveals more empty world and shrinks the ribbon.
// Matching the reference's *horizontal* field of view instead keeps the ribbon
// framed the same at any shape. This adjusts the lens, not the camera
// position: moving the camera in would frame it correctly but foreshorten the
// turns far harder than the reference does, splaying the spiral open.
const DESIGN_ASPECT = 1.2;
const DESIGN_FOV = 75;
const DEG = Math.PI / 180;
const HALF_H_FOV = Math.atan(Math.tan((DESIGN_FOV / 2) * DEG) * DESIGN_ASPECT);
const fovForAspect = (aspect: number) =>
  (2 * Math.atan(Math.tan(HALF_H_FOV) / aspect)) / DEG;

// Lenis' default lerp; the camera keeps its own easing on top of this.
const smoothing = (dt: number) => 1 - Math.pow(0.9, dt * 60);

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform vec3 uCameraPosition;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float facing = max(dot(-normalize(vWorldNormal), viewDir), 0.0);
    float falloff = smoothstep(-0.2, 0.5, facing) * 0.45 + 0.42;
    vec3 color = mix(vec3(1.0), tex.rgb * falloff, 0.975) * 1.25;
    gl_FragColor = vec4(color, tex.a);
  }
`;

export default function SpiralImageGallery({
  images = DEFAULT_IMAGES,
  headline = "Somewhere between structure and disorder new forms quietly start to emerge",
  aboutText = "New forms begin here",
  background = "#242424",
  aboutBackground = "#171717",
  textColor = "#d2d2d2",
  tilesPerRevolution = 15,
  revolutions = 5,
  startRadius = 5,
  endRadius = 3.5,
  spiralGap = 35,
  spinSpeed = 100,
  parallaxStrength = 10,
  fontFamily = "var(--font-host-grotesk), sans-serif",
  textScale = 100,
  speed = 100,
  autoPlay = false,
}: {
  images?: string[];
  headline?: string;
  aboutText?: string;
  background?: string;
  aboutBackground?: string;
  textColor?: string;
  tilesPerRevolution?: number;
  revolutions?: number;
  startRadius?: number;
  endRadius?: number;
  spiralGap?: number;
  spinSpeed?: number;
  parallaxStrength?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
  autoPlay?: boolean;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const host = hostRef.current;
    if (!root || !track || !host) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const CONFIG = {
        tilesPerRevolution: Math.max(4, Math.round(tilesPerRevolution)),
        revolutions: Math.max(1, revolutions),
        startRadius,
        endRadius,
        tileHeightRatio: 1.1,
        tileSegments: 24,
        spiralGap: spiralGap / 100,
        tileOverlap: 0.005,
        cameraZ: 12,
        cameraSmoothing: 0.075,
        baseRotationSpeed: 0.001 * (spinSpeed / 100),
        scrollRotationMultiplier: 0.0035,
        rotationDecay: 0.9,
        scrollMultiplier: 1.25,
        cameraYMultiplier: 0.2,
        parallaxStrength: parallaxStrength / 100,
      };

      const totalTiles = Math.floor(CONFIG.tilesPerRevolution * CONFIG.revolutions);
      const angleStep = (Math.PI * 2) / CONFIG.tilesPerRevolution;

      const heroHeight = () => root!.clientHeight * HERO_FRAMES;

      const scene = new THREE.Scene();
      const aspectNow = () => root!.clientWidth / heroHeight();
      const camera = new THREE.PerspectiveCamera(
        fovForAspect(aspectNow()),
        aspectNow(),
        0.1,
        1000,
      );
      camera.position.z = CONFIG.cameraZ;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(root!.clientWidth, heroHeight(), false);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const textureLoader = new THREE.TextureLoader();
      const textures = images.map((src) =>
        textureLoader.load(src, (t) => {
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }),
      );

      const cameraPositionUniform = { value: new THREE.Vector3(0, 0, camera.position.z) };

      // Each tile's top edge is the previous tile's bottom, so the ribbon has
      // no gaps as the radius tightens.
      const tileEdgesY = [0];
      for (let i = 0; i < totalTiles; i++) {
        const progress = i / totalTiles;
        const radius = CONFIG.startRadius + (CONFIG.endRadius - CONFIG.startRadius) * progress;
        const arcWidth = (2 * Math.PI * radius) / CONFIG.tilesPerRevolution;
        const tileHeight = arcWidth * CONFIG.tileHeightRatio;
        tileEdgesY.push(
          tileEdgesY[i] - (tileHeight + CONFIG.spiralGap) / CONFIG.tilesPerRevolution,
        );
      }

      const spiral = new THREE.Group();
      scene.add(spiral);

      const disposables: { dispose(): void }[] = [];

      for (let i = 0; i < totalTiles; i++) {
        const progress = i / totalTiles;
        const radius = CONFIG.startRadius + (CONFIG.endRadius - CONFIG.startRadius) * progress;
        const arcWidth = (2 * Math.PI * radius) / CONFIG.tilesPerRevolution;
        const tileHeight = arcWidth * CONFIG.tileHeightRatio;
        const tileAngle = arcWidth / radius + CONFIG.tileOverlap;

        const centerY = (tileEdgesY[i] + tileEdgesY[i + 1]) / 2;
        const slope = tileEdgesY[i + 1] - tileEdgesY[i];

        const positions: number[] = [];
        const uvCoords: number[] = [];
        const indices: number[] = [];
        const segments = CONFIG.tileSegments;

        // A curved quad: each tile bends around the spiral and leans by one
        // step of the descent, so its edges meet its neighbours.
        for (let row = 0; row <= 1; row++) {
          for (let col = 0; col <= segments; col++) {
            const angle = (col / segments - 0.5) * tileAngle;
            positions.push(
              Math.sin(angle) * radius,
              (row - 0.5) * tileHeight + (col / segments - 0.5) * slope,
              Math.cos(angle) * radius,
            );
            uvCoords.push(col / segments, row);
          }
        }

        for (let col = 0; col < segments; col++) {
          const current = col;
          const below = current + segments + 1;
          indices.push(current, below, current + 1, below, below + 1, current + 1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvCoords, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          uniforms: {
            uMap: { value: textures[i % textures.length] },
            uCameraPosition: cameraPositionUniform,
          },
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = centerY;
        disposables.push(geometry, material);

        const tile = new THREE.Group();
        tile.rotation.y = i * angleStep;
        tile.add(mesh);
        spiral.add(tile);
      }

      const spiralHeight = Math.abs(tileEdgesY[totalTiles]);

      const rate = Math.max(0.2, speed / 100);
      // Scroll is tracked in pixels, as the reference reads pageYOffset, and
      // saturates at 1.25 frames while the page keeps scrolling to 1.5.
      let scroll = 0;
      let target = 0;
      let spinVelocity = 0;
      let userDriven = false;

      const maxScroll = () => root!.clientHeight * (TRACK_FRAMES - 1);

      function onWheel(e: WheelEvent) {
        const next = gsap.utils.clamp(0, maxScroll(), target + e.deltaY * rate);
        if (next === target) return;
        e.preventDefault();
        userDriven = true;
        target = next;
      }
      root!.addEventListener("wheel", onWheel, { passive: false });

      let mouseX = 0;
      let mouseY = 0;
      let smoothX = 0;
      let smoothY = 0;
      function onMove(e: MouseEvent) {
        const r = root!.getBoundingClientRect();
        mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        mouseY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }
      root!.addEventListener("mousemove", onMove);

      let raf = 0;
      let dir = 1;
      let last = performance.now();

      function animate(now: number) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;

        if (autoPlay && !userDriven) {
          target += dir * dt * maxScroll() * 0.12 * rate;
          if (target >= maxScroll()) {
            target = maxScroll();
            dir = -1;
          } else if (target <= 0) {
            target = 0;
            dir = 1;
          }
        }
        const previous = scroll;
        scroll += (target - scroll) * smoothing(dt);
        track!.style.transform = `translateY(${-scroll}px)`;

        // The reference spins the ribbon by Lenis' own per-frame velocity, so
        // take it from how far the smoothed scroll actually moved this frame
        // rather than from the raw wheel delta.
        const velocity = scroll - previous;
        if (Math.abs(velocity) > 0.01) {
          spinVelocity = velocity * CONFIG.scrollRotationMultiplier;
        }

        const progress = Math.min(
          scroll / (root!.clientHeight * CONFIG.scrollMultiplier),
          1,
        );
        camera.position.y +=
          (-(progress * spiralHeight * CONFIG.cameraYMultiplier) - camera.position.y) *
          CONFIG.cameraSmoothing;

        const narrow = root!.clientWidth < 1000;
        if (!narrow) {
          smoothX += (mouseX - smoothX) * 0.02;
          smoothY += (mouseY - smoothY) * 0.02;
          spiral.rotation.x = smoothY * CONFIG.parallaxStrength;
          spiral.rotation.z = -smoothX * CONFIG.parallaxStrength * 0.3;
        }

        cameraPositionUniform.value.copy(camera.position);

        spiral.rotation.y += CONFIG.baseRotationSpeed + spinVelocity;
        spinVelocity *= CONFIG.rotationDecay;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      }
      raf = requestAnimationFrame(animate);

      const ro = new ResizeObserver(() => {
        const w = root!.clientWidth;
        root!.style.setProperty("--frame-h", `${root!.clientHeight}px`);
        camera.aspect = aspectNow();
        camera.fov = fovForAspect(camera.aspect);
        // The reference's one responsive step: pull back on a narrow screen.
        camera.position.z = w < 1000 ? 15 : CONFIG.cameraZ;
        camera.updateProjectionMatrix();
        renderer.setSize(w, heroHeight(), false);
      });
      root!.style.setProperty("--frame-h", `${root!.clientHeight}px`);
      ro.observe(root!);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        root!.removeEventListener("wheel", onWheel);
        root!.removeEventListener("mousemove", onMove);
        for (const t of textures) t.dispose();
        for (const d of disposables) d.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [
    images,
    tilesPerRevolution,
    revolutions,
    startRadius,
    endRadius,
    spiralGap,
    spinSpeed,
    parallaxStrength,
    speed,
    autoPlay,
  ]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        isolation: "isolate",
        background,
        color: textColor,
        fontFamily,
        containerType: "inline-size",
      }}
    >
      {/* The document: a 150svh hero carrying the canvas, then the about
          section. The canvas is appended after the type in the reference, so
          the spiral passes in front of the headline. */}
      <div ref={trackRef} className="absolute top-0 left-0 w-full will-change-transform">
        <div
          className="relative w-full overflow-hidden"
          style={{ height: `calc(var(--frame-h, 100%) * ${HERO_FRAMES})`, background }}
        >
          <h1
            className="relative uppercase leading-[0.8] tracking-[-0.04em] pointer-events-none"
            style={{
              padding: "clamp(1rem, 2cqw, 2rem)",
              textAlign: "justify",
              fontSize: `clamp(calc(1.5rem * ${scale}), calc(10cqw * ${scale}), calc(15rem * ${scale}))`,
            }}
          >
            {headline}
          </h1>
          <div ref={hostRef} className="absolute inset-0 pointer-events-none" />
        </div>

        <div
          className="w-full flex items-center justify-center text-center overflow-hidden"
          style={{
            height: "var(--frame-h, 100%)",
            padding: "clamp(1rem, 2cqw, 2rem)",
            background: aboutBackground,
          }}
        >
          <h3
            className="uppercase leading-[0.8] tracking-[-0.04em]"
            style={{ fontSize: `clamp(calc(1.25rem * ${scale}), calc(5cqw * ${scale}), calc(7.5rem * ${scale}))` }}
          >
            {aboutText}
          </h3>
        </div>
      </div>
    </div>
  );
}
