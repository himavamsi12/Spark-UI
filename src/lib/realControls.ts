import realControlsRaw from "@/data/real-controls.json";
import { getControlSchema, type ControlDef } from "./controls";
import type { EffectMode, Params } from "./effects";

type RawRow = {
  key: string;
  label: string;
  unit: string;
  type: "slider" | "color" | "select" | "boolean" | "unknown";
  min?: string;
  max?: string;
  value?: string;
  options?: string[];
};

const DATA = realControlsRaw as Record<string, RawRow[]>;

export function getRealRows(slug: string): RawRow[] {
  return (DATA[slug] || []).filter((r) => r.type !== "unknown");
}

function groupByType(schema: ControlDef[]) {
  const map: Record<string, ControlDef[]> = { color: [], slider: [], select: [], toggle: [] };
  for (const c of schema) map[c.type]?.push(c);
  return map;
}

const REAL_TO_GENERIC_TYPE: Record<RawRow["type"], ControlDef["type"] | null> = {
  slider: "slider",
  color: "color",
  select: "select",
  boolean: "toggle",
  unknown: null,
};

/**
 * Builds a display schema using the site's real control labels/ranges/defaults,
 * positionally mapped (by type, in order) onto this effect's internal render keys
 * so the existing canvas renderer keeps working unchanged.
 */
export function buildRealSchema(
  effect: EffectMode,
  slug: string
): { schema: ControlDef[]; initialParams: Params } | null {
  const rows = getRealRows(slug);
  if (rows.length === 0) return null;

  const generic = getControlSchema(effect);
  const genericByType = groupByType(generic);
  const cursors: Record<string, number> = { color: 0, slider: 0, select: 0, toggle: 0 };

  const schema: ControlDef[] = [];
  const initialParams: Params = {};
  let extraIndex = 0;

  for (const row of rows) {
    const genericType = REAL_TO_GENERIC_TYPE[row.type];
    if (!genericType) continue;
    const slot = genericByType[genericType]?.[cursors[genericType]];
    cursors[genericType]++;
    const internalKey = slot ? slot.key : `extra_${genericType}_${extraIndex++}`;
    const label = row.unit ? `${row.label} ${row.unit}` : row.label;

    if (genericType === "color") {
      const hex = row.value ? `#${row.value.slice(0, 6)}` : (slot as { default: string })?.default ?? "#888888";
      schema.push({ key: internalKey, label, type: "color", default: hex });
      initialParams[internalKey] = hex;
    } else if (genericType === "slider") {
      const min = row.min !== undefined ? parseFloat(row.min) : (slot as { min: number })?.min ?? 0;
      const max = row.max !== undefined ? parseFloat(row.max) : (slot as { max: number })?.max ?? 100;
      const value = row.value !== undefined ? parseFloat(row.value) : (slot as { default: number })?.default ?? (min + max) / 2;
      const step = (max - min) / 100 || 1;
      schema.push({ key: internalKey, label, type: "slider", default: value, min, max, step: Number(step.toFixed(3)) });
      initialParams[internalKey] = value;
    } else if (genericType === "select") {
      const genericOptions = (slot as { options: { label: string; value: string }[] })?.options;
      const options =
        row.options && row.options.length > 0
          ? row.options.map((label, i) => ({ label, value: genericOptions?.[i]?.value ?? label }))
          : genericOptions ?? [{ label: row.label, value: "default" }];
      const def = options[0]?.value ?? "default";
      schema.push({ key: internalKey, label, type: "select", default: def, options });
      initialParams[internalKey] = def;
    } else if (genericType === "toggle") {
      const def = (slot as { default: boolean })?.default ?? false;
      schema.push({ key: internalKey, label, type: "toggle", default: def });
      initialParams[internalKey] = def;
    }
  }

  // fill in any generic slots that had no real counterpart, so the renderer still
  // gets sensible values for params it depends on
  for (const c of generic) {
    if (!(c.key in initialParams)) initialParams[c.key] = c.default;
  }

  return { schema, initialParams };
}
