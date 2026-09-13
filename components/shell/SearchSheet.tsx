"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";
import Icon from "@/components/ui/Icon";
import { useLockedBody } from "@/components/ui/useLockedBody";
import { useTransition } from "@/components/ui/useMounted";
import { useStore } from "./StoreProvider";
import { products } from "@/lib/products";
import { crafts, craftBy } from "@/lib/crafts";
import { inr } from "@/lib/site";

/** Splits a name so the matched run can be marked without dangerouslySetInnerHTML. */
function highlight(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return text;
  return (<>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>);
}

export default function SearchSheet() {
  const { searchOpen, setSearchOpen, recent, remember } = useStore();
  const { render, shown } = useTransition(searchOpen);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useLockedBody(searchOpen);

  useEffect(() => {
    if (!searchOpen) return;
    setQ(""); setCursor(-1);
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [searchOpen]);

  const hits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
    const words = term.split(/\s+/);
    return products
      .filter((p) => {
        const hay = `${p.name} ${craftBy[p.craft]?.name ?? ""} ${p.material} ${p.kind}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => {
        const ai = a.name.toLowerCase().indexOf(term);
        const bi = b.name.toLowerCase().indexOf(term);
        if (ai !== bi) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        return b.sold - a.sold;
      });
  }, [q]);

  const shown7 = q.trim() ? hits.slice(0, 7) : hits;

  const close = () => setSearchOpen(false);
  const go = (href: string, term?: string) => { if (term) remember(term); close(); router.push(href); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { close(); return; }
    if (!shown7.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (e.key === "ArrowDown" ? (c + 1) % shown7.length : c <= 0 ? shown7.length - 1 : c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = shown7[cursor] ?? shown7[0];
      if (pick) go(`/product/${pick.slug}`, q);
    }
  };

  if (!render) return null;

  return (
    <Portal>
      <div className={`st-search on${shown ? " in" : ""}`} role="dialog" aria-modal="true" aria-label="Search the counter">
        <div className="st-search__veil" onClick={close} />
        <div className="st-search__sheet">
          <div className="st-search__field">
            <Icon name="search" size={21} />
            <input ref={input} type="search" value={q} autoComplete="off" spellCheck={false}
              onChange={(e) => { setQ(e.target.value); setCursor(-1); }} onKeyDown={onKey}
              placeholder="Pottery, Ajrakh, brass, a colour…" aria-label="Search products" />
            <button type="button" className="st-search__x" onClick={close}>Close</button>
          </div>

          <div className="st-search__body">
            <div className="st-search__side">
              <p className="st-search__lbl">Try a craft</p>
              <div className="st-sugg">
                {crafts.map((c) => (
                  <button type="button" key={c.key} onClick={() => { setQ(c.name); input.current?.focus(); }}>
                    {c.name}<span className="st-dv">{c.hindi}</span>
                  </button>
                ))}
              </div>
              {recent.length > 0 && (
                <>
                  <p className="st-search__lbl">Searched before</p>
                  <div className="st-sugg">
                    {recent.map((r) => (
                      <button type="button" key={r} onClick={() => { setQ(r); input.current?.focus(); }}>{r}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="st-res">
              {!q.trim() && <p className="st-search__lbl">Most bought this month</p>}
              {q.trim() && hits.length === 0 ? (
                <div className="st-res__none">
                  <h3 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.35rem", margin: "0 0 .4rem" }}>
                    No match for “{q}”
                  </h3>
                  <p>Try a craft name, a colour, or a material — cotton, brass, marble.</p>
                  <button type="button" className="st-btn" onClick={() => go("/shop")}>Browse everything</button>
                </div>
              ) : (
                <>
                  {shown7.map((p, i) => (
                    <button type="button" key={p.slug}
                      className={`st-res__row${i === cursor ? " cur" : ""}`}
                      onClick={() => go(`/product/${p.slug}`, q)}>
                      <span className="st-res__ph">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images[0].src} alt="" loading="lazy" />
                      </span>
                      <span className="st-res__t">
                        <span className="st-res__n">{highlight(p.name, q.trim())}</span>
                        <span className="st-res__m">{craftBy[p.craft]?.name} · {p.material}</span>
                      </span>
                      <span className="st-res__p">{inr(p.price)}</span>
                    </button>
                  ))}
                  {q.trim() && hits.length > 0 && (
                    <div className="st-res__foot">
                      <button type="button" className="st-btn st-btn--solid"
                        onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`, q)}>
                        Show all {hits.length} result{hits.length === 1 ? "" : "s"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
