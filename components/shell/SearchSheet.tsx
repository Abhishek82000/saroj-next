"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";
import Icon from "@/components/ui/Icon";
import { useLockedBody } from "@/components/ui/useLockedBody";
import { useTransition } from "@/components/ui/useMounted";
import { useStore } from "./StoreProvider";
import { crafts } from "@/lib/crafts";
import { searchProducts, type SearchHit } from "@/lib/search";

/** Splits a name so the matched run can be marked without dangerouslySetInnerHTML. */
function highlight(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return text;
  return (<>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>);
}

/** The header's search: live results from GET /api/search, in the mode the
    visitor is browsing (retail or wholesale), each one opening its product. */
export default function SearchSheet() {
  const { searchOpen, setSearchOpen, href, mode } = useStore();
  const { render, shown } = useTransition(searchOpen);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useLockedBody(searchOpen);

  useEffect(() => {
    if (!searchOpen) return;
    setQ(""); setHits([]); setCursor(-1);
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [searchOpen]);

  /* Ask the API once typing pauses; a newer keystroke cancels the older request. */
  const term = q.trim();
  useEffect(() => {
    if (!term) { setHits([]); setLoading(false); return; }
    const ctl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      searchProducts(term, mode === "wholesale", ctl.signal).then((r) => {
        if (ctl.signal.aborted) return;
        setHits(r); setCursor(-1); setLoading(false);
      });
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [term, mode]);

  const close = () => setSearchOpen(false);
  /* Through the store's `href`, so a search from wholesale stays in wholesale. */
  const go = (to: string) => { close(); router.push(href(to)); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { close(); return; }
    if (!hits.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (e.key === "ArrowDown" ? (c + 1) % hits.length : c <= 0 ? hits.length - 1 : c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = hits[cursor] ?? hits[0];
      if (pick) go(`/product/${pick.slug}`);
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
              onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
              placeholder="Ajrakh, Kalamkari, cotton, a colour…" aria-label="Search products" />
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
            </div>

            <div className="st-res" aria-live="polite" aria-busy={loading}>
              {!term ? (
                <p className="st-search__lbl">Type a name, craft or colour to search</p>
              ) : loading && hits.length === 0 ? (
                <p className="st-search__lbl">Searching…</p>
              ) : hits.length === 0 ? (
                <div className="st-res__none">
                  <h3 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.35rem", margin: "0 0 .4rem" }}>
                    No match for “{term}”
                  </h3>
                  <p>Try a craft name, a colour, or a material — cotton, Ajrakh, Kalamkari.</p>
                  <button type="button" className="st-btn" onClick={() => go("/shop")}>Browse everything</button>
                </div>
              ) : (
                hits.map((h, i) => (
                  <button type="button" key={h.slug}
                    className={`st-res__row${i === cursor ? " cur" : ""}`}
                    onClick={() => go(`/product/${h.slug}`)}>
                    <span className="st-res__ph">
                      {h.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={h.image} alt="" loading="lazy" />
                        : <Icon name="search" size={16} />}
                    </span>
                    <span className="st-res__t">
                      <span className="st-res__n">{highlight(h.name, term)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
