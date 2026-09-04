"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Clapperboard } from "lucide-react";
import Sidebar from "./Sidebar";
import ComponentCard from "./ComponentCard";
import Footer from "./Footer";
import type { ComponentEntry, SortKey } from "@/lib/types";

export default function Explorer({ data }: { data: ComponentEntry[] }) {
  const searchParams = useSearchParams();
  const originalsOnly = searchParams.get("view") === "originals";
  const scoped = useMemo(
    () => (originalsOnly ? data.filter((d) => d.source === "original") : data),
    [data, originalsOnly]
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("trending");
  const [previewType, setPreviewType] = useState<"live" | "still">("live");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of scoped) c[d.category] = (c[d.category] || 0) + 1;
    return c;
  }, [scoped]);

  const filtered = useMemo(() => {
    let list = scoped;
    if (category) list = list.filter((d) => d.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === "trending") sorted.sort((a, b) => b.views - a.views);
    else if (sort === "copied") sorted.sort((a, b) => b.copies - a.copies);
    else if (sort === "recent") sorted.sort((a, b) => a.addedRank - b.addedRank);
    return sorted;
  }, [scoped, category, search, sort]);

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar
        data={scoped}
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
        category={category}
        onCategory={setCategory}
        counts={counts}
        total={scoped.length}
      />
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar px-6 py-5" data-shell-scroll>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted">
            {category ? (
              <>
                {category} • {filtered.length}
              </>
            ) : (
              <>Discover {filtered.length} Components</>
            )}
          </p>
          <div className="flex items-center gap-1 bg-panel border border-border rounded-pills p-1">
            <span className="text-xs text-muted pl-1.5 pr-1 hidden sm:inline">Preview Type:</span>
            <button
              onClick={() => setPreviewType("live")}
              className={`p-1.5 rounded-pills transition-colors ${
                previewType === "live" ? "bg-slate text-chalk" : "text-muted"
              }`}
              title="Animated preview"
            >
              <Clapperboard size={14} />
            </button>
            <button
              onClick={() => setPreviewType("still")}
              className={`p-1.5 rounded-pills transition-colors ${
                previewType === "still" ? "bg-slate text-chalk" : "text-muted"
              }`}
              title="Still preview"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-muted py-20 text-center">No components match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
            {filtered.map((entry) => (
              <ComponentCard key={entry.slug} entry={entry} still={previewType === "still"} />
            ))}
          </div>
        )}

        <div className="-mx-6">
          <Footer />
        </div>
      </main>
    </div>
  );
}
