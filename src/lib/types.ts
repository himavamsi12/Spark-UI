import type { EffectMode } from "./effects";

export type ComponentEntry = {
  slug: string;
  name: string;
  category: string;
  effect: EffectMode;
  seed: number;
  palette: [string, string];
  views: number;
  viewsLabel: string;
  copies: number;
  addedRank: number;
  poster: string | null;
  video: string | null;
  source?: "originkit" | "original";
};

export const CATEGORY_ORDER = ["Navigation", "Gallery", "Animations", "Text", "Background"] as const;

export type SortKey = "trending" | "recent" | "copied" | "recommended";
