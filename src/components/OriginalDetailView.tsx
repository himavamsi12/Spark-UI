"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCw,
  RotateCcw,
  Code2,
  EyeIcon,
  SlidersHorizontal,
} from "lucide-react";
import MediaPreview from "./MediaPreview";
import OriginalControlPanel from "./OriginalControlPanel";
import ComponentDelivery from "./ComponentDelivery";
import Sidebar from "./Sidebar";
import ComponentActions from "./ComponentActions";
import Footer from "./Footer";
import { ORIGINALS, getOriginal, getOriginalDefaults } from "@/lib/originalControls";
import { ORIGINAL_COMPONENTS } from "./originals";
import { generateUsageSnippet } from "@/lib/usageSnippet";
import type { Params, ParamValue } from "@/lib/effects";
import type { ComponentEntry, SortKey } from "@/lib/types";

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}

function typeLabel(t: string) {
  if (t === "toggle") return "boolean";
  if (t === "select") return "enum";
  if (t === "color") return "color";
  if (t === "text") return "string";
  if (t === "image") return "string";
  if (t === "imageList") return "string[]";
  if (t === "textList") return "string[]";
  if (t === "font") return "string";
  return "number";
}

/** Arrays are compared by value, since reference equality would always read as dirty. */
function sameValue(a: unknown, b: unknown) {
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
  return a === b;
}

function formatDefault(v: unknown) {
  if (Array.isArray(v)) return `${v.length} images`;
  const s = String(v);
  return s.length > 18 ? `${s.slice(0, 17)}…` : s;
}

export default function OriginalDetailView({
  entry,
  similar,
  allComponents,
}: {
  entry: ComponentEntry;
  similar: ComponentEntry[];
  allComponents: ComponentEntry[];
}) {
  const original = getOriginal(entry.slug);
  const Comp = ORIGINAL_COMPONENTS[entry.slug];
  const schema = original?.controls ?? [];

  const [params, setParams] = useState<Params>(() => getOriginalDefaults(entry.slug));
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [replayKey, setReplayKey] = useState(0);

  // The left nav is the same full site index as the browse page, where search,
  // sort, and category here are purely cosmetic (there's no grid on this page
  // to apply them to), they just drive which entries the sidebar highlights.
  const [navSearch, setNavSearch] = useState("");
  const [navSort, setNavSort] = useState<SortKey>("trending");
  const [navCategory, setNavCategory] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const navCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of allComponents) c[d.category] = (c[d.category] || 0) + 1;
    return c;
  }, [allComponents]);

  function updateParam(key: string, value: ParamValue) {
    setParams((p) => ({ ...p, [key]: value }));
  }

  const defaults = getOriginalDefaults(entry.slug);
  const isDirty = schema.some((c) => !sameValue(params[c.key], defaults[c.key]));

  function resetParams() {
    setParams(defaults);
    setReplayKey((k) => k + 1);
  }

  const snippet = generateUsageSnippet(entry.name, schema, params);

  const built = ORIGINALS.filter((o) => o.key in ORIGINAL_COMPONENTS);
  const idx = built.findIndex((o) => o.key === entry.slug);
  const prevItem = idx > 0 ? built[idx - 1] : undefined;
  const nextItem = idx >= 0 && idx < built.length - 1 ? built[idx + 1] : undefined;


  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar
        data={allComponents}
        search={navSearch}
        onSearch={setNavSearch}
        sort={navSort}
        onSort={setNavSort}
        category={navCategory}
        onCategory={setNavCategory}
        counts={navCounts}
        total={allComponents.length}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />

      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar px-8 py-6 w-full">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-1.5 mb-3 border border-border text-pearl text-xs font-medium px-2.5 py-1.5 rounded-pills hover:border-pearl/40 hover:text-chalk transition-colors lg:hidden"
        >
          <SlidersHorizontal size={13} />
          Browse components
        </button>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-display font-medium tracking-tight text-chalk">{entry.name}</h1>
          <span className="ml-auto border border-border text-pearl rounded-pills px-2 py-0.5 text-xs">
            {entry.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted mb-5">
          <span className="flex items-center gap-1">
            <Eye size={13} /> {formatViews(entry.views)} views
          </span>
          <span>•</span>
          <span>{formatViews(entry.copies)} uses</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 bg-panel border border-border rounded-pills p-1">
            <button
              onClick={() => setTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pills text-sm transition-colors ${
                tab === "preview" ? "bg-slate text-chalk" : "text-muted hover:text-pearl"
              }`}
            >
              <EyeIcon size={14} />
              Preview
            </button>
            <button
              onClick={() => setTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pills text-sm transition-colors ${
                tab === "code" ? "bg-slate text-chalk" : "text-muted hover:text-pearl"
              }`}
            >
              <Code2 size={14} />
              Code
            </button>
          </div>
          <ComponentActions entry={entry} snippet={snippet} />
        </div>

        <div className="relative rounded-cards overflow-hidden border border-border bg-void aspect-video min-h-[360px] max-h-[760px] mb-6">
          {tab === "preview" ? (
            Comp && <Comp key={replayKey} {...params} />
          ) : (
            <pre className="w-full h-full overflow-auto p-4 text-xs leading-relaxed text-white/80 font-mono whitespace-pre bg-[#0a0a0b]">
              {snippet}
            </pre>
          )}
          {tab === "preview" && (
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="absolute top-3 right-3 p-2 rounded-pills bg-black/60 border border-white/10 text-white/80 hover:text-white"
            >
              <RotateCw size={14} />
            </button>
          )}
        </div>

        <div className="border border-border rounded-cards p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-chalk">Customize</h3>
            <button
              onClick={resetParams}
              disabled={!isDirty}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-pearl disabled:opacity-40 disabled:hover:text-muted transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
          <OriginalControlPanel schema={schema} values={params} onChange={updateParam} />
        </div>

        <div className="border border-border rounded-cards p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-chalk">Props</h3>
            <span className="text-xs text-muted">{schema.length} properties</span>
          </div>
          <div className="grid grid-cols-[110px_70px_90px_1fr] gap-3 pb-2 mb-1 border-b border-border-soft">
            <span className="text-xs text-muted font-medium">Property</span>
            <span className="text-xs text-muted font-medium">Type</span>
            <span className="text-xs text-muted font-medium">Default</span>
            <span className="text-xs text-muted font-medium">Description</span>
          </div>
          <div className="flex flex-col divide-y divide-border-soft">
            {schema.map((c) => (
              <div key={c.key} className="py-3 grid grid-cols-[110px_70px_90px_1fr] gap-3 items-start text-sm">
                <code className="text-accent font-mono text-xs">{c.key}</code>
                <span className="text-muted text-xs font-mono">{typeLabel(c.type)}</span>
                <span className="text-muted text-xs font-mono truncate">{formatDefault(c.default)}</span>
                <span className="text-pearl text-xs">{c.description ?? c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ComponentDelivery slug={entry.slug} />

        <div className="border-t border-border pt-6 mb-8">
          <p className="text-sm text-pearl leading-relaxed mb-6">{original?.blurb}</p>
          <h3 className="text-xs font-semibold tracking-wide text-muted mb-3">KEY FEATURES</h3>
          <ul className="space-y-2">
            {original?.features.map((f, i) => (
              <li key={i} className="text-sm text-pearl flex gap-2">
                <span className="text-muted">·</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {(prevItem || nextItem) && (
          <div className="grid grid-cols-2 gap-3 mb-10">
            {prevItem ? (
              <Link
                href={`/components/${prevItem.key}`}
                className="flex items-center gap-2 border border-border rounded-cards px-4 py-3 hover:border-pearl/40 transition-colors"
              >
                <ChevronLeft size={16} className="text-muted shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted">Previous</div>
                  <div className="text-sm text-pearl truncate">{prevItem.name}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextItem ? (
              <Link
                href={`/components/${nextItem.key}`}
                className="flex items-center justify-end gap-2 border border-border rounded-cards px-4 py-3 hover:border-pearl/40 transition-colors text-right"
              >
                <div className="min-w-0">
                  <div className="text-xs text-muted">Next</div>
                  <div className="text-sm text-pearl truncate">{nextItem.name}</div>
                </div>
                <ChevronRight size={16} className="text-muted shrink-0" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}

        <div className="-mx-6">
          <Footer />
        </div>
      </main>

      <aside className="w-[280px] shrink-0 border-l border-border h-full overflow-y-auto no-scrollbar px-4 py-5 hidden xl:block">
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
    </div>
  );
}
