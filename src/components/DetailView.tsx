"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Maximize2,
  RotateCw,
  Eye,
  Copy,
  ChevronDown,
  Play,
  Pause,
} from "lucide-react";
import CardPreview from "./CardPreview";
import MediaPreview from "./MediaPreview";
import ControlPanel from "./ControlPanel";
import GetComponentModal from "./GetComponentModal";
import Footer from "./Footer";
import { getCopy } from "@/lib/copy";
import { getControlSchema, defaultParams } from "@/lib/controls";
import { buildRealSchema } from "@/lib/realControls";
import { getOriginal, getOriginalDefaults } from "@/lib/originalControls";
import { ORIGINAL_COMPONENTS } from "./originals";
import type { Params } from "@/lib/effects";
import type { ComponentEntry } from "@/lib/types";

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}

export default function DetailView({
  entry,
  similar,
}: {
  entry: ComponentEntry;
  similar: ComponentEntry[];
}) {
  const isOriginal = entry.source === "original";
  const original = isOriginal ? getOriginal(entry.slug) : undefined;
  const OriginalComp = isOriginal ? ORIGINAL_COMPONENTS[entry.slug] : undefined;

  const real = !isOriginal ? buildRealSchema(entry.effect, entry.slug) : null;
  const schema = isOriginal ? original?.controls ?? [] : real?.schema ?? getControlSchema(entry.effect);
  const [params, setParams] = useState<Params>(() =>
    isOriginal
      ? getOriginalDefaults(entry.slug)
      : real?.initialParams ?? defaultParams(entry.effect, entry.palette)
  );
  const [paused, setPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [customizing, setCustomizing] = useState(false);
  const [showGetModal, setShowGetModal] = useState(false);
  const hasRealMedia = Boolean(entry.video || entry.poster);
  const copy = isOriginal
    ? { blurb: original?.blurb ?? "", features: original?.features ?? [] }
    : getCopy(entry.effect);

  function updateParam(key: string, value: string | number | boolean) {
    setParams((p) => ({ ...p, [key]: value }));
    setCustomizing(true);
  }

  function reset() {
    setParams(isOriginal ? getOriginalDefaults(entry.slug) : real?.initialParams ?? defaultParams(entry.effect, entry.palette));
    setReplayKey((k) => k + 1);
    setCustomizing(false);
  }

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-[280px] shrink-0 border-r border-border h-full overflow-y-auto no-scrollbar px-4 py-5 hidden lg:block">
        <Link
          href="/components"
          className="flex items-center gap-1.5 text-sm text-pearl hover:text-chalk mb-5"
        >
          <ChevronLeft size={15} />
          Go back
        </Link>
        <h3 className="text-sm text-chalk mb-3">Similar Components</h3>
        <div className="flex flex-col gap-3">
          {similar.map((s) => (
            <Link
              key={s.slug}
              href={`/components/${s.slug}`}
              className="block rounded-medium overflow-hidden border border-border hover:border-pearl/40 transition-colors"
            >
              <div className="aspect-video bg-void">
                <MediaPreview entry={s} className="w-full h-full" still />
              </div>
              <div className="px-2.5 py-2 text-xs text-pearl truncate">{s.name}</div>
            </Link>
          ))}
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar px-6 py-5">
        <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-medium tracking-tight text-chalk">{entry.name}</h1>
            <button className="flex items-center gap-1.5 text-sm border border-border rounded-pills px-2.5 py-1 text-pearl">
              Variant 1
              <ChevronDown size={14} />
            </button>
          </div>
          <button
            onClick={() => setShowGetModal(true)}
            className="bg-chalk text-void text-sm font-medium px-4 py-2 rounded-pills hover:bg-pearl transition-colors shadow-[0_-1px_0_0_var(--color-iron)]"
          >
            Get this Component
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted mb-4">
          <span className="flex items-center gap-1">
            <Eye size={13} /> {formatViews(entry.views)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Copy size={13} /> {formatViews(entry.copies)}
          </span>
          <span className="ml-auto border border-border text-pearl rounded-pills px-2 py-0.5">
            {entry.category}
          </span>
        </div>

        <div className="relative rounded-cards overflow-hidden border border-border bg-void w-full aspect-video min-h-[360px] max-h-[760px]">
          {isOriginal ? (
            OriginalComp && <OriginalComp key={replayKey} {...params} />
          ) : customizing || !hasRealMedia ? (
            <CardPreview
              key={replayKey}
              effect={entry.effect}
              seed={entry.seed}
              palette={entry.palette}
              label={entry.name}
              className="w-full h-full"
              params={params}
              paused={paused}
            />
          ) : (
            <MediaPreview entry={entry} className="w-full h-full" still={paused} />
          )}
          {!isOriginal && customizing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 border border-white/10 text-[11px] text-white/70 px-2.5 py-1 rounded-full">
              Live custom preview, not the original recording
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <button className="p-2 rounded-lg bg-black/60 border border-white/10 text-white/80 hover:text-white">
              <Maximize2 size={14} />
            </button>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            {!isOriginal && customizing && hasRealMedia && (
              <button
                onClick={reset}
                className="px-2.5 h-8 rounded-lg bg-black/60 border border-white/10 text-white/80 hover:text-white text-xs"
              >
                View Original
              </button>
            )}
            {!isOriginal && (
              <button
                onClick={() => setPaused((p) => !p)}
                className="p-2 rounded-lg bg-black/60 border border-white/10 text-white/80 hover:text-white"
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
            <button
              onClick={reset}
              className="p-2 rounded-lg bg-black/60 border border-white/10 text-white/80 hover:text-white"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 mb-6">
          <button className="text-sm border border-border rounded-pills px-3 py-1.5 text-pearl hover:border-pearl/40">
            How to Use
          </button>
          <button className="text-sm border border-border rounded-pills px-3 py-1.5 text-pearl hover:border-pearl/40">
            Suggest Improvements
          </button>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-display font-medium tracking-tight text-chalk mb-2">{entry.name}</h2>
          <p className="text-sm text-pearl leading-relaxed mb-6">{copy.blurb}</p>
          <h3 className="text-xs font-semibold tracking-wide text-muted mb-3">KEY FEATURES</h3>
          <ul className="space-y-2 mb-10">
            {copy.features.map((f, i) => (
              <li key={i} className="text-sm text-pearl flex gap-2">
                <span className="text-muted">·</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="-mx-6">
          <Footer />
        </div>
      </main>

      <aside className="w-[360px] shrink-0 border-l border-border h-full overflow-y-auto no-scrollbar px-5 py-5 hidden xl:flex xl:flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-pearl truncate">Variant 1</span>
          <span className="w-7 h-7 rounded-medium bg-panel border border-border flex items-center justify-center text-pearl">
            +
          </span>
        </div>

        <ControlPanel schema={schema} values={params} onChange={updateParam} />

        <div className="mt-auto pt-6 border-t border-border-soft flex flex-col gap-3">
          <ToggleRow label="Helper Mode" value={false} onChange={() => {}} />
          <ToggleRow label="Show Responsive Editor" value={false} onChange={() => {}} />
        </div>
      </aside>

      {showGetModal && (
        <GetComponentModal entry={entry} onClose={() => setShowGetModal(false)} />
      )}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-pearl">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full relative transition-colors ${
          value ? "bg-chalk" : "bg-panel border border-border"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
            value ? "bg-void translate-x-4" : "bg-fog translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
