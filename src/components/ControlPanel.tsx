"use client";

import type { ControlDef } from "@/lib/controls";
import type { Params } from "@/lib/effects";

export default function ControlPanel({
  schema,
  values,
  onChange,
}: {
  schema: ControlDef[];
  values: Params;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {schema.map((c) => (
        <div key={c.key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-pearl shrink-0">{c.label}</span>
          <div className="w-[160px] flex justify-end">
            {c.type === "color" && (
              <div className="flex items-center gap-2 bg-panel border border-border rounded-pills px-2 py-1.5 w-full">
                <input
                  type="color"
                  value={String(values[c.key] ?? c.default)}
                  onChange={(e) => onChange(c.key, e.target.value)}
                  className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer shrink-0"
                />
                <span className="text-xs text-pearl uppercase truncate">
                  {String(values[c.key] ?? c.default)}
                </span>
              </div>
            )}
            {c.type === "slider" && (
              <div className="flex items-center gap-2 bg-panel border border-border rounded-pills px-2.5 py-1.5 w-full">
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={Number(values[c.key] ?? c.default)}
                  onChange={(e) => onChange(c.key, parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <span className="text-xs text-pearl w-8 text-right shrink-0">
                  {Number(values[c.key] ?? c.default)}
                </span>
              </div>
            )}
            {c.type === "select" && (
              <select
                value={String(values[c.key] ?? c.default)}
                onChange={(e) => onChange(c.key, e.target.value)}
                className="w-full bg-panel border border-border rounded-pills px-2.5 py-1.5 text-sm text-pearl focus:outline-none"
              >
                {c.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {c.type === "toggle" && (
              <button
                onClick={() => onChange(c.key, !(values[c.key] ?? c.default))}
                className={`w-9 h-5 rounded-full relative overflow-hidden transition-colors ${
                  values[c.key] ?? c.default ? "bg-chalk" : "bg-panel border border-border"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-transform ${
                    values[c.key] ?? c.default ? "bg-void translate-x-4" : "bg-fog translate-x-0"
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
