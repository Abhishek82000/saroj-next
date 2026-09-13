"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Drawer, { DrawerClose } from "@/components/ui/Drawer";
import ProductCard from "./ProductCard";
import Filters from "./Filters";
import { emptyFilters, useShopFilters, type SortKey } from "./useShopFilters";
import { crafts, craftBy } from "@/lib/crafts";
import { products } from "@/lib/products";
import { inr } from "@/lib/site";

const sorts: [SortKey, string][] = [
  ["new", "Newest first"],
  ["pop", "Most bought"],
  ["lo", "Price · low to high"],
  ["hi", "Price · high to low"],
  ["off", "Biggest saving"],
];

export default function ShopListing({ q = "", craft = "" }: { q?: string; craft?: string }) {
  const f = useShopFilters(emptyFilters(q, craft ? [craft] : []));
  const [cols, setCols] = useState<"3" | "4">("3");
  const [drawer, setDrawer] = useState(false);

  const list = f.results;
  const slice = list.slice(0, f.shown);

  const title = f.state.q
    ? `Results for “${f.state.q}”`
    : f.state.craft.length === 1
      ? craftBy[f.state.craft[0]].name
      : f.state.craft.length > 1
        ? "Selected crafts"
        : "Everything on the counter";

  const chips: { key: string; label: string; onDrop: () => void }[] = [
    ...(f.state.q ? [{ key: "q", label: `“${f.state.q}”`, onDrop: () => f.drop("q") }] : []),
    ...f.state.craft.map((v) => ({ key: "craft" + v, label: craftBy[v].name, onDrop: () => f.drop("craft", v) })),
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
            Handicraft from six Jaipur lanes and the cotton it sits beside.
            Fabric is priced by the metre, handicraft by the piece.
          </p>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-crafts" role="group" aria-label="Filter by craft">
          <button type="button" className={`st-craft${f.state.craft.length ? "" : " on"}`}
            onClick={() => f.pickCraft("")}>
            <span>Everything<small>{products.length} pieces</small></span>
          </button>
          {crafts.map((c) => {
            const n = products.filter((p) => p.craft === c.key).length;
            const on = f.state.craft.length === 1 && f.state.craft[0] === c.key;
            return (
              <button type="button" key={c.key} className={`st-craft${on ? " on" : ""}`}
                onClick={() => f.pickCraft(c.key)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <i><img src={c.image} alt="" loading="lazy" /></i>
                <span>{c.name}<small>{c.lane} · {n}</small></span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-plp__grid">
          <aside className="st-filters" aria-label="Filters"><Filters {...filterProps} /></aside>

          <div>
            <div className="st-bar">
              <p className="st-bar__n"><b>{list.length}</b> {list.length === 1 ? "piece" : "pieces"}</p>
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
                <select className="st-sel" value={f.sort} aria-label="Sort products"
                  onChange={(e) => f.setSort(e.target.value as SortKey)}>
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
                  Nothing matches that yet
                </h2>
                <p>Loosen one filter and the shelf fills back up. Most people start with a craft, then a price.</p>
                <button type="button" className="st-btn st-btn--solid" onClick={f.clear}>Clear the filters</button>
              </div>
            ) : (
              <>
                <div className="st-grid" data-cols={cols}>
                  {slice.map((p, i) => <ProductCard key={p.slug} p={p} priority={i < 4} />)}
                </div>
                <div className="st-more">
                  {f.shown >= list.length ? (
                    <p>That’s all {list.length}</p>
                  ) : (
                    <>
                      <div className="st-more__bar">
                        <span className="st-more__fill" style={{ width: `${(f.shown / list.length) * 100}%` }} />
                      </div>
                      <p>{f.shown} of {list.length}</p>
                      <button type="button" className="st-btn" onClick={() => f.setShown(f.shown + f.PAGE)}>
                        Load {Math.min(f.PAGE, list.length - f.shown)} more
                      </button>
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
