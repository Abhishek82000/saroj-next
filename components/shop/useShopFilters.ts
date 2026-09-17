"use client";
import { useCallback, useMemo, useState } from "react";
import { products, discount } from "@/lib/products";
import { craftBy } from "@/lib/crafts";
import type { Product } from "@/lib/types";

export interface FilterState {
  craft: string[];
  material: string[];
  avail: string[];
  deal: string[];
  min: number | null;
  max: number | null;
  q: string;
}

export type SortKey = "new" | "pop" | "lo" | "hi" | "off";

export const emptyFilters = (q = "", craft: string[] = []): FilterState => ({
  craft, material: [], avail: [], deal: [], min: null, max: null, q,
});

/**
 * All the listing state in one hook: filters, sort and paging.
 * `skip` lets a facet count itself against every *other* active filter,
 * which is what makes the numbers next to each checkbox honest.
 *
 * `items` defaults to the full static catalogue (the /shop page); a category
 * page passes its own live list so the same filters/sort/paging work there.
 */
export function useShopFilters(initial: FilterState, items: Product[] = products) {
  const [state, setState] = useState<FilterState>(initial);
  const [sort, setSort] = useState<SortKey>("new");
  const [shown, setShown] = useState(12);
  const PAGE = 12;

  const passes = useCallback((p: Product, skip?: keyof FilterState) => {
    if (skip !== "craft" && state.craft.length && !state.craft.includes(p.craft)) return false;
    if (skip !== "material" && state.material.length && !state.material.includes(p.material)) return false;
    if (skip !== "avail" && state.avail.length && !state.avail.includes(p.stock)) return false;
    if (skip !== "deal" && state.deal.length && !discount(p)) return false;
    if (skip !== "min" && state.min != null && p.price < state.min) return false;
    if (skip !== "max" && state.max != null && p.price > state.max) return false;
    if (state.q) {
      const hay = `${p.name} ${craftBy[p.craft]?.name ?? ""} ${p.material}`.toLowerCase();
      if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }, [state]);

  const results = useMemo(() => {
    const by: Record<SortKey, (a: Product, b: Product) => number> = {
      new: (a, b) => b.fresh - a.fresh,
      pop: (a, b) => b.sold - a.sold,
      lo: (a, b) => a.price - b.price,
      hi: (a, b) => b.price - a.price,
      off: (a, b) => discount(b) - discount(a),
    };
    return items.filter((p) => passes(p)).sort(by[sort]);
  }, [items, passes, sort]);

  const counts = useCallback((key: keyof FilterState, value: string) =>
    items.filter((p) => {
      if (!passes(p, key)) return false;
      if (key === "craft") return p.craft === value;
      if (key === "material") return p.material === value;
      if (key === "avail") return p.stock === value;
      if (key === "deal") return discount(p) > 0;
      return true;
    }).length, [items, passes]);

  const toggle = useCallback((key: "craft" | "material" | "avail" | "deal", value: string) => {
    setShown(PAGE);
    setState((s) => ({
      ...s,
      [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value],
    }));
  }, []);

  const setPrice = useCallback((key: "min" | "max", raw: string) => {
    setShown(PAGE);
    const v = raw.trim();
    setState((s) => ({ ...s, [key]: v === "" ? null : Math.max(0, parseInt(v, 10) || 0) }));
  }, []);

  /** The craft strip is single-select: tapping the active one clears it. */
  const pickCraft = useCallback((key: string) => {
    setShown(PAGE);
    setState((s) => ({
      ...s,
      q: "",
      craft: !key || (s.craft.length === 1 && s.craft[0] === key) ? [] : [key],
    }));
  }, []);

  const drop = useCallback((key: keyof FilterState, value?: string) => {
    setShown(PAGE);
    setState((s) => {
      if (key === "q") return { ...s, q: "" };
      if (key === "min" || key === "max") return { ...s, [key]: null };
      return { ...s, [key]: (s[key] as string[]).filter((v) => v !== value) };
    });
  }, []);

  const clear = useCallback(() => { setShown(PAGE); setState(emptyFilters()); }, []);

  const activeCount =
    state.craft.length + state.material.length + state.avail.length + state.deal.length +
    (state.min != null ? 1 : 0) + (state.max != null ? 1 : 0) + (state.q ? 1 : 0);

  return {
    state, results, counts, sort, setSort, shown, setShown, PAGE,
    toggle, setPrice, pickCraft, drop, clear, activeCount,
  };
}
