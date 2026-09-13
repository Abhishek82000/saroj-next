"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/lib/types";
import { site } from "@/lib/site";

const CART_KEY = "saroj.cart";
const FAV_KEY = "saroj.favs";
const RECENT_KEY = "saroj.recent";

/** localStorage that never throws — private mode, sandboxed frames, SSR. */
const safe = {
  read<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  write(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

interface Store {
  cart: CartLine[];
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  subtotal: number;
  count: number;
  shortOfFreeShipping: number;

  favs: Record<string, true>;
  toggleFav: (slug: string) => void;

  recent: string[];
  remember: (q: string) => void;

  cartOpen: boolean; setCartOpen: (v: boolean) => void;
  searchOpen: boolean; setSearchOpen: (v: boolean) => void;
  menuOpen: boolean; setMenuOpen: (v: boolean) => void;

  toast: string | null;
  say: (message: string) => void;
  /** Bumps when a line is added, so the nav badge can animate. */
  pulse: number;
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favs, setFavs] = useState<Record<string, true>>({});
  const [recent, setRecent] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Read once on the client so the server render stays deterministic. */
  useEffect(() => {
    setCart(safe.read<CartLine[]>(CART_KEY, []));
    setFavs(safe.read<Record<string, true>>(FAV_KEY, {}));
    setRecent(safe.read<string[]>(RECENT_KEY, []));
    hydrated.current = true;
  }, []);

  useEffect(() => { if (hydrated.current) safe.write(CART_KEY, cart); }, [cart]);
  useEffect(() => { if (hydrated.current) safe.write(FAV_KEY, favs); }, [favs]);
  useEffect(() => { if (hydrated.current) safe.write(RECENT_KEY, recent); }, [recent]);

  const say = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const add: Store["add"] = useCallback((line) => {
    const qty = line.qty ?? 1;
    setCart((prev) => {
      const found = prev.find((l) => l.id === line.id);
      if (found) {
        return prev.map((l) => (l.id === line.id ? { ...l, qty: round(l.qty + qty) } : l));
      }
      return [...prev, { ...line, qty }];
    });
    setPulse((n) => n + 1);
    say("Added · " + line.name.slice(0, 32));
  }, [say]);

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty: round(qty) } : l)));
  }, []);

  const remove = useCallback((id: string) => setCart((prev) => prev.filter((l) => l.id !== id)), []);

  const toggleFav = useCallback((slug: string) => {
    setFavs((prev) => {
      const next = { ...prev };
      if (next[slug]) { delete next[slug]; say("Removed from saved"); }
      else { next[slug] = true; say("Saved for later"); }
      return next;
    });
  }, [say]);

  const remember = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    setRecent((prev) => [term, ...prev.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 5));
  }, []);

  const subtotal = useMemo(() => cart.reduce((a, l) => a + l.price * l.qty, 0), [cart]);

  const value: Store = {
    cart, add, setQty, remove,
    subtotal,
    count: cart.length,
    shortOfFreeShipping: Math.max(0, site.freeShippingOver - subtotal),
    favs, toggleFav,
    recent, remember,
    cartOpen, setCartOpen,
    searchOpen, setSearchOpen,
    menuOpen, setMenuOpen,
    toast, say, pulse,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Lengths come in half metres, so keep one decimal and no float dust. */
const round = (n: number) => Math.round(n * 10) / 10;
