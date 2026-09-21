"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchVariation } from "@/lib/product-api";
import type { PriceBlock, VariantGroup } from "@/lib/types";

export interface VariantState {
  variationId: number | null;
  price: PriceBlock | null;
  image: string | null;
  stock: number | null;
  /** The chosen term names, in attribute order — what the API keys on. */
  combination: string;
}

/**
 * Colour, size and swatch pickers for a variable product (product_type 1).
 * Every change asks the API for that combination's price, image and stock
 * rather than trusting anything cached in the page.
 */
export default function VariantPicker({
  productId, groups, wholesale, onChange,
}: {
  productId: number;
  groups: VariantGroup[];
  wholesale: boolean;
  onChange: (state: VariantState) => void;
}) {
  const [picked, setPicked] = useState<string[]>(() => groups.map((g) => g.default ?? g.terms[0]?.name ?? ""));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const first = useRef(true);

  const load = useCallback(async (names: string[]) => {
    const combination = names.join(",");
    setBusy(true);
    setProblem(null);
    const data = await fetchVariation(productId, combination, wholesale);
    setBusy(false);
    if (!data) {
      setProblem("That combination isn’t in stock — try another.");
      onChange({ variationId: null, price: null, image: null, stock: 0, combination });
      return;
    }
    onChange({
      variationId: data.variation_id,
      price: data.price,
      image: data.image,
      stock: data.stock,
      combination,
    });
  }, [productId, wholesale, onChange]);

  /* The server already sent the default combination's price, so skip the
     first round trip and only fetch once the shopper actually changes one. */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    load(picked);
  }, [picked, load]);

  const choose = (index: number, name: string) =>
    setPicked((prev) => prev.map((v, i) => (i === index ? name : v)));

  return (
    <div className="st-variants">
      {groups.map((g) => (
        <div className="st-variant" key={g.index}>
          <div className="st-variant__lbl">
            {g.attribute}: <span>{picked[g.index]}</span>
          </div>

          <div className={`st-variant__opts st-variant__opts--${g.type === 1 ? "colour" : g.type === 3 ? "text" : "image"}`}>
            {g.terms.map((t) => {
              const on = picked[g.index] === t.name;

              if (g.type === 1) {
                return (
                  <button type="button" key={t.id} className={`st-swatch${on ? " on" : ""}`}
                    aria-pressed={on} aria-label={t.name} title={t.name}
                    onClick={() => choose(g.index, t.name)}>
                    <span style={{ background: t.value ?? "#ccc" }} />
                  </button>
                );
              }

              if (g.type === 3) {
                return (
                  <button type="button" key={t.id} className={`st-sizebtn${on ? " on" : ""}`}
                    aria-pressed={on} onClick={() => choose(g.index, t.name)}>
                    {t.name}
                  </button>
                );
              }

              return (
                <button type="button" key={t.id} className={`st-imgswatch${on ? " on" : ""}`}
                  aria-pressed={on} onClick={() => choose(g.index, t.name)}>
                  {t.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={t.image} alt="" loading="lazy" />
                    : <span className="st-imgswatch__none" />}
                  <small>{t.name}</small>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {busy && <p className="st-variant__busy">Checking that combination…</p>}
      {problem && <p className="st-variant__warn">{problem}</p>}
    </div>
  );
}
