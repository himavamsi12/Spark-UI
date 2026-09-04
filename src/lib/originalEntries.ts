import { ORIGINALS } from "./originalControls";
import { ORIGINAL_COMPONENTS } from "@/components/originals";
import type { ComponentEntry } from "./types";

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildOriginalEntries(): ComponentEntry[] {
  return ORIGINALS.filter((o) => o.key in ORIGINAL_COMPONENTS).map((o, i) => {
    const h = hash(o.key);
    const firstColor = o.controls.find((c) => c.type === "color");
    const color = firstColor && firstColor.type === "color" ? firstColor.default : "#22d3ee";
    return {
      slug: o.key,
      name: o.name,
      category: o.category,
      effect: "text",
      seed: h,
      palette: [color, color],
      views: 20 + (h % 400),
      viewsLabel: "",
      copies: 5 + (h % 100),
      addedRank: 1000 + i,
      poster: null,
      video: null,
      source: "original",
    };
  });
}
