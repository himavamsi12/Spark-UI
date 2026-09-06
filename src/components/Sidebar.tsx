"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Search, TrendingUp, Sparkles, Flame, Sparkle, X } from "lucide-react";
import MediaPreview from "./MediaPreview";
import { useFavorites } from "@/lib/favorites";
import { CATEGORY_ORDER, type ComponentEntry, type SortKey } from "@/lib/types";

const EXPLORE_LINKS: { href: string; label: string; icon: React.ElementType }[] = [
  { href: "/docs", label: "Introduction", icon: BookOpen },
];

const EXPLORE: { key: SortKey; label: string; icon: React.ElementType; disabled?: boolean }[] = [
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "recent", label: "Recently Added", icon: Sparkles },
  { key: "copied", label: "Most Copied", icon: Flame },
  { key: "recommended", label: "Recommended", icon: Sparkle, disabled: true },
];

const PREVIEW_W = 260;
const PREVIEW_H = 150;
const HOVER_DELAY = 150; // avoids mounting a live preview for every item you sweep past

export default function Sidebar({
  data,
  search,
  onSearch,
  sort,
  onSort,
  category,
  onCategory,
  counts,
  total,
  mobileOpen = false,
  onMobileClose,
}: {
  data: ComponentEntry[];
  search: string;
  onSearch: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  category: string | null;
  onCategory: (v: string | null) => void;
  counts: Record<string, number>;
  total: number;
  /** Below `lg` the sidebar is an off-canvas drawer instead of a static column. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const activeSlug = pathname?.startsWith("/components/") ? pathname.split("/")[2] : null;
  const onExploreLink = EXPLORE_LINKS.some((l) => pathname === l.href);
  // The sort buttons only have a live grid to act on from the browse page;
  // everywhere else (docs, a single component's detail page) they need to
  // navigate there instead of quietly flipping state nothing on screen reads.
  const onExplorerPage = pathname === "/components";

  // Saved from the heart on any component page. Ordered by the stored list so
  // the most recently saved sits at the bottom, matching the order they were added.
  const favorites = useFavorites();
  const favoriteEntries = useMemo(
    () => favorites.map((slug) => data.find((d) => d.slug === slug)).filter((d): d is ComponentEntry => !!d),
    [favorites, data],
  );

  const [preview, setPreview] = useState<{ entry: ComponentEntry; top: number; left: number } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracked outside state so handleEnter can tell "already showing" from "first
  // hover" without waiting on a render.
  const isShowing = useRef(false);

  function clearHoverTimer() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  function positionFor(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const left = rect.right + 12;
    // Clamp vertically so the card never runs off the bottom of the viewport.
    const top = Math.min(Math.max(rect.top - 8, 8), window.innerHeight - PREVIEW_H - 8);
    return { top, left };
  }

  function handleEnter(entry: ComponentEntry, el: HTMLElement) {
    clearHoverTimer();
    if (isShowing.current) {
      // A preview is already up: follow the cursor straight to the next item,
      // with the position change eased by CSS rather than a fresh delay, so
      // sweeping down the list reads as one continuous glide.
      setPreview({ entry, ...positionFor(el) });
      return;
    }
    hoverTimer.current = setTimeout(() => {
      isShowing.current = true;
      setPreview({ entry, ...positionFor(el) });
    }, HOVER_DELAY);
  }

  function handleLeave() {
    clearHoverTimer();
    isShowing.current = false;
    setPreview(null);
  }

  // A component link navigating away should close the mobile drawer instead
  // of leaving it open behind the new page.
  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Every component, grouped by category and alphabetised. This list is the
  // full site index, independent of the category/sort filters applied to the
  // grid, so you can always jump straight to a component by name.
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byCategory = new Map<string, ComponentEntry[]>();
    for (const entry of data) {
      if (q && !entry.name.toLowerCase().includes(q)) continue;
      const list = byCategory.get(entry.category) ?? [];
      list.push(entry);
      byCategory.set(entry.category, list);
    }
    const orderedKeys = [
      ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
      ...[...byCategory.keys()].filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
    ];
    return orderedKeys.map((cat) => ({
      category: cat,
      entries: [...(byCategory.get(cat) ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [data, search]);

  return (
    <>
      {/* Backdrop: mobile/tablet only, and only while the drawer is open. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-void/70 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[82vw] bg-bg border-r border-border overflow-y-auto no-scrollbar px-4 py-5 transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto lg:w-[280px] lg:max-w-none lg:shrink-0 lg:h-full lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <span className="text-sm font-medium text-chalk">Filters</span>
          <button
            onClick={onMobileClose}
            aria-label="Close filters"
            className="p-1.5 rounded-medium text-muted hover:text-chalk hover:bg-panel transition-colors"
          >
            <X size={16} />
          </button>
        </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`Filter ${total} components…`}
          className="w-full bg-charcoal border border-border rounded-pills pl-9 pr-9 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted border border-border rounded-small px-1.5 py-0.5">
          /
        </kbd>
      </div>

      <div className="mb-5 pb-5 border-b border-border-soft">
        <h3 className="text-xs font-medium text-muted mb-2.5 px-0.5">Explore</h3>
        <div className="flex flex-col gap-1.5">
          {EXPLORE_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 text-sm rounded-pills border px-3 py-2 transition-colors ${
                pathname === href
                  ? "bg-slate border-border text-chalk"
                  : "border-border text-pearl hover:border-pearl/40"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
          {EXPLORE.map(({ key, label, icon: Icon, disabled }) => {
            const active = sort === key && !onExploreLink && onExplorerPage;
            const className = `flex items-center gap-2 text-sm rounded-pills border px-3 py-2 transition-colors text-left ${
              active
                ? "bg-slate border-border text-chalk"
                : disabled
                ? "border-border text-muted/50 cursor-not-allowed"
                : "border-border text-pearl hover:border-pearl/40"
            }`;
            const content = (
              <>
                <Icon size={14} />
                {label}
              </>
            );
            // Off the browse page there's no grid for onSort to reorder, so
            // this needs to actually navigate there instead.
            if (!onExplorerPage && !disabled) {
              return (
                <Link key={key} href={`/components?sort=${key}`} className={className}>
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={key}
                disabled={disabled}
                onClick={() => onSort(key)}
                title={disabled ? "Sign in to see recommendations" : undefined}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted px-0.5">No components match “{search}”.</p>
      ) : (
        <nav className="flex flex-col gap-5" onMouseLeave={handleLeave}>
          {favoriteEntries.length > 0 && (
            <div>
              <div className="flex items-center justify-between w-full text-xs font-medium mb-2 px-0.5 text-muted">
                <span className="uppercase tracking-wide flex items-center gap-1.5">
                  <Heart size={11} className="text-accent fill-accent" />
                  Favorites
                </span>
                <span className="text-[10px] tabular-nums">{favoriteEntries.length}</span>
              </div>
              <div className="flex flex-col">
                {favoriteEntries.map((entry) => (
                  <Link
                    key={`fav-${entry.slug}`}
                    href={`/components/${entry.slug}`}
                    onMouseEnter={(e) => handleEnter(entry, e.currentTarget)}
                    className={`text-sm rounded-medium px-2.5 py-1.5 -mx-0.5 transition-colors truncate ${
                      entry.slug === activeSlug
                        ? "bg-slate text-chalk"
                        : "text-pearl hover:bg-panel hover:text-chalk"
                    }`}
                  >
                    {entry.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {groups.map(({ category: cat, entries }) => (
            <div key={cat}>
              <button
                onClick={() => onCategory(category === cat ? null : cat)}
                className={`flex items-center justify-between w-full text-xs font-medium mb-2 px-0.5 transition-colors ${
                  category === cat ? "text-chalk" : "text-muted hover:text-pearl"
                }`}
              >
                <span className="uppercase tracking-wide">{cat}</span>
                <span className="text-[10px] tabular-nums">{counts[cat] ?? entries.length}</span>
              </button>
              <div className="flex flex-col">
                {entries.map((entry) => {
                  const isActive = entry.slug === activeSlug;
                  return (
                    <Link
                      key={entry.slug}
                      href={`/components/${entry.slug}`}
                      onMouseEnter={(e) => handleEnter(entry, e.currentTarget)}
                      className={`text-sm rounded-medium px-2.5 py-1.5 -mx-0.5 transition-colors truncate ${
                        isActive
                          ? "bg-slate text-chalk"
                          : "text-pearl hover:bg-panel hover:text-chalk"
                      }`}
                    >
                      {entry.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      )}

      {preview && (
        <div
          className="hidden lg:block fixed z-50 pointer-events-none rounded-cards border border-border bg-card shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden transition-[top,left] duration-150 ease-out"
          style={{ top: preview.top, left: preview.left, width: PREVIEW_W }}
        >
          <div className="bg-void" style={{ height: PREVIEW_H }}>
            <MediaPreview entry={preview.entry} className="w-full h-full" />
          </div>
          <div className="px-2.5 py-2 flex items-center justify-between gap-2 border-t border-border-soft">
            <span className="text-xs text-chalk truncate">{preview.entry.name}</span>
            <span className="text-[10px] text-muted shrink-0">{preview.entry.category}</span>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
