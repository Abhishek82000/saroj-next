"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { crafts, materials } from "@/lib/crafts";
import { inr } from "@/lib/site";
import type { CommonCategoryRef, ProductsApiTag, SaleProduct } from "@/lib/types";
import type { FilterState } from "./useShopFilters";

export interface FilterProps {
  state: FilterState;
  counts: (key: keyof FilterState, value: string) => number;
  onToggle: (key: "craft" | "material" | "avail" | "deal", value: string) => void;
  onPrice: (key: "min" | "max", value: string) => void;
  /** A single-category listing has no craft/material facets to offer. */
  showCraft?: boolean;
  showMaterial?: boolean;
  /** A category page's live sidebar facets — see ShopListing. */
  categories?: CommonCategoryRef[];
  currentSlug?: string;
  tags?: ProductsApiTag[];
  priceRange?: { min: number; max: number } | null;
  saleProducts?: SaleProduct[];
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="st-fg" open>
      <summary className="st-fg__h" style={{ listStyle: "none" }}>
        {title}<Icon name="down" size={13} strokeWidth={2.2} />
      </summary>
      <div className="st-fg__b">{children}</div>
    </details>
  );
}

/** Dual-thumb price slider, drawn as two overlapping native <input type="range">
    with the top one's track made invisible so only its thumb is grabbable —
    the standard trick for a two-handle range out of native controls. */
function PriceSlider({ range, min, max, onPrice }: {
  range: { min: number; max: number };
  min: number | null;
  max: number | null;
  onPrice: (key: "min" | "max", value: string) => void;
}) {
  const lo = min ?? range.min;
  const hi = max ?? range.max;
  const span = range.max - range.min || 1;
  const loPct = ((lo - range.min) / span) * 100;
  const hiPct = ((hi - range.min) / span) * 100;
  const step = Math.max(1, Math.round(span / 100));

  return (
    <div>
      <div className="st-pricebar">
        <div className="st-pricebar__track">
          <div className="st-pricebar__fill" style={{ left: `${loPct}%`, width: `${hiPct - loPct}%` }} />
        </div>
        <input type="range" aria-label="Lowest price" min={range.min} max={range.max} step={step} value={lo}
          onChange={(e) => onPrice("min", String(Math.min(Number(e.target.value), hi - step)))} />
        <input type="range" aria-label="Highest price" min={range.min} max={range.max} step={step} value={hi}
          onChange={(e) => onPrice("max", String(Math.max(Number(e.target.value), lo + step)))} />
      </div>
      <p className="st-fg__hint">{inr(lo)} – {inr(hi)}</p>
    </div>
  );
}

function Check({ checked, label, count, onChange }: {
  checked: boolean; label: string; count: number; onChange: () => void;
}) {
  const dead = count === 0 && !checked;
  return (
    <label className={`st-chk${dead ? " off" : ""}`}>
      <input type="checkbox" checked={checked} disabled={dead} onChange={onChange} />
      <i aria-hidden="true" /><span>{label}</span><small>{count}</small>
    </label>
  );
}

/** Rendered twice — in the desktop rail and inside the mobile drawer. */
export default function Filters({
  state, counts, onToggle, onPrice, showCraft = true, showMaterial = true,
  categories, currentSlug, tags, priceRange, saleProducts,
}: FilterProps) {
  return (
    <>
      {categories && categories.length > 0 && (
        <Group title="Product categories">
          <div className="st-catlist st-catlist--scroll">
            {categories.map((c) => (
              <Link key={c.cat_id} href={`/shop/${c.cat_slug}`}
                className={c.cat_slug === currentSlug ? "on" : undefined}>
                {c.cat_name}
              </Link>
            ))}
          </div>
        </Group>
      )}

      {tags && tags.length > 0 && (
        <Group title="Tags">
          <div className="st-catlist">
            {tags.map((t) => (
              <Link key={t.tag_id} href={`/shop?q=${encodeURIComponent(t.tag_name)}`}>{t.tag_name}</Link>
            ))}
          </div>
        </Group>
      )}

      {showCraft && (
        <Group title="Craft">
          {crafts.map((c) => (
            <Check key={c.key} label={c.name} count={counts("craft", c.key)}
              checked={state.craft.includes(c.key)} onChange={() => onToggle("craft", c.key)} />
          ))}
        </Group>
      )}

      {showMaterial && (
        <Group title="Material">
          {materials
            .filter((m) => counts("material", m) > 0 || state.material.includes(m))
            .map((m) => (
              <Check key={m} label={m} count={counts("material", m)}
                checked={state.material.includes(m)} onChange={() => onToggle("material", m)} />
            ))}
        </Group>
      )}

      <Group title="Price">
        {priceRange ? (
          <PriceSlider range={priceRange} min={state.min} max={state.max} onPrice={onPrice} />
        ) : (
          <div className="st-range">
            <input type="number" inputMode="numeric" placeholder="Min ₹" aria-label="Lowest price"
              value={state.min ?? ""} onChange={(e) => onPrice("min", e.target.value)} />
            <span>to</span>
            <input type="number" inputMode="numeric" placeholder="Max ₹" aria-label="Highest price"
              value={state.max ?? ""} onChange={(e) => onPrice("max", e.target.value)} />
          </div>
        )}
      </Group>

      {showCraft && (
        <Group title="Availability">
          <Check label="In stock" count={counts("avail", "in")}
            checked={state.avail.includes("in")} onChange={() => onToggle("avail", "in")} />
          <Check label="Last few" count={counts("avail", "low")}
            checked={state.avail.includes("low")} onChange={() => onToggle("avail", "low")} />
        </Group>
      )}

      {showCraft && (
        <Group title="Offer">
          <Check label="Reduced" count={counts("deal", "sale")}
            checked={state.deal.includes("sale")} onChange={() => onToggle("deal", "sale")} />
        </Group>
      )}

      {saleProducts && saleProducts.length > 0 && (
        <div className="st-fg st-recs">
          <h3 className="st-fg__h" style={{ cursor: "default" }}>Recommended</h3>
          <div className="st-fg__b">
            {saleProducts.map((p) => (
              <Link key={p.slug} href={`/product/${p.slug}`} className="st-rec">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" loading="lazy" />
                <span>
                  <b>{p.name}</b>
                  <small><em>{inr(p.price)}</em>{p.mrp > 0 && <s>{inr(p.mrp)}</s>}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
