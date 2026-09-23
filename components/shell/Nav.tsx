"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "./StoreProvider";
import AccountMenu from "./AccountMenu";
import { resolveHref, isMega, splitMegaChildren, type CommonMenuItem } from "@/lib/nav";

function getImage(item: CommonMenuItem): string | null {
  return (item as unknown as { image?: string | null }).image ?? null;
}

/**
 * Shown only if the live menu couldn't be fetched. Cast to CommonMenuItem
 * since the fallback doesn't need to carry mega/image/pages data — these
 * items always render as plain links (no children).
 */
const fallback = [
  { id: -1, name: "Shop all", link: "/shop", categories: [], children: [] },
  { id: -2, name: "Crafts", link: "/#wheel", categories: [], children: [] },
  { id: -3, name: "The Shelf", link: "/#shelf", categories: [], children: [] },
  { id: -4, name: "The Wrap", link: "/#gift", categories: [], children: [] },
  { id: -5, name: "Fabrics", link: "/#cloth", categories: [], children: [] },
  { id: -6, name: "Bulk", link: "/#bulk", categories: [], children: [] },
] as unknown as CommonMenuItem[];

export default function Nav({ navMenu }: { navMenu: CommonMenuItem[] }) {
  const { count, pulse, setCartOpen, setSearchOpen, setMenuOpen, href, mode } = useStore();
  const items = navMenu?.length > 0 ? navMenu : fallback;
  const [stuck, setStuck] = useState(false);
  const badge = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Replay the bump keyframe each time something lands in the cart. */
  useEffect(() => {
    const el = badge.current;
    if (!el || !pulse) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }, [pulse]);

  /* A slash or ⌘K opens search from anywhere that isn't a field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? "";
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <header className={`st-nav${stuck ? " stuck" : ""}`}>
      <Link className="st-brand" href={href("/")}>
        <img width={80} src="https://www.sarojtextile.com/public/img/uploads/settings/1758459499.png" alt="Saroj Textile" />
      </Link>

      <nav aria-label="Primary">
        <ul className="st-links">
          {items.map((item) => (
            <NavItem key={item.id} item={item} resolve={href} />
          ))}
        </ul>
      </nav>

      <div className="st-tools">
        <button className="st-icn" onClick={() => setSearchOpen(true)} aria-label="Search the counter">
          <Icon name="search" />
        </button>
        <AccountMenu />
        <button
          className="st-icn"
          onClick={() => setCartOpen(true)}
          aria-label={`${mode === "wholesale" ? "Wholesale cart" : "Cart"}, ${count} ${count === 1 ? "item" : "items"}`}
        >
          <Icon name="cart" />
          <span ref={badge} className={`st-count${count ? " on" : ""}`} aria-hidden="true">
            {count > 99 ? "99+" : count}
          </span>
        </button>
        <button className="st-icn st-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* One top-level nav item: plain link, single-block dropdown, or a     */
/* full-width mega menu — picked from `mega` + whether it has children.*/
/* ------------------------------------------------------------------ */

function NavItem({ item, resolve }: { item: CommonMenuItem; resolve: (h: string) => string }) {
  const itemHref = resolve(resolveHref(item));
  const children = item.children ?? [];

  // No children -> just a link, nothing to open.
  if (children.length === 0) {
    return (
      <li>
        <Link href={itemHref}>{item.name}</Link>
      </li>
    );
  }

  // Has children, mega flag off -> single-block dropdown.
  if (!isMega(item)) {
    return (
      <li className="has-children">
        <Link href={itemHref}>
          {item.name} <Icon name="down" size={11} strokeWidth={2} />
        </Link>
        <div className="st-dropdown">
          <div className="st-dropdown__panel">
            {children.map((c) => (
              <Link key={c.id} href={resolve(resolveHref(c))}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </li>
    );
  }

  // mega === 1 -> full-width mega menu, with up to 2 image tiles in their
  // own column at the end.
  const { textChildren, imageChildren } = splitMegaChildren(children);
  const COLS = 4;
  const perCol = Math.max(1, Math.ceil(textChildren.length / COLS));
  const columns: CommonMenuItem[][] = [];
  for (let i = 0; i < textChildren.length; i += perCol) {
    columns.push(textChildren.slice(i, i + perCol));
  }

  return (
    <li className="has-children">
      <Link href={itemHref}>
        {item.name} <Icon name="down" size={11} strokeWidth={2} />
      </Link>
      <div className="st-dropdown st-dropdown--mega">
        <div className="st-mega__panel">
          {columns.map((col, i) => (
            <div className="st-mega__col" key={i}>
              {col.map((c) => (
                <Link key={c.id} href={resolve(resolveHref(c))}>
                  {c.name}
                </Link>
              ))}
            </div>
          ))}

          {imageChildren.length > 0 && (
            <div className="st-mega__col st-mega__col--images">
              {imageChildren.map((c) => (
                <Link key={c.id} href={resolve(resolveHref(c))} className="st-mega__image">
                  <img src={getImage(c) as string} alt={c.name} loading="lazy" />
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
