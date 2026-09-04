import type { EffectMode, Params } from "./effects";

export type ControlDef =
  | { key: string; label: string; type: "color"; default: string; description?: string }
  | {
      key: string;
      label: string;
      type: "slider";
      default: number;
      min: number;
      max: number;
      step: number;
      unit?: string;
      description?: string;
    }
  | {
      key: string;
      label: string;
      type: "select";
      default: string;
      options: { label: string; value: string }[];
      description?: string;
    }
  | { key: string; label: string; type: "toggle"; default: boolean; description?: string }
  | {
      key: string;
      label: string;
      type: "text";
      default: string;
      placeholder?: string;
      multiline?: boolean;
      description?: string;
    }
  // A single image slot. The value is any src the browser can load: a bundled
  // path, a remote URL, or a data: URL produced by the panel's file picker.
  | { key: string; label: string; type: "image"; default: string; description?: string }
  // An ordered list of image slots, for components built around a set of images.
  | {
      key: string;
      label: string;
      type: "imageList";
      default: string[];
      max?: number;
      description?: string;
    }
  // An ordered list of short text strings: nav labels, page names, etc.
  | {
      key: string;
      label: string;
      type: "textList";
      default: string[];
      max?: number;
      description?: string;
    }
  // Font family, picked from the site's loaded webfonts.
  | { key: string; label: string; type: "font"; default: string; description?: string }
  // A relative scale (%) applied to every font-size in the component, rather
  // than one absolute px value per text element.
  | {
      key: string;
      label: string;
      type: "fontScale";
      default: number;
      min: number;
      max: number;
      step: number;
      description?: string;
    };

// Fonts bundled by the site (see src/app/layout.tsx) that a component's text
// can be switched to. Value is the CSS variable each next/font instance sets.
export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Inter", value: "var(--font-inter)" },
  { label: "Inter Tight", value: "var(--font-display)" },
  { label: "Barlow Condensed", value: "var(--font-barlow-condensed)" },
  { label: "Instrument Sans", value: "var(--font-instrument-sans)" },
  { label: "Instrument Serif", value: "var(--font-instrument-serif)" },
  { label: "DM Sans", value: "var(--font-dm-sans)" },
  { label: "DM Mono", value: "var(--font-dm-mono)" },
  { label: "DM Serif Display", value: "var(--font-dm-serif-display)" },
  { label: "Plus Jakarta Sans", value: "var(--font-plus-jakarta-sans)" },
  { label: "Gasoek One", value: "var(--font-gasoek-one)" },
  { label: "Host Grotesk", value: "var(--font-host-grotesk)" },
  { label: "Nanum Pen Script", value: "var(--font-nanum-pen-script)" },
  { label: "JetBrains Mono", value: "var(--font-commit-mono)" },
];

const CONTROL_SCHEMAS: Record<EffectMode, ControlDef[]> = {
  orbit: [
    { key: "dotColor", label: "Dots", type: "color", default: "#ffffff" },
    { key: "cageColor", label: "Cage", type: "color", default: "#26ff00" },
    { key: "density", label: "Density", type: "slider", default: 90, min: 20, max: 220, step: 5 },
    { key: "spin", label: "Spin", type: "slider", default: 20, min: 0, max: 60, step: 1 },
    {
      key: "direction",
      label: "Direction",
      type: "select",
      default: "right",
      options: [
        { label: "Right", value: "right" },
        { label: "Left", value: "left" },
      ],
    },
    { key: "size", label: "Size (%)", type: "slider", default: 100, min: 50, max: 150, step: 5 },
  ],
  starfield: [
    { key: "color", label: "Color", type: "color", default: "#22d3ee" },
    { key: "density", label: "Density", type: "slider", default: 140, min: 40, max: 320, step: 10 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 20, max: 250, step: 5 },
    { key: "streak", label: "Streak Length", type: "slider", default: 30, min: 4, max: 60, step: 2 },
  ],
  flow: [
    { key: "colorA", label: "Color A", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Color B", type: "color", default: "#0891b2" },
    { key: "amplitude", label: "Amplitude", type: "slider", default: 100, min: 20, max: 200, step: 5 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 10, max: 250, step: 5 },
    { key: "lines", label: "Line Count", type: "slider", default: 5, min: 2, max: 9, step: 1 },
  ],
  grid: [
    { key: "colorA", label: "Bright", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Dim", type: "color", default: "#0891b2" },
    { key: "cellSize", label: "Cell Size", type: "slider", default: 22, min: 10, max: 44, step: 2 },
    { key: "speed", label: "Wave Speed", type: "slider", default: 100, min: 10, max: 250, step: 5 },
    { key: "threshold", label: "Density", type: "slider", default: 35, min: 0, max: 80, step: 5 },
  ],
  tunnel: [
    { key: "colorA", label: "Color A", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Color B", type: "color", default: "#0891b2" },
    { key: "spokes", label: "Spokes", type: "slider", default: 40, min: 8, max: 90, step: 2 },
    { key: "density", label: "Particles/Spoke", type: "slider", default: 3, min: 1, max: 6, step: 1 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 10, max: 250, step: 5 },
  ],
  liquid: [
    { key: "colorA", label: "Color A", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Color B", type: "color", default: "#0891b2" },
    { key: "blobs", label: "Blobs", type: "slider", default: 5, min: 2, max: 10, step: 1 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 10, max: 250, step: 5 },
    { key: "blur", label: "Blur (px)", type: "slider", default: 8, min: 0, max: 24, step: 1 },
  ],
  snow: [
    { key: "density", label: "Density", type: "slider", default: 90, min: 20, max: 220, step: 10 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 20, max: 250, step: 5 },
    { key: "size", label: "Size", type: "slider", default: 2, min: 1, max: 5, step: 0.5 },
    { key: "wind", label: "Wind", type: "slider", default: 20, min: 0, max: 60, step: 2 },
  ],
  carousel: [
    { key: "colorA", label: "Color A", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Color B", type: "color", default: "#0891b2" },
    { key: "panels", label: "Panels", type: "slider", default: 6, min: 3, max: 12, step: 1 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 10, max: 250, step: 5 },
  ],
  cursor: [
    { key: "color", label: "Color", type: "color", default: "#22d3ee" },
    { key: "trail", label: "Trail Length", type: "slider", default: 18, min: 4, max: 32, step: 1 },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 20, max: 250, step: 5 },
  ],
  loader: [
    { key: "color", label: "Color", type: "color", default: "#22d3ee" },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 20, max: 300, step: 5 },
    { key: "arc", label: "Arc Length", type: "slider", default: 130, min: 20, max: 180, step: 5 },
  ],
  text: [
    { key: "colorA", label: "Ghost A", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Ghost B", type: "color", default: "#0891b2" },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 20, max: 250, step: 5 },
    { key: "glitch", label: "Glitch", type: "slider", default: 50, min: 0, max: 100, step: 5 },
  ],
  game: [
    { key: "colorA", label: "Ball", type: "color", default: "#22d3ee" },
    { key: "colorB", label: "Paddles", type: "color", default: "#0891b2" },
    { key: "speed", label: "Speed", type: "slider", default: 100, min: 20, max: 250, step: 5 },
  ],
};

export function getControlSchema(effect: EffectMode): ControlDef[] {
  return CONTROL_SCHEMAS[effect];
}

export function defaultParams(effect: EffectMode, palette: [string, string]): Params {
  const schema = getControlSchema(effect);
  const params: Params = {};
  for (const c of schema) {
    if (c.type === "color") {
      // seed color defaults from the assigned palette for the first two color fields
      params[c.key] = c.default;
    } else {
      params[c.key] = c.default;
    }
  }
  // override first two color-type fields with the component's own palette for variety
  const colorKeys = schema.filter((c) => c.type === "color").map((c) => c.key);
  if (colorKeys[0]) params[colorKeys[0]] = palette[0];
  if (colorKeys[1]) params[colorKeys[1]] = palette[1];
  return params;
}
