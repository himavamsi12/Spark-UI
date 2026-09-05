"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const DEFAULT_IMAGES = [
  "/ripple-slider/slider-img-1.jpg",
  "/ripple-slider/slider-img-2.jpg",
  "/ripple-slider/slider-img-3.jpg",
  "/ripple-slider/slider-img-4.jpg",
];

const DEFAULT_TITLES = ["Blackwater '91", "Crimson Theory", "Tape Delay Archives", "Exit 14 Westbound"];

const DEFAULT_DESCRIPTIONS = [
  "Flickering lanterns and twisted masks welcome unwanted visitors into a strange celebration beyond the forest trail.",
  "A mysterious performer slowly loses reality beneath violent lights and unsettling mirrored reflections inside an empty theater.",
  "Stacks of dusty videotapes and glowing static fill the room during another endless night without a single moment of sleep.",
  "Heavy rain crashes against the windshield as terrified passengers race through midnight highways without knowing who follows.",
];

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uTexCurrent;
  uniform sampler2D uTexNext;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uImageRes;
  uniform float uWaveFreq;
  uniform float uWavePow;
  uniform float uWaveWidth;
  uniform float uFalloff;
  uniform float uBoostStrength;
  uniform float uCrossfadeWidth;
  uniform float uMobile;

  varying vec2 vUv;

  vec2 getImageUv(vec2 uv, vec2 screenRes, vec2 imgRes, vec2 boxMin, vec2 boxMax) {
    vec2 boxUv = (uv - boxMin) / (boxMax - boxMin);

    vec2 boxSize = (boxMax - boxMin) * screenRes;
    float boxAspect = boxSize.x / boxSize.y;
    float imgAspect = imgRes.x / imgRes.y;

    vec2 scale = vec2(1.0);
    if (boxAspect > imgAspect) {
      scale.y = imgAspect / boxAspect;
    } else {
      scale.x = boxAspect / imgAspect;
    }

    return (boxUv - 0.5) * scale + 0.5;
  }

  bool isInsideBox(vec2 uv, vec2 boxMin, vec2 boxMax) {
    return uv.x >= boxMin.x && uv.x <= boxMax.x && uv.y >= boxMin.y && uv.y <= boxMax.y;
  }

  void main() {
    vec2 boxMin = mix(vec2(0.25, 0.175), vec2(0.0), uMobile);
    vec2 boxMax = mix(vec2(0.75, 0.825), vec2(1.0), uMobile);

    float aspectRatio = uResolution.y / uResolution.x;

    vec2 coord = vec2(vUv.x, vUv.y * aspectRatio);
    vec2 center = vec2(0.5, 0.5 * aspectRatio);

    float dist = distance(coord, center);
    float time = uProgress;

    vec2 displaced = coord;
    float brightness = 0.0;
    float blend = 0.0;

    if (time > 0.001) {
      float trailing = dist - time;

      if (trailing < uWaveWidth && trailing < 0.0) {
        float age = -trailing;
        float decay = exp(-age * uFalloff);
        float wave = sin(age * uWaveFreq) * decay;

        vec2 direction = normalize(coord - center);
        displaced += direction * wave * uWavePow;

        brightness = abs(wave) * uBoostStrength * decay;
      }

      blend = smoothstep(0.0, uCrossfadeWidth, -trailing);
    }

    vec2 finalUv = vec2(displaced.x, displaced.y / aspectRatio);
    vec2 imageUv = getImageUv(finalUv, uResolution, uImageRes, boxMin, boxMax);

    vec4 currentColor = texture2D(uTexCurrent, imageUv);
    vec4 nextColor = texture2D(uTexNext, imageUv);

    vec4 color = mix(currentColor, nextColor, blend);
    color.rgb += color.rgb * brightness;

    if (!isInsideBox(finalUv, boxMin, boxMax)) {
      color = vec4(0.0);
    }

    gl_FragColor = color;
  }
`;

export default function RippleSlider({
  images = DEFAULT_IMAGES,
  titles = DEFAULT_TITLES,
  descriptions = DEFAULT_DESCRIPTIONS,
  background = "#e0ddcf",
  waveFrequency = 25,
  waveStrength = 35,
  waveWidth = 50,
  falloff = 10,
  boostStrength = 50,
  fontFamily = "var(--font-host-grotesk), sans-serif",
  textScale = 100,
  speed = 100,
}: {
  images?: string[];
  titles?: string[];
  descriptions?: string[];
  background?: string;
  waveFrequency?: number;
  waveStrength?: number;
  waveWidth?: number;
  falloff?: number;
  boostStrength?: number;
  fontFamily?: string;
  textScale?: number;
  speed?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [index, setIndex] = useState(0);
  const advanceRef = useRef<(() => void) | null>(null);
  // Splits are rebuilt on every slide, so the out-tween and the in-tween each
  // need the set that belongs to the text currently in the DOM.
  const splitsRef = useRef<{ chars: HTMLElement[]; lines: HTMLElement[]; revert: () => void } | null>(null);
  const firstRunRef = useRef(true);

  // Title splits to masked characters, copy to masked lines, matching the
  // reference's two different granularities.
  function buildSplits() {
    const title = titleRef.current;
    const desc = descRef.current;
    if (!title || !desc) return null;
    const titleSplit = SplitText.create(title, {
      type: "words, chars",
      mask: "chars",
      wordsClass: "word",
      charsClass: "char",
    });
    const descSplit = SplitText.create(desc, { type: "lines", mask: "lines", linesClass: "line" });
    return {
      chars: titleSplit.chars as HTMLElement[],
      lines: descSplit.lines as HTMLElement[],
      revert: () => {
        titleSplit.revert();
        descSplit.revert();
      },
    };
  }

  useEffect(() => {
    const rate = Math.max(0.2, speed / 100);
    const split = buildSplits();
    splitsRef.current = split;
    if (!split) return;

    const { chars, lines } = split;
    if (firstRunRef.current) {
      // Opening state: everything arrives once, slightly slower than a swap.
      firstRunRef.current = false;
      gsap.fromTo(chars, { yPercent: 100 }, { yPercent: 0, duration: 0.8 / rate, stagger: 0.025 / rate, ease: "power2.out" });
      gsap.fromTo(lines, { yPercent: 100 }, { yPercent: 0, duration: 0.8 / rate, stagger: 0.025 / rate, ease: "power2.out", delay: 0.2 / rate });
    } else {
      gsap.set([chars, lines], { yPercent: 100 });
      gsap
        .timeline()
        .to(chars, { yPercent: 0, duration: 0.5 / rate, stagger: 0.02 / rate, ease: "power2.inOut" })
        .to(lines, { yPercent: 0, duration: 0.5 / rate, stagger: 0.05 / rate, ease: "power2.out" }, 0.1 / rate);
    }

    return () => {
      gsap.killTweensOf([...chars, ...lines]);
      split.revert();
      splitsRef.current = null;
    };
  }, [index, speed, titles, descriptions]);

  useEffect(() => {
    const root = rootRef.current;
    const host = canvasHostRef.current;
    if (!root || !host) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 10);
      camera.position.z = 1;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const loader = new THREE.TextureLoader();
      const textures = await Promise.all(
        images.map(
          (src) =>
            new Promise<InstanceType<typeof THREE.Texture>>((resolve) =>
              loader.load(src, (t) => {
                t.minFilter = THREE.LinearFilter;
                t.magFilter = THREE.LinearFilter;
                t.wrapS = THREE.ClampToEdgeWrapping;
                t.wrapT = THREE.ClampToEdgeWrapping;
                resolve(t);
              }),
            ),
        ),
      );
      if (disposed) {
        for (const t of textures) t.dispose();
        renderer.dispose();
        return;
      }

      const rate = Math.max(0.2, speed / 100);
      const rippleConfig = {
        waveWidth: waveWidth / 100,
        duration: 3.0 / rate,
        endValue: 1.0,
        ease: "power2.out",
      };

      const uniforms = {
        uTexCurrent: { value: textures[0] },
        uTexNext: { value: textures[1 % textures.length] },
        uProgress: { value: 0.0 },
        uResolution: { value: new THREE.Vector2() },
        uImageRes: { value: new THREE.Vector2(1920, 1280) },
        uWaveFreq: { value: waveFrequency },
        uWavePow: { value: waveStrength / 1000 },
        uWaveWidth: { value: rippleConfig.waveWidth },
        uFalloff: { value: falloff },
        uBoostStrength: { value: boostStrength / 100 },
        uCrossfadeWidth: { value: 0.05 },
        uMobile: { value: 0.0 },
      };

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
        transparent: true,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      scene.add(plane);

      // The wave has to outrun the far corner before the swap is complete.
      function maxCornerDist() {
        const ratio = root!.clientHeight / root!.clientWidth;
        return Math.sqrt(0.25 + 0.25 * ratio * ratio);
      }

      function handleResize() {
        const width = root!.clientWidth;
        const height = root!.clientHeight;
        renderer.setSize(width, height, false);
        uniforms.uResolution.value.set(width, height);
        // Boxed previews are narrow, so the reference's mobile framing kicks in
        // off the container rather than the window.
        uniforms.uMobile.value = width <= 1000 ? 1.0 : 0.0;
        rippleConfig.endValue = maxCornerDist() + rippleConfig.waveWidth;
        rippleConfig.duration = (width <= 1000 ? 1.5 : 3.0) / rate;
      }
      handleResize();
      const ro = new ResizeObserver(handleResize);
      ro.observe(root);

      let current = 0;
      let isTransitioning = false;
      let rippleTween: gsap.core.Tween | null = null;

      advanceRef.current = () => {
        if (isTransitioning) return;
        isTransitioning = true;

        if (rippleTween) {
          rippleTween.kill();
          uniforms.uProgress.value = 0.0;
          rippleTween = null;
        }

        const next = (current + 1) % textures.length;
        uniforms.uTexCurrent.value = textures[current];
        uniforms.uTexNext.value = textures[next];
        uniforms.uProgress.value = 0.0;

        // Characters leave one after another, then the swap re-splits the new
        // text and brings it back in behind the wave front.
        const split = splitsRef.current;
        if (split) {
          const exit = gsap.timeline({ onComplete: () => setIndex(next) });
          exit.to(split.chars, {
            yPercent: -100,
            duration: 0.6 / rate,
            stagger: 0.02 / rate,
            ease: "power2.inOut",
          });
          exit.to(
            split.lines,
            { yPercent: -100, duration: 0.6 / rate, stagger: 0.02 / rate, ease: "power2.inOut" },
            0.1 / rate,
          );
        } else {
          setIndex(next);
        }

        let unlocked = false;
        rippleTween = gsap.to(uniforms.uProgress, {
          value: rippleConfig.endValue,
          duration: rippleConfig.duration,
          ease: rippleConfig.ease,
          delay: 0.3 / rate,
          onUpdate() {
            // Re-arm early so a quick second click still feels responsive.
            if (!unlocked && uniforms.uProgress.value > 0.7) {
              unlocked = true;
              current = next;
              isTransitioning = false;
            }
          },
          onComplete() {
            uniforms.uTexCurrent.value = textures[current];
            uniforms.uProgress.value = 0.0;
            rippleTween = null;
            if (!unlocked) {
              current = next;
              isTransitioning = false;
            }
          },
        });
      };

      let raf = 0;
      const render = () => {
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        rippleTween?.kill();
        advanceRef.current = null;
        for (const t of textures) t.dispose();
        material.dispose();
        plane.geometry.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [images, waveFrequency, waveStrength, waveWidth, falloff, boostStrength, speed]);

  return (
    <div
      ref={rootRef}
      onClick={() => advanceRef.current?.()}
      className="relative w-full h-full overflow-hidden cursor-pointer"
      style={{ isolation: "isolate", background, fontFamily, containerType: "inline-size" }}
    >
      <div ref={canvasHostRef} className="absolute inset-0" />

      {/* Difference blending is what makes the type read against any frame. */}
      <div
        className="absolute inset-0 z-[2] select-none pointer-events-none text-white"
        style={{ mixBlendMode: "difference" }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-12 w-max overflow-hidden">
          <h1
            ref={titleRef}
            className="font-medium leading-[1.25] tracking-[-0.02em] will-change-transform"
            style={{ fontSize: `clamp(calc(1.25rem * ${scale}), calc(4cqw * ${scale}), calc(6rem * ${scale}))` }}
          >
            {titles[index % titles.length]}
          </h1>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-12 w-[15%] min-w-[220px] overflow-hidden">
          <p
            ref={descRef}
            className="font-medium will-change-transform"
            style={{ fontSize: `calc(0.85rem * ${scale})` }}
          >
            {descriptions[index % descriptions.length]}
          </p>
        </div>
      </div>
    </div>
  );
}
