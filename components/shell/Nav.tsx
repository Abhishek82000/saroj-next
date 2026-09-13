"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "./StoreProvider";

const links = [
  { href: "/shop", label: "Shop all" },
  { href: "/#wheel", label: "Crafts" },
  { href: "/#shelf", label: "The Shelf" },
  { href: "/#gift", label: "The Wrap" },
  { href: "/#cloth", label: "Fabrics" },
  { href: "/#bulk", label: "Bulk" },
];

export default function Nav() {
  const { count, pulse, setCartOpen, setSearchOpen, setMenuOpen } = useStore();
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
      <Link className="st-brand" href="/"><b>Saroj Textile</b><span>Handicraft</span></Link>
      <nav aria-label="Primary">
        <ul className="st-links">
          {links.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
        </ul>
      </nav>
      <div className="st-tools">
        <button className="st-icn" onClick={() => setSearchOpen(true)} aria-label="Search the counter">
          <Icon name="search" />
        </button>
        <button className="st-icn" onClick={() => setCartOpen(true)}
          aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
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
