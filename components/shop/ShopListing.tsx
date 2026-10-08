"use client";

import Link from "@/components/ui/SiteLink";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/shell/StoreProvider";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Drawer, { DrawerClose } from "@/components/ui/Drawer";
import ProdCard from "@/components/product/ProdCard";
import Filters from "./Filters";
import { emptyFilters, useShopFilters, type SortKey } from "./useShopFilters";
import { inr, site } from "@/lib/site";
import { apiProductToProduct } from "@/lib/home";
import type { ProductsApiResponse } from "@/lib/types";
import type { CommonCategoryRef, Product, ProductsApiTag, SaleProduct } from "@/lib/types";

const sorts: [SortKey, string][] = [
  ["best_selling", "Best Selling"],
  ["new_arrival", "New Arrival"],
  ["high_low", "Price, high to low"],
  ["low_high", "Price, low to high"],
];

export default function ShopListing({
  q = "", items, title: titleProp, lede,
  categories, currentSlug, currentTag, sort: liveSort, tags, priceRange, saleProducts, paging,
}: {
  q?: string;
  /** The live list from the API — every product (/shop), a category or a tag. */
  items: Product[];
  title?: string;
  lede?: string;
  /** A category page's live sidebar facets — every storefront category, its tags,
      the live price range and a few reduced-price picks. Absent on the plain /shop page. */
  categories?: CommonCategoryRef[];
  currentSlug?: string;
  /** Set instead of currentSlug on a tag page (/shop/<slug>). */
  currentTag?: string;
  /** The current API sort order — the list arrives sorted server-side, so changing
      it reloads the page with the new order rather than re-sorting in the browser. */
  sort?: SortKey;
  tags?: ProductsApiTag[];
  priceRange?: { min: number; max: number } | null;
  saleProducts?: SaleProduct[];
  /** /shop only: `items` is page 1 of every product; the rest load on scroll. */
  paging?: { lastPage: number; total: number };
}) {
  const router = useRouter();
  const { href } = useStore();
  /** A category or tag page's list arrives already sorted by the API (it has
      the real sold/new-arrival data the static catalogue's `sold`/`fresh`
      proxy fields don't) — so it just gets filtered here, not re-sorted. */
  const isLiveSort = liveSort != null;
  const slug = currentTag ?? currentSlug;
  const liveHref = href(slug ? `/shop/${slug}` : "/shop");
  /* /shop arrives with one page; later pages are appended as the list is scrolled. */
  const [all, setAll] = useState(items);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => { setAll(items); setPage(1); }, [items]);
  const hasMore = !!paging && page < paging.lastPage;

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`${site.url}/api/products?page=${page + 1}&sort=${liveSort ?? "new_arrival"}`, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json: ProductsApiResponse = await res.json();
        const next = (json.data?.products ?? []).map(apiProductToProduct);
        setAll((prev) => [...prev, ...next.filter((n) => !prev.some((p) => p.slug === n.slug))]);
        setPage((n) => n + 1);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const f = useShopFilters(emptyFilters(q), all, {
    initialSort: liveSort, sortLocally: !isLiveSort,
  });
  const [cols, setCols] = useState<"3" | "4">("3");
  const [drawer, setDrawer] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const list = f.results;
  /* With no filters on, /shop's count is the whole counter, not just what's loaded so far. */
  const shownTotal = paging && f.activeCount === 0 ? Math.max(paging.total, list.length) : list.length;
  const slice = list.slice(0, f.shown);
  /** True when the source list itself (a category's live products) is empty —
      as opposed to filters narrowing a non-empty list down to nothing — so the
      empty state doesn't tell someone to "clear filters" they never set. */
  const sourceEmpty = all.length === 0;

  /* More of the list reveals itself as the sentinel below the grid nears the
     viewport — no "load more" click needed. Once everything loaded is shown,
     /shop fetches its next page from the API. */
  const more = useRef(loadMore);
  more.current = loadMore;
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      if (f.shown < list.length) f.setShown((s) => Math.min(s + f.PAGE, list.length));
      else more.current();
    }, { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length, f.shown, f.PAGE, f.setShown]);

  const title = titleProp ?? (f.state.q ? `Results for “${f.state.q}”` : "Everything on the counter");

  const chips: { key: string; label: string; onDrop: () => void }[] = [
    ...(f.state.q ? [{ key: "q", label: `“${f.state.q}”`, onDrop: () => f.drop("q") }] : []),
    ...f.state.material.map((v) => ({ key: "mat" + v, label: v, onDrop: () => f.drop("material", v) })),
    ...f.state.avail.map((v) => ({ key: "av" + v, label: v === "in" ? "In stock" : "Last few", onDrop: () => f.drop("avail", v) })),
    ...f.state.deal.map((v) => ({ key: "deal" + v, label: "Reduced", onDrop: () => f.drop("deal", v) })),
    ...(f.state.min != null ? [{ key: "min", label: `From ${inr(f.state.min)}`, onDrop: () => f.drop("min") }] : []),
    ...(f.state.max != null ? [{ key: "max", label: `Up to ${inr(f.state.max)}`, onDrop: () => f.drop("max") }] : []),
  ];

  const filterProps = {
    state: f.state,
    counts: f.counts,
    onToggle: f.toggle,
    onPrice: f.setPrice,
    showCraft: false,
    showMaterial: false,
    categories, currentSlug, currentTag, tags, priceRange, saleProducts,
  };

  return (
    <>
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <span>{f.state.q ? "Search" : title}</span>
          </nav>
          <h1>{title}</h1>
          <p>
            {lede ?? "Handicraft from six Jaipur lanes and the cotton it sits beside. Fabric is priced by the metre, handicraft by the piece."}
          </p>
        </div>
      </div>


      <div className="st-wrap">
        <div className="st-plp__grid">
          <aside className="st-filters" aria-label="Filters"><Filters {...filterProps} /></aside>

          <div>
            <div className="st-bar">
              <p className="st-bar__n"><b>{shownTotal}</b> {shownTotal === 1 ? "piece" : "pieces"}</p>
              <div className="st-bar__r">
                <button type="button" className="st-btn st-filterbtn" onClick={() => setDrawer(true)}>
                  Filter {f.activeCount > 0 && <b>{f.activeCount}</b>}
                </button>
                <div className="st-dense" role="group" aria-label="Grid density">
                  <button type="button" className={cols === "3" ? "on" : ""} onClick={() => setCols("3")} aria-label="Three across">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                      {[0, 7, 14].map((x) => [2, 9].map((y) => <rect key={`${x}-${y}`} x={x + 2} y={y} width="6" height="6" rx="1" />))}
                    </svg>
                  </button>
                  <button type="button" className={cols === "4" ? "on" : ""} onClick={() => setCols("4")} aria-label="Four across">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                      {[1, 6.9, 12.8, 18.6].map((x) => [2, 7.8].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="4.4" height="4.4" rx="1" />))}
                    </svg>
                  </button>
                </div>
                <select className="st-sel" value={isLiveSort ? (liveSort ?? "best_selling") : f.sort}
                  aria-label="Sort products"
                  onChange={(e) => {
                    const v = e.target.value as SortKey;
                    if (isLiveSort) router.push(`${liveHref}?sort=${v}`, { scroll: false });
                    else f.setSort(v);
                  }}>
                  <option value="" disabled>Sort Filter</option>
                  {sorts.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            </div>

            <div className="st-active">
              {chips.map((c) => (
                <button type="button" key={c.key} onClick={c.onDrop}>{c.label} <i aria-hidden="true">×</i></button>
              ))}
              {chips.length > 1 && <button type="button" className="clr" onClick={f.clear}>Clear all</button>}
            </div>

            {list.length === 0 ? (
              <div className="st-empty">
                <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "clamp(1.4rem,5vw,1.9rem)", margin: "0 0 .55rem" }}>
                  {sourceEmpty ? "Nothing on the counter here yet" : "Nothing matches that yet"}
                </h2>
                {sourceEmpty ? (
                  <>
                    <p>This collection is empty for now — check back soon, or see what else is on the counter.</p>
                    <Link href="/shop" className="st-btn st-btn--solid">Browse everything</Link>
                  </>
                ) : (
                  <>
                    <p>Loosen one filter and the shelf fills back up. Most people start with a craft, then a price.</p>
                    <button type="button" className="st-btn st-btn--solid" onClick={f.clear}>Clear the filters</button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="st-grid" data-cols={cols}>
                  {slice.map((p, i) => (
                    <ProdCard key={p.slug} p={p} priority={i < 4} sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 280px" />
                  ))}
                </div>
                <div className="st-more">
                  {f.shown >= list.length && !hasMore ? (
                    <p>That’s all {list.length}</p>
                  ) : (
                    <>
                      <div className="st-more__bar">
                        <span className="st-more__fill" style={{ width: `${(Math.min(f.shown, list.length) / shownTotal) * 100}%` }} />
                      </div>
                      <p>{Math.min(f.shown, list.length)} of {shownTotal} · {loadingMore ? "loading more…" : "more on scroll"}</p>
                      <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} side="left" label="Filters" className="st-fltdrawer">
        <div className="drawer__head">
          <span className="st-eyebrow">Narrow it down</span>
          <DrawerClose onClose={() => setDrawer(false)} label="Close filters" />
        </div>
        <div className="drawer__body"><Filters {...filterProps} /></div>
        <div className="drawer__foot">
          <button type="button" className="st-btn st-btn--solid" onClick={() => setDrawer(false)}>
            {list.length ? `Show ${list.length} ${list.length === 1 ? "piece" : "pieces"}` : "Nothing matches yet"}
          </button>
        </div>
      </Drawer>
    </>
  );
}
