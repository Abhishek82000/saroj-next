"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "./StoreProvider";
import AccountMenu from "./AccountMenu";
import type { NavLink } from "@/lib/nav";

/** Shown only if the live menu couldn't be fetched. */
const fallback: NavLink[] = [
  { id: -1, label: "Shop all", href: "/shop", children: [] },
  { id: -2, label: "Crafts", href: "/#wheel", children: [] },
  { id: -3, label: "The Shelf", href: "/#shelf", children: [] },
  { id: -4, label: "The Wrap", href: "/#gift", children: [] },
  { id: -5, label: "Fabrics", href: "/#cloth", children: [] },
  { id: -6, label: "Bulk", href: "/#bulk", children: [] },
];

export default function Nav({ navMenu }: { navMenu: NavLink[] }) {
  const { count, pulse, setCartOpen, setSearchOpen, setMenuOpen, href, mode, navItem } = useStore();
  const items = navMenu.length > 0 ? navMenu : fallback;
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
      <Link className="st-brand" href={href("/")}><img width={80} src="https://www.sarojtextile.com/public/img/uploads/settings/1758459499.png" alt="Saroj Textile" /></Link>
      <nav aria-label="Primary">
        <ul className="st-links">
          {items.map((l) => {
            const item = navItem(l);
            return (
            <li key={l.id} className={l.children.length > 0 ? "has-children" : undefined}>
              <Link href={item.href}>
                {item.label}
                {l.children.length > 0 && <Icon name="down" size={11} strokeWidth={2} />}
              </Link>
              {l.children.length > 0 && (
                <div className="st-dropdown">
                  <div className="st-dropdown__panel">
                    {l.children.map((c) => <Link key={c.id} href={href(c.href)}>{c.label}</Link>)}
                  </div>
                </div>
              )}
            </li>
            );
          })}
        </ul>
      </nav>
      <div className="st-tools">
        <button className="st-icn" onClick={() => setSearchOpen(true)} aria-label="Search the counter">
          <Icon name="search" />
        </button>
        <AccountMenu />
        <button className="st-icn" onClick={() => setCartOpen(true)}
          aria-label={`${mode === "wholesale" ? "Wholesale cart" : "Cart"}, ${count} ${count === 1 ? "item" : "items"}`}>
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
