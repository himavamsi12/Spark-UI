import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync("src/data/components-raw.json", "utf8"));
const media = JSON.parse(fs.readFileSync("src/data/media-map.json", "utf8"));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function parseViews(v) {
  if (!v) return 0;
  const m = v.trim().match(/^([\d.]+)(k)?$/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2] ? Math.round(n * 1000) : Math.round(n);
}

// keyword -> effect mode, checked in order against slug+name
const KEYWORD_RULES = [
  [/glob|sphere|orbit|planet|saturn|dome|phyllotaxis/i, "orbit"],
  [/star|glitter|sparkle|warp|constellation|firefly|dust/i, "starfield"],
  [/ink|flow|silk|satin|ribbon|wave|connectivity|smoke|liquid-line/i, "flow"],
  [/grid|mesh|pixel|dither|kinetic|dot-|checker/i, "grid"],
  [/tunnel|radial|burst|prism|blast|explosion/i, "tunnel"],
  [/liquid|juice|goo|glass|frost|whorl|melt|wax/i, "liquid"],
  [/snow|rain|defense|character-wave|weather/i, "snow"],
  [/carousel|gallery|coverflow|spin|stack|flipper|fold/i, "carousel"],
  [/button/i, "button"],
  [/border/i, "border"],
  [/cursor/i, "cursor"],
  [/loader|spinner|progress/i, "loader"],
];

const CATEGORY_DEFAULT = {
  "Image Gallery": "carousel",
  "Interactive Elements": "grid",
  Animations: "tunnel",
  Background: "grid",
  Games: "game",
  Text: "text",
  Button: "button",
  Border: "border",
  Image: "carousel",
  Cursor: "cursor",
  Loader: "loader",
};

const PALETTES = [
  ["#22d3ee", "#0891b2"],
  ["#a855f7", "#7c3aed"],
  ["#f97316", "#ea580c"],
  ["#eab308", "#ca8a04"],
  ["#22c55e", "#15803d"],
  ["#ec4899", "#be185d"],
  ["#38bdf8", "#2563eb"],
  ["#f43f5e", "#be123c"],
  ["#94a3b8", "#475569"],
];

function pickEffect(slug, name, category) {
  const text = `${slug} ${name}`;
  for (const [re, mode] of KEYWORD_RULES) {
    if (re.test(text)) return mode;
  }
  if (category === "Text") return "text";
  if (category === "Games") return "game";
  return CATEGORY_DEFAULT[category] || "grid";
}

const out = raw.map((c, i) => {
  const h = hash(c.slug);
  const category = c.categories[0] || "Background";
  const effect = pickEffect(c.slug, c.name, category);
  const palette = PALETTES[h % PALETTES.length];
  const views = parseViews(c.views);
  const copies = Math.round(views * (0.15 + (h % 40) / 100));
  const m = media[c.slug] || {};
  return {
    slug: c.slug,
    name: c.name,
    category,
    effect,
    seed: h,
    palette,
    views,
    viewsLabel: c.views || "0",
    copies,
    addedRank: (h % 200), // used for "recently added" ordering
    poster: m.poster || null,
    video: m.video || null,
  };
});

fs.writeFileSync("src/data/components.json", JSON.stringify(out, null, 2));
console.log("wrote", out.length, "components");

const byCat = {};
for (const c of out) byCat[c.category] = (byCat[c.category] || 0) + 1;
console.log(byCat);
