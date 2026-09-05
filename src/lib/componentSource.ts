import { readFile } from "node:fs/promises";
import path from "node:path";
import { ORIGINALS, getOriginal } from "./originalControls";
import { sourceFileFor } from "./originalSources";
import { ORIGINAL_SOURCE_FILES } from "./originalSources";
import type { ControlDef } from "./controls";
import type { Params } from "./effects";

export type ComponentSource = {
  slug: string;
  name: string;
  category: string;
  description: string;
  fileName: string;
  code: string;
  props: {
    key: string;
    type: string;
    default: unknown;
    description: string;
  }[];
  dependencies: string[];
  assets: string[];
};

const ORIGINALS_DIR = path.join(process.cwd(), "src", "components", "originals");

/** Slugs that have a source file on disk. */
export function listComponentSlugs(): string[] {
  return ORIGINALS.filter((o) => o.key in ORIGINAL_SOURCE_FILES).map((o) => o.key);
}

/** npm packages a component imports, so users know what to install. */
function detectDependencies(code: string): string[] {
  const deps = new Set<string>();
  const add = (spec: string) => {
    if (spec.startsWith(".") || spec.startsWith("@/") || spec.startsWith("node:")) return;
    // "gsap/SplitText" -> "gsap"; "@scope/pkg/sub" -> "@scope/pkg"
    const parts = spec.split("/");
    deps.add(spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]);
  };
  for (const m of code.matchAll(/from\s+"([^".][^"]*)"/g)) add(m[1]);
  // Heavy libraries are loaded with a dynamic import so they stay out of the
  // initial bundle; those are still real dependencies to install.
  for (const m of code.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) add(m[1]);
  deps.delete("react");
  return [...deps].sort();
}

const ASSET_RE = /^\/[a-z0-9][a-z0-9._/-]*\.(?:jpg|jpeg|png|svg|webp|mp4|webm)$/i;

/** Static asset paths the component references, so users can copy them across. */
function detectAssets(code: string, controls: ControlDef[]): string[] {
  const assets = new Set<string>();
  for (const m of code.matchAll(/["'`](\/[a-z0-9][a-z0-9._/-]*\.(?:jpg|jpeg|png|svg|webp|mp4|webm))["'`]/gi)) {
    assets.add(m[1]);
  }

  // A component that builds its paths in a loop (`/dir/img${i}.jpg`) exposes no
  // literal to match, but its image controls carry the real list as defaults,
  // so take the exact filenames from there rather than emitting a wildcard the
  // CLI cannot expand.
  for (const c of controls) {
    if (c.type !== "image" && c.type !== "imageList") continue;
    const values = Array.isArray(c.default) ? c.default : [c.default];
    for (const v of values) {
      if (typeof v === "string" && ASSET_RE.test(v)) assets.add(v);
    }
  }

  // Anything still only known as a template keeps its directory wildcard.
  for (const m of code.matchAll(/`(\/[a-z0-9-]+)\/[^`]*\$\{[^`]*`/gi)) {
    const dir = m[1];
    if (![...assets].some((a) => a.startsWith(`${dir}/`))) assets.add(`${dir}/*`);
  }
  return [...assets].sort();
}

/**
 * Merges caller-supplied prop overrides onto a component's defaults, validated
 * against its real control schema, clamping numbers into range, coercing
 * types, and dropping anything that isn't an actual prop of this component
 * rather than silently accepting it. Used by the MCP `get_component` tool so
 * an agent can ask for a component pre-configured instead of always getting
 * the generic defaults.
 */
export function mergeCustomProps(
  controls: ControlDef[],
  overrides: Record<string, unknown>,
): { values: Params; warnings: string[] } {
  const values: Params = {};
  for (const c of controls) values[c.key] = c.default;

  const byKey = new Map(controls.map((c) => [c.key, c]));
  const warnings: string[] = [];

  for (const [key, raw] of Object.entries(overrides)) {
    const def = byKey.get(key);
    if (!def) {
      warnings.push(`Unknown prop "${key}" ignored. Not part of this component.`);
      continue;
    }
    if (def.type === "slider" || def.type === "fontScale") {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        warnings.push(`"${key}" expects a number, kept default (${def.default}).`);
        continue;
      }
      values[key] = Math.min(def.max, Math.max(def.min, n));
    } else if (def.type === "toggle") {
      values[key] = Boolean(raw);
    } else if (def.type === "imageList" || def.type === "textList") {
      if (!Array.isArray(raw)) {
        warnings.push(`"${key}" expects an array of strings, kept default.`);
        continue;
      }
      values[key] = raw.map(String);
    } else {
      // color / text / image / font / select: all plain strings.
      values[key] = String(raw);
    }
  }

  return { values, warnings };
}

/**
 * Turns the component's detected/declared asset paths into fetchable URLs
 * against the given origin, so an agent with shell access can pull the real
 * files into a fresh project instead of leaving broken image paths behind.
 * Assets whose path could only be inferred as a wildcard (built from a
 * template literal, e.g. numbered sequences) are reported separately since
 * there's no reliable way to enumerate the exact file list from source alone.
 */
export function buildAssetLinks(source: ComponentSource, origin: string) {
  const files = source.assets
    .filter((a) => !a.endsWith("/*"))
    .map((p) => ({ path: p, url: `${origin}${p}` }));
  const patterns = source.assets.filter((a) => a.endsWith("/*"));
  return { files, patterns };
}

export async function getComponentSource(slug: string): Promise<ComponentSource | null> {
  const entry = getOriginal(slug);
  const file = sourceFileFor(slug);
  if (!entry || !file) return null;

  let code: string;
  try {
    code = await readFile(path.join(ORIGINALS_DIR, `${file}.tsx`), "utf8");
  } catch {
    return null;
  }

  return {
    slug,
    name: entry.name,
    category: entry.category,
    description: entry.blurb,
    fileName: `${file}.tsx`,
    code,
    props: entry.controls.map((c) => ({
      key: c.key,
      type: c.type,
      default: c.default,
      description: c.description ?? c.label,
    })),
    dependencies: detectDependencies(code),
    assets: detectAssets(code, entry.controls),
  };
}
