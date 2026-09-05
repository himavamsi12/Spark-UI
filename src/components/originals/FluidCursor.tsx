"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A GPU fluid solver: velocity is advected, made incompressible by a pressure
 * solve, and used to carry dye that the display pass thresholds into ink.
 * Shaders are kept terse, as in the reference.
 */
const VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.); }`;
const P = `precision highp float;`;
const S = `precision mediump sampler2D;`;

const SHADERS: Record<string, [string, string]> = {
  splat: [VERT, `${P} ${S}
    uniform sampler2D uTarget; uniform float aspectRatio,radius; uniform vec3 color; uniform vec2 point; varying vec2 vUv;
    void main(){ vec2 p=vUv-point; p.x*=aspectRatio; gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+exp(-dot(p,p)/radius)*color,1.); }`],
  advection: [VERT, `${P} ${S}
    uniform sampler2D uVelocity,uSource; uniform vec2 texelSize; uniform float dt,dissipation; varying vec2 vUv;
    void main(){ gl_FragColor=vec4(dissipation*texture2D(uSource,vUv-dt*texture2D(uVelocity,vUv).xy*texelSize).rgb,1.); }`],
  divergence: [VERT, `${P} ${S}
    uniform sampler2D uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    vec2 vel(vec2 uv){ vec2 e=vec2(1.); if(uv.x<0.){uv.x=0.;e.x=-1.;} if(uv.x>1.){uv.x=1.;e.x=-1.;} if(uv.y<0.){uv.y=0.;e.y=-1.;} if(uv.y>1.){uv.y=1.;e.y=-1.;} return e*texture2D(uVelocity,uv).xy; }
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); gl_FragColor=vec4(.5*(vel(R).x-vel(L).x+vel(T).y-vel(B).y),0.,0.,1.); }`],
  curl: [VERT, `${P} ${S}
    uniform sampler2D uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); gl_FragColor=vec4(texture2D(uVelocity,R).y-texture2D(uVelocity,L).y-texture2D(uVelocity,T).x+texture2D(uVelocity,B).x,0.,0.,1.); }`],
  vorticity: [VERT, `${P} ${S}
    uniform sampler2D uVelocity,uCurl; uniform vec2 texelSize; uniform float curlStrength,dt; varying vec2 vUv;
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); vec2 f=normalize(vec2(abs(texture2D(uCurl,T).x)-abs(texture2D(uCurl,B).x),abs(texture2D(uCurl,R).x)-abs(texture2D(uCurl,L).x))+.0001)*curlStrength*texture2D(uCurl,vUv).x; gl_FragColor=vec4(texture2D(uVelocity,vUv).xy+f*dt,0.,1.); }`],
  pressure: [VERT, `${P} ${S}
    uniform sampler2D uPressure,uDivergence; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ vec2 L=clamp(vUv-vec2(texelSize.x,0.),0.,1.),R=clamp(vUv+vec2(texelSize.x,0.),0.,1.),T=clamp(vUv+vec2(0.,texelSize.y),0.,1.),B=clamp(vUv-vec2(0.,texelSize.y),0.,1.); gl_FragColor=vec4((texture2D(uPressure,L).x+texture2D(uPressure,R).x+texture2D(uPressure,T).x+texture2D(uPressure,B).x-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.); }`],
  gradientSubtract: [VERT, `${P} ${S}
    uniform sampler2D uPressure,uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ float pL=texture2D(uPressure,clamp(vUv-vec2(texelSize.x,0.),0.,1.)).x,pR=texture2D(uPressure,clamp(vUv+vec2(texelSize.x,0.),0.,1.)).x,pT=texture2D(uPressure,clamp(vUv+vec2(0.,texelSize.y),0.,1.)).x,pB=texture2D(uPressure,clamp(vUv-vec2(0.,texelSize.y),0.,1.)).x; gl_FragColor=vec4(texture2D(uVelocity,vUv).xy-vec2(pR-pL,pT-pB),0.,1.); }`],
  clear: [VERT, `${P} ${S}
    uniform sampler2D uTexture; uniform float value; varying vec2 vUv;
    void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }`],
  display: [VERT, `${P}
    uniform sampler2D uTexture; uniform float threshold,edgeSoftness; uniform vec3 inkColor; varying vec2 vUv;
    void main(){ float d=clamp(length(texture2D(uTexture,vUv).rgb),0.,1.); float a=edgeSoftness>0.?smoothstep(threshold-edgeSoftness*.5,threshold+edgeSoftness*.5,d):step(threshold,d); gl_FragColor=vec4(inkColor,a); }`],
};

export default function FluidCursor({
  lines = ["Fluid System In", "Constant Field", "Of Interaction"],
  brand = "Vortex",
  navItems = ["works", "about", "updates", "start a project"],
  background = "#0f0f0f",
  textColor = "#f2f0e6",
  inkColor = "#ffffff",
  simResolution = 256,
  dyeResolution = 1024,
  curl = 50,
  splatRadius = 30,
  forceStrength = 85,
  threshold = 100,
  edgeSoftness = 0,
  fontFamily = "var(--font-instrument-serif), serif",
  textScale = 100,
}: {
  lines?: string[];
  brand?: string;
  navItems?: string[];
  background?: string;
  textColor?: string;
  inkColor?: string;
  simResolution?: number;
  dyeResolution?: number;
  curl?: number;
  splatRadius?: number;
  forceStrength?: number;
  threshold?: number;
  edgeSoftness?: number;
  fontFamily?: string;
  textScale?: number;
}) {
  const scale = textScale / 100;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const cfg = {
      simResolution: Math.max(64, Math.round(simResolution)),
      dyeResolution: Math.max(128, Math.round(dyeResolution)),
      curl,
      pressureIterations: 40,
      velocityDissipation: 0.95,
      dyeDissipation: 0.95,
      splatRadius: splatRadius / 100,
      forceStrength: forceStrength / 10,
      pressureDecay: 0.75,
      threshold: threshold / 100,
      edgeSoftness: edgeSoftness / 100,
      inkColor: new THREE.Color(inkColor),
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    } catch {
      return; // no WebGL available
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const dpr = renderer.getPixelRatio();
    let width = root.clientWidth * dpr;
    let height = root.clientHeight * dpr;
    renderer.setSize(root.clientWidth, root.clientHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    scene.add(quad);

    const options = { type: THREE.HalfFloatType, depthBuffer: false };
    const single = (w: number, h: number) => new THREE.WebGLRenderTarget(w, h, options);
    const double = (w: number, h: number) => ({
      read: single(w, h),
      write: single(w, h),
      swap() {
        [this.read, this.write] = [this.write, this.read];
      },
    });

    const aspect = width / height;
    const simSize = { w: cfg.simResolution, h: Math.round(cfg.simResolution / aspect) };
    const dyeSize = { w: cfg.dyeResolution, h: Math.round(cfg.dyeResolution / aspect) };

    const velocity = double(simSize.w, simSize.h);
    const dye = double(dyeSize.w, dyeSize.h);
    const divergence = single(simSize.w, simSize.h);
    const curlTarget = single(simSize.w, simSize.h);
    const pressure = double(simSize.w, simSize.h);

    const make = (name: string, uniforms: Record<string, { value: unknown }>) =>
      new THREE.ShaderMaterial({
        vertexShader: SHADERS[name][0],
        fragmentShader: SHADERS[name][1],
        uniforms: uniforms as never,
      });

    const tex = () => ({ value: null });
    const num = (v = 0) => ({ value: v });
    const v2 = () => ({ value: new THREE.Vector2() });

    const m = {
      splat: make("splat", { uTarget: tex(), aspectRatio: num(), radius: num(), color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() } }),
      advection: make("advection", { uVelocity: tex(), uSource: tex(), texelSize: v2(), dt: num(), dissipation: num() }),
      divergence: make("divergence", { uVelocity: tex(), texelSize: v2() }),
      curl: make("curl", { uVelocity: tex(), texelSize: v2() }),
      vorticity: make("vorticity", { uVelocity: tex(), uCurl: tex(), texelSize: v2(), curlStrength: num(), dt: num() }),
      pressure: make("pressure", { uPressure: tex(), uDivergence: tex(), texelSize: v2() }),
      gradientSubtract: make("gradientSubtract", { uPressure: tex(), uVelocity: tex(), texelSize: v2() }),
      clear: make("clear", { uTexture: tex(), value: num() }),
      display: make("display", { uTexture: tex(), threshold: num(), edgeSoftness: num(), inkColor: { value: new THREE.Color() } }),
    };

    const pass = (mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => {
      quad.material = mat;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    };
    const set = (mat: THREE.ShaderMaterial, values: Record<string, unknown>) => {
      for (const [k, val] of Object.entries(values)) mat.uniforms[k].value = val;
      return mat;
    };

    const mouse = { x: 0, y: 0, vx: 0, vy: 0, moved: false };
    const onMove = (clientX: number, clientY: number) => {
      const r = root.getBoundingClientRect();
      const x = (clientX - r.left) * dpr;
      const y = (clientY - r.top) * dpr;
      mouse.vx = (x - mouse.x) * cfg.forceStrength;
      mouse.vy = (y - mouse.y) * cfg.forceStrength;
      mouse.x = x;
      mouse.y = y;
      mouse.moved = true;
    };
    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY);
    root.addEventListener("mousemove", onMouse);
    root.addEventListener("touchmove", onTouch, { passive: true });

    // Injects velocity and dye at the cursor, the only place energy enters.
    function splat(x: number, y: number, vx: number, vy: number) {
      set(m.splat, {
        aspectRatio: width / height,
        point: new THREE.Vector2(x / width, 1 - y / height),
        radius: cfg.splatRadius / 100,
      });
      set(m.splat, { uTarget: velocity.read.texture, color: new THREE.Vector3(vx, -vy, 0) });
      pass(m.splat, velocity.write);
      velocity.swap();
      set(m.splat, { uTarget: dye.read.texture, color: new THREE.Vector3(3, 3, 3) });
      pass(m.splat, dye.write);
      dye.swap();
    }

    function simulate(dt: number) {
      const simTexel = new THREE.Vector2(1 / simSize.w, 1 / simSize.h);

      pass(set(m.curl, { uVelocity: velocity.read.texture, texelSize: simTexel }), curlTarget);
      pass(set(m.vorticity, { uVelocity: velocity.read.texture, uCurl: curlTarget.texture, texelSize: simTexel, curlStrength: cfg.curl, dt }), velocity.write);
      velocity.swap();
      pass(set(m.divergence, { uVelocity: velocity.read.texture, texelSize: simTexel }), divergence);
      pass(set(m.clear, { uTexture: pressure.read.texture, value: cfg.pressureDecay }), pressure.write);
      pressure.swap();

      // Jacobi iterations: each pass relaxes the pressure field a little more.
      set(m.pressure, { uDivergence: divergence.texture, texelSize: simTexel });
      for (let i = 0; i < cfg.pressureIterations; i++) {
        m.pressure.uniforms.uPressure.value = pressure.read.texture;
        pass(m.pressure, pressure.write);
        pressure.swap();
      }

      pass(set(m.gradientSubtract, { uPressure: pressure.read.texture, uVelocity: velocity.read.texture, texelSize: simTexel }), velocity.write);
      velocity.swap();

      set(m.advection, { uVelocity: velocity.read.texture, uSource: velocity.read.texture, texelSize: simTexel, dt, dissipation: cfg.velocityDissipation });
      pass(m.advection, velocity.write);
      velocity.swap();

      set(m.advection, { uSource: dye.read.texture, texelSize: new THREE.Vector2(1 / dyeSize.w, 1 / dyeSize.h), dissipation: cfg.dyeDissipation });
      pass(m.advection, dye.write);
      dye.swap();
    }

    let raf = 0;
    let last = Date.now();
    function tick() {
      const dt = Math.min((Date.now() - last) / 1000, 0.016);
      last = Date.now();
      if (mouse.moved) {
        splat(mouse.x, mouse.y, mouse.vx, mouse.vy);
        mouse.moved = false;
      }
      simulate(dt);
      pass(
        set(m.display, {
          uTexture: dye.read.texture,
          threshold: cfg.threshold,
          edgeSoftness: cfg.edgeSoftness,
          inkColor: cfg.inkColor,
        }),
        null,
      );
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      renderer.setSize(root.clientWidth, root.clientHeight, false);
      width = root.clientWidth * dpr;
      height = root.clientHeight * dpr;
    });
    ro.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("mousemove", onMouse);
      root.removeEventListener("touchmove", onTouch);
      for (const t of [velocity.read, velocity.write, dye.read, dye.write, divergence, curlTarget, pressure.read, pressure.write]) t.dispose();
      for (const mat of Object.values(m)) mat.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    };
  }, [
    simResolution,
    dyeResolution,
    curl,
    splatRadius,
    forceStrength,
    threshold,
    edgeSoftness,
    inkColor,
  ]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background, fontFamily, containerType: "inline-size" }}
    >
      <nav
        className="absolute top-0 left-0 w-full flex items-start justify-between p-6 z-[2]"
        style={{ color: textColor, fontSize: `calc(0.8rem * ${scale})` }}
      >
        <span>{brand}</span>
        <div className="flex gap-6">
          {navItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </nav>

      <div
        className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 z-[1] select-none"
        style={{ color: textColor }}
      >
        {lines.map((line, i) => (
          <h1
            key={`${line}-${i}`}
            className="leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: `clamp(calc(1.5rem * ${scale}),calc(7cqw * ${scale}),calc(6rem * ${scale}))` }}
          >
            {line}
          </h1>
        ))}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-[3] pointer-events-none" />
    </div>
  );
}
