"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  { id: -2, name: "Handicraft", link: "/handicraft", categories: [], children: [] },
  { id: -3, name: "The Shelf", link: "/#shelf", categories: [], children: [] },
  { id: -4, name: "The Wrap", link: "/#gift", categories: [], children: [] },
  { id: -5, name: "Fabrics", link: "/#cloth", categories: [], children: [] },
  { id: -6, name: "Bulk", link: "/#bulk", categories: [], children: [] },
  { id: -7, name: "Wholesale @80", link: "/wholesale-fabric", categories: [], children: [] },
] as unknown as CommonMenuItem[];

export default function Nav({ navMenu }: { navMenu: CommonMenuItem[] }) {
  const { count, pulse, setCartOpen, setSearchOpen, setMenuOpen, href, navItem, mode, favCount, withLogin } = useStore();
  const router = useRouter();
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
            <NavItem key={item.id} item={item} resolve={href} link={navItem} />
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
          onClick={() => withLogin("Log in to see your wishlist", () => router.push(`/account/wishlist${mode === "wholesale" ? "/wholesale" : ""}`))}
          aria-label={`Wishlist, ${favCount} ${favCount === 1 ? "item" : "items"}`}
        >
          <Icon name="heart" />
          <span className={`st-count${favCount ? " on" : ""}`} aria-hidden="true">
            {favCount > 99 ? "99+" : favCount}
          </span>
        </button>
        <button
          className="st-icn"
          onClick={() => (mode === "wholesale"
            ? withLogin("Log in to see your wholesale cart", () => setCartOpen(true))
            : setCartOpen(true))}
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

function NavItem({ item, resolve, link }: {
  item: CommonMenuItem;
  resolve: (h: string) => string;
  /** The store's `navItem` — turns "Wholesale @80" into "Retail" while in wholesale mode. */
  link: (l: { label: string; href: string }) => { label: string; href: string };
}) {
  const itemHref = resolve(resolveHref(item));
  const children = item.children ?? [];
  /* The dropdown opens on :hover / :focus-within, so after a link in it is
     clicked the pointer and focus still hold it open over the new page.
     `shut` hides it until the pointer leaves the item. */
  const [shut, setShut] = useState(false);
  const menuProps = {
    className: `has-children${shut ? " shut" : ""}`,
    onClick: (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest("a")) return;
      setShut(true);
      (document.activeElement as HTMLElement | null)?.blur();
    },
    onMouseLeave: () => setShut(false),
  };

  // No children -> just a link, nothing to open.
  if (children.length === 0) {
    const l = link({ label: item.name, href: resolveHref(item) });
    return (
      <li>
        <Link href={l.href}>{l.label}</Link>
      </li>
    );
  }

  // Has children, mega flag off -> single-block dropdown.
  if (!isMega(item)) {
    return (
      <li {...menuProps}>
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
    <li {...menuProps}>
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
