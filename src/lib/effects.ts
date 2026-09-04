export type EffectMode =
  | "orbit"
  | "starfield"
  | "flow"
  | "grid"
  | "tunnel"
  | "liquid"
  | "snow"
  | "carousel"
  | "cursor"
  | "loader"
  | "text"
  | "game";

export type ParamValue = number | string | boolean | string[];
export type Params = Record<string, ParamValue>;

export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DrawCtx = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number; // seconds
  rand: () => number;
  palette: [string, string];
  label: string;
  params: Params;
};

function num(p: Params, key: string, fallback: number) {
  const v = p[key];
  return typeof v === "number" ? v : fallback;
}
function str(p: Params, key: string, fallback: string) {
  const v = p[key];
  return typeof v === "string" ? v : fallback;
}

function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
}

function drawOrbit({ ctx, w, h, t, rand, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const dotColor = str(params, "dotColor", palette[0]);
  const cageColor = str(params, "cageColor", palette[1]);
  const density = num(params, "density", 90);
  const spin = num(params, "spin", 20) / 100; // 0..1
  const dir = str(params, "direction", "right") === "left" ? -1 : 1;
  const size = num(params, "size", 100) / 100;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32 * size;
  const n = Math.round(density);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const seedA = rand() * Math.PI * 2;
    const seedB = rand() * Math.PI * 2;
    const pspeed = 0.15 + rand() * 0.2;
    const theta = seedA + t * pspeed * spin * 3 * dir;
    const phi = seedB;
    const x = Math.cos(theta) * Math.cos(phi);
    const y = Math.sin(phi);
    const z = Math.sin(theta) * Math.cos(phi);
    const scale = (z + 1.4) / 2.4;
    const px = cx + x * r;
    const py = cy + y * r;
    const sz = 1 + scale * 1.8;
    ctx.globalAlpha = 0.35 + scale * 0.6;
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = cageColor;
  ctx.lineWidth = 0.6;
  for (let lat = -2; lat <= 2; lat++) {
    ctx.beginPath();
    for (let a = 0; a <= 63; a++) {
      const ang = (a / 63) * Math.PI * 2 + t * 0.1 * spin * 3 * dir;
      const yy = (lat / 3) * r;
      const rr = Math.sqrt(Math.max(0, r * r - yy * yy));
      const x = cx + Math.cos(ang) * rr;
      const y = cy + yy + Math.sin(ang) * rr * 0.15;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawStarfield({ ctx, w, h, t, rand, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const color = str(params, "color", palette[0]);
  const density = num(params, "density", 140);
  const speed = num(params, "speed", 100) / 100;
  const streak = num(params, "streak", 30);
  const cx = w / 2;
  const cy = h / 2;
  const n = Math.round(density);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const angle = rand() * Math.PI * 2;
    const pspeed = (0.3 + rand() * 1.2) * speed;
    const start = rand();
    const dist = ((t * pspeed + start * 6) % 6) / 6;
    const r = dist * Math.max(w, h) * 0.75;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const len = 4 + dist * streak;
    const alpha = Math.sin(dist * Math.PI);
    ctx.strokeStyle = i % 3 === 0 ? color : "#ffffff";
    ctx.globalAlpha = Math.max(0, alpha) * 0.8;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(angle) * len, y - Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFlow({ ctx, w, h, t, rand, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const amplitude = num(params, "amplitude", 100) / 100;
  const speed = num(params, "speed", 100) / 100;
  const lines = Math.round(num(params, "lines", 5));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < lines; i++) {
    const phase = rand() * Math.PI * 2;
    const amp = h * (0.08 + rand() * 0.12) * amplitude;
    const freq = 1.2 + rand() * 1.5;
    const pspeed = 0.3 + rand() * 0.4;
    const yBase = (h / (lines + 1)) * (i + 1);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, i % 2 === 0 ? colorA : colorB);
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + rand() * 2;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y =
        yBase +
        Math.sin(x * 0.02 * freq + t * pspeed * speed * 4 + phase) * amp +
        Math.sin(x * 0.005 + t * 0.5 * speed) * amp * 0.3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrid({ ctx, w, h, t, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const cell = num(params, "cellSize", 22);
  const speed = num(params, "speed", 100) / 100;
  const threshold = num(params, "threshold", 35) / 100;
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const cx = cols / 2;
  const cy = rows / 2;
  ctx.save();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const wave = Math.sin(d * 0.5 - t * 2.2 * speed);
      const s = (wave + 1) / 2;
      if (s < threshold) continue;
      ctx.globalAlpha = s * 0.8;
      ctx.fillStyle = s > 0.75 ? colorA : colorB;
      const size = 2 + s * 4;
      ctx.fillRect(x * cell + cell / 2 - size / 2, y * cell + cell / 2 - size / 2, size, size);
    }
  }
  ctx.restore();
}

function drawTunnel({ ctx, w, h, t, rand, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const spokes = Math.round(num(params, "spokes", 40));
  const speed = num(params, "speed", 100) / 100;
  const density = Math.round(num(params, "density", 3));
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let s = 0; s < spokes; s++) {
    const angle = (s / spokes) * Math.PI * 2;
    for (let p = 0; p < density; p++) {
      const off = rand();
      const depth = (t * (0.4 + off * 0.5) * speed + off) % 1;
      const r = depth * Math.max(w, h) * 0.7;
      const alpha = depth;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.fillStyle = p % 2 === 0 ? colorA : colorB;
      ctx.globalAlpha = alpha * 0.9;
      const size = 0.5 + depth * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawLiquid({ ctx, w, h, t, rand, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const blobs = Math.round(num(params, "blobs", 5));
  const speed = num(params, "speed", 100) / 100;
  const blur = num(params, "blur", 8);
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < blobs; i++) {
    const pspeed = (0.2 + rand() * 0.3) * speed;
    const phase = rand() * Math.PI * 2;
    const cx = w / 2 + Math.sin(t * pspeed + phase) * w * 0.25;
    const cy = h / 2 + Math.cos(t * pspeed * 1.3 + phase) * h * 0.25;
    const r = Math.min(w, h) * (0.15 + rand() * 0.12);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, i % 2 === 0 ? colorA : colorB);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSnow({ ctx, w, h, t, rand, params }: DrawCtx) {
  clear(ctx, w, h);
  const density = Math.round(num(params, "density", 90));
  const speed = num(params, "speed", 100) / 100;
  const size = num(params, "size", 2);
  const wind = num(params, "wind", 20);
  ctx.save();
  for (let i = 0; i < density; i++) {
    const pspeed = (0.15 + rand() * 0.3) * speed;
    const xseed = rand();
    const sway = rand() * wind;
    const y = ((t * pspeed * 100 + rand() * h) % (h + 20)) - 10;
    const x = xseed * w + Math.sin(t * 0.6 + i) * sway;
    const sz = 1 + rand() * size;
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCarousel({ ctx, w, h, t, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const n = Math.round(num(params, "panels", 6));
  const speed = num(params, "speed", 100) / 100;
  const cx = w / 2;
  const cy = h / 2;
  const cardW = w * 0.22;
  const cardH = h * 0.55;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + t * 0.4 * speed;
    const depth = Math.cos(angle);
    const x = cx + Math.sin(angle) * w * 0.32;
    const scale = 0.6 + ((depth + 1) / 2) * 0.5;
    ctx.globalAlpha = 0.4 + ((depth + 1) / 2) * 0.6;
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    roundRect(ctx, x - (cardW * scale) / 2, cy - (cardH * scale) / 2, cardW * scale, cardH * scale, 6);
    ctx.fill();
  }
  ctx.restore();
}

function drawCursor({ ctx, w, h, t, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const color = str(params, "color", palette[0]);
  const trail = Math.round(num(params, "trail", 18));
  const speed = num(params, "speed", 100) / 100;
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  for (let i = 0; i < trail; i++) {
    const tt = t * speed - i * 0.03;
    const x = cx + Math.sin(tt * 1.3) * w * 0.28;
    const y = cy + Math.sin(tt * 2.1) * h * 0.28;
    ctx.globalAlpha = (1 - i / trail) * 0.6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5 - (i / trail) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const x = cx + Math.sin(t * speed * 1.3) * w * 0.28;
  const y = cy + Math.sin(t * speed * 2.1) * h * 0.28;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 9, y + 12);
  ctx.lineTo(x + 4, y + 12);
  ctx.lineTo(x + 6, y + 18);
  ctx.lineTo(x + 3, y + 19);
  ctx.lineTo(x + 1, y + 13);
  ctx.lineTo(x - 4, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLoader({ ctx, w, h, t, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const color = str(params, "color", palette[0]);
  const speed = num(params, "speed", 100) / 100;
  const arc = num(params, "arc", 130) / 100;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.16;
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(1, color);
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, t * 3 * speed, t * 3 * speed + Math.PI * arc);
  ctx.stroke();
  ctx.restore();
}

function drawText({ ctx, w, h, t, rand, palette, label, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const speed = num(params, "speed", 100) / 100;
  const glitchAmt = num(params, "glitch", 50) / 100;
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = Math.max(14, Math.min(30, w / (label.length * 0.62)));
  ctx.font = `700 ${size}px ui-sans-serif, system-ui`;
  const glitch = Math.sin(t * 8 * speed) > 1 - glitchAmt * 0.6 ? (rand() - 0.5) * 6 * glitchAmt : 0;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = colorA;
  ctx.fillText(label, cx + glitch + 1.5, cy);
  ctx.fillStyle = colorB;
  ctx.fillText(label, cx - glitch - 1.5, cy);

  ctx.globalAlpha = 1;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  const sweep = (Math.sin(t * 1.4 * speed) + 1) / 2;
  grad.addColorStop(Math.max(0, sweep - 0.2), "#888");
  grad.addColorStop(sweep, "#fff");
  grad.addColorStop(Math.min(1, sweep + 0.2), "#888");
  ctx.fillStyle = grad;
  ctx.fillText(label, cx, cy);
  ctx.restore();
}

function drawGame({ ctx, w, h, t, palette, params }: DrawCtx) {
  clear(ctx, w, h);
  const colorA = str(params, "colorA", palette[0]);
  const colorB = str(params, "colorB", palette[1]);
  const speed = num(params, "speed", 100) / 100;
  ctx.save();
  ctx.strokeStyle = "#333";
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  const bx = (Math.sin(t * 1.7 * speed) + 1) / 2;
  const by = (Math.sin(t * 2.3 * speed + 1) + 1) / 2;
  const x = 20 + bx * (w - 40);
  const y = 20 + by * (h - 40);
  ctx.fillStyle = colorA;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();

  const paddleH = h * 0.22;
  const leftY = h / 2 + Math.sin(t * 1.5 * speed) * (h * 0.25) - paddleH / 2;
  const rightY = h / 2 + Math.cos(t * 1.2 * speed) * (h * 0.25) - paddleH / 2;
  ctx.fillStyle = colorB;
  ctx.fillRect(10, leftY, 5, paddleH);
  ctx.fillRect(w - 15, rightY, 5, paddleH);
  ctx.restore();
}

const RENDERERS: Record<EffectMode, (d: DrawCtx) => void> = {
  orbit: drawOrbit,
  starfield: drawStarfield,
  flow: drawFlow,
  grid: drawGrid,
  tunnel: drawTunnel,
  liquid: drawLiquid,
  snow: drawSnow,
  carousel: drawCarousel,
  cursor: drawCursor,
  loader: drawLoader,
  text: drawText,
  game: drawGame,
};

export function renderEffect(d: DrawCtx & { effect: EffectMode }) {
  const fn = RENDERERS[d.effect] || drawGrid;
  fn(d);
}
