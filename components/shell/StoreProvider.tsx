"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine, Product } from "@/lib/types";
import type { User } from "@/lib/auth";
import { site } from "@/lib/site";
import { WHOLESALE_HOME, isWholesalePath, swapMode, wholesaleHref, wholesaleRate } from "@/lib/wholesale";
import { getWishlist, setWishlistRemote } from "@/lib/wishlist";
import { getCounts, type Counts } from "@/lib/counts";

/** Retail shows the ordinary catalogue; wholesale shows trade rates, GST extra.
    Which one is on is decided by the URL — everything under /wholesale-fabric and
    /wholesale is wholesale — so it can be linked to, bookmarked and refreshed. */
export type Mode = "retail" | "wholesale";

/** Retail and wholesale each have their own cart. The retail one belongs to the
    browser; the wholesale one belongs to the logged-in account, so it's stored
    under the mobile number and is empty while logged out. */
const CART_KEY = "saroj.cart";
const wholesaleCartKey = (mobile: string) => `saroj.cart.wholesale.${mobile}`;
const USER_KEY = "saroj.user";
/** Retail and wholesale each keep their own wishlist. */
const FAV_KEY: Record<Mode, string> = { retail: "saroj.favs", wholesale: "saroj.favs.wholesale" };
type Favs = Record<string, true>;
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
  /** The cart of the current mode — retail or wholesale, never both. */
  cart: CartLine[];
  /** Puts a line in `m`'s cart (retail by default). Catalogue pieces go through `addProduct`. */
  add: (line: Omit<CartLine, "qty"> & { qty?: number }, m?: Mode) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  subtotal: number;
  count: number;
  /** How many lines the other mode's cart holds, so the drawer can point to it. */
  otherCount: number;
  shortOfFreeShipping: number;

  /** Adds a catalogue piece to the current mode's cart at that mode's price. In
      wholesale mode that means the trade rate, its minimum length, and a login first. */
  addProduct: (p: Product, qty?: number) => void;

  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  /** True once the saved cart, favourites and login have been read from this device. */
  hydrated: boolean;
  /** Edit the signed-in user's name/email (kept on this device). */
  updateUser: (patch: Partial<Pick<User, "name" | "email">>) => void;
  loginOpen: boolean;
  /** Why the login modal opened ("Log in to add wholesale products to cart"). */
  loginReason: string | null;
  openLogin: (reason?: string) => void;
  closeLogin: () => void;
  /** Runs `action` now if logged in; otherwise opens login and runs it once they are. */
  withLogin: (reason: string, action: () => void) => void;

  mode: Mode;
  /** Goes to the other mode's twin of the current page (same category or piece where there is one). */
  switchMode: (m: Mode) => void;
  /** Rewrites a retail link so it stays inside the current mode. */
  href: (retailHref: string) => string;
  /** A menu entry as it should read in the current mode. The "Wholesale @80" entry is
      the switch itself: in wholesale mode it becomes "Retail" and leads back to this
      same page's retail twin. */
  navItem: (link: { label: string; href: string }) => { label: string; href: string };

  /** The current mode's wishlist, keyed by product slug. */
  favs: Favs;
  /** Both wishlists — the account page shows either one whatever the URL's mode. */
  wishlist: Record<Mode, Favs>;
  /** Saves/unsaves a piece in `m`'s wishlist (the current mode's by default). */
  toggleFav: (p: Product, m?: Mode) => void;
  /** The current mode's wishlist size for the header badge — the account's
      server-side count (GET /api/auth/count-data) once known, else local. */
  favCount: number;

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
  const [retail, setRetail] = useState<CartLine[]>([]);
  const [wh, setWh] = useState<{ owner: string | null; lines: CartLine[] }>({ owner: null, lines: [] });
  const [wishlist, setWishlist] = useState<Record<Mode, Favs>>({ retail: {}, wholesale: {} });
  const [counts, setCounts] = useState<Counts | null>(null);
  const refreshCounts = useCallback((token?: string) => {
    if (token) getCounts(token).then((c) => { if (c) setCounts(c); });
  }, []);
  const [recent, setRecent] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const mode: Mode = isWholesalePath(pathname) ? "wholesale" : "retail";
  /* State, not a ref: the save effects below must not run until the saved values have been
     read back, or (with React's dev double-mount) they overwrite them with empty ones. */
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Fire-and-forget: pulls both lists' saved slugs from GET /api/auth/wishlist
      and unions them into the local wishlists, so a piece saved on another device shows
      up here too. Never blocks or surfaces an error — the local list is
      already the source of truth for what the UI shows. */
  const syncWishlist = useCallback((token: string) => {
    for (const m of ["retail", "wholesale"] as const) {
      getWishlist(token, m === "wholesale").then((r) => {
        if (!r.ok) return;
        setWishlist((prev) => {
          const next = { ...prev[m] };
          for (const slug of r.slugs) next[slug] = true;
          return { ...prev, [m]: next };
        });
      });
    }
  }, []);

  /* Read once on the client so the server render stays deterministic. */
  useEffect(() => {
    setRetail(safe.read<CartLine[]>(CART_KEY, []));
    setWishlist({ retail: safe.read<Favs>(FAV_KEY.retail, {}), wholesale: safe.read<Favs>(FAV_KEY.wholesale, {}) });
    setRecent(safe.read<string[]>(RECENT_KEY, []));
    const saved = safe.read<User | null>(USER_KEY, null);
    setUser(saved);
    if (saved) {
      setWh({ owner: saved.mobile, lines: safe.read<CartLine[]>(wholesaleCartKey(saved.mobile), []) });
      if (saved.token) { syncWishlist(saved.token); refreshCounts(saved.token); }
    }
    setHydrated(true);
  }, [syncWishlist, refreshCounts]);

  useEffect(() => { if (hydrated) safe.write(CART_KEY, retail); }, [hydrated, retail]);
  useEffect(() => { if (hydrated && wh.owner) safe.write(wholesaleCartKey(wh.owner), wh.lines); }, [hydrated, wh]);
  useEffect(() => {
    if (!hydrated) return;
    safe.write(FAV_KEY.retail, wishlist.retail);
    safe.write(FAV_KEY.wholesale, wishlist.wholesale);
  }, [hydrated, wishlist]);
  useEffect(() => { if (hydrated) safe.write(RECENT_KEY, recent); }, [hydrated, recent]);
  useEffect(() => { if (hydrated) safe.write(USER_KEY, user); }, [hydrated, user]);

  const say = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /** Edits one mode's cart, whichever page the shopper happens to be on. */
  const mutate = useCallback((kind: Mode, fn: (lines: CartLine[]) => CartLine[]) => {
    if (kind === "wholesale") setWh((w) => ({ ...w, lines: fn(w.lines) }));
    else setRetail(fn);
  }, []);

  const addTo = useCallback((kind: Mode, line: Omit<CartLine, "qty"> & { qty?: number }) => {
    const qty = line.qty ?? 1;
    mutate(kind, (prev) => {
      const found = prev.find((l) => l.id === line.id);
      if (found) {
        return prev.map((l) => (l.id === line.id ? { ...l, qty: round(l.qty + qty) } : l));
      }
      return [...prev, { ...line, qty }];
    });
    setPulse((n) => n + 1);
    say("Added · " + line.name.slice(0, 32));
  }, [mutate, say]);

  const add: Store["add"] = useCallback((line, m = "retail") => addTo(m, line), [addTo]);

  const setQty = useCallback((id: string, qty: number) => {
    mutate(mode, (prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty: round(qty) } : l)));
  }, [mutate, mode]);

  const remove = useCallback((id: string) => mutate(mode, (prev) => prev.filter((l) => l.id !== id)), [mutate, mode]);

  const openLogin = useCallback((reason?: string) => {
    setLoginReason(reason ?? null);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    pending.current = null;
  }, []);

  const withLogin = useCallback((reason: string, action: () => void) => {
    if (user) { action(); return; }
    pending.current = action;
    openLogin(reason);
  }, [user, openLogin]);

  const login = useCallback((u: User) => {
    setUser(u);
    /* Set before the pending action runs, so a wholesale add lands in this account's cart. */
    setWh({ owner: u.mobile, lines: safe.read<CartLine[]>(wholesaleCartKey(u.mobile), []) });
    if (u.token) { syncWishlist(u.token); refreshCounts(u.token); }
    setLoginOpen(false);
    say(`Welcome, ${u.name.split(" ")[0]}`);
    const next = pending.current;
    pending.current = null;
    next?.();
  }, [say, syncWishlist, refreshCounts]);

  const updateUser = useCallback((patch: Partial<Pick<User, "name" | "email">>) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const logout = useCallback(() => {
    setUser(null);
    setWh({ owner: null, lines: [] });
    setCounts(null);
    say("Logged out");
  }, [say]);

  const switchMode = useCallback((m: Mode) => router.push(swapMode(pathname, m)), [router, pathname]);
  const href = useCallback((retail: string) => (mode === "wholesale" ? wholesaleHref(retail) : retail), [mode]);
  const navItem: Store["navItem"] = useCallback((link) => (
    mode === "wholesale" && (link.href ?? "").replace(/^https?:\/\/[^/]+/, "").replace(/\/+$/, "") === WHOLESALE_HOME
      ? { label: "Retail", href: swapMode(pathname, "retail") }
      : { label: link.label, href: href(link.href) }
  ), [mode, pathname, href]);

  const addProduct: Store["addProduct"] = useCallback((p, qty) => {
    if (mode === "retail") {
      add({
        id: p.slug, name: p.name, price: p.price, unit: p.unit, image: p.images[0].src,
        step: p.cut?.step ?? 1, qty: qty ?? (p.cut ? 2.5 : 1), href: `/product/${p.slug}`,
      });
      return;
    }
    const rate = wholesaleRate(p);
    if (!rate) { say("This piece isn't sold wholesale"); return; }
    const line = {
      id: p.slug, name: p.name, price: rate.price, unit: p.unit, image: p.images[0].src,
      step: p.cut?.step ?? (p.unit === "metre" ? 0.5 : 1), qty: Math.max(qty ?? 0, rate.minQty),
      href: wholesaleHref(`/product/${p.slug}`), minQty: rate.minQty,
    };
    withLogin("Log in to add wholesale products to cart", () => addTo("wholesale", line));
  }, [mode, add, addTo, say, withLogin]);

  const toggleFav = useCallback((p: Product, m: Mode = mode) => {
    withLogin("Log in to save pieces for later", () => {
      const saved = !!wishlist[m][p.slug];
      setWishlist((prev) => {
        const next = { ...prev[m] };
        if (saved) delete next[p.slug];
        else next[p.slug] = true;
        return { ...prev, [m]: next };
      });
      say(saved ? "Removed from wishlist" : "Saved to wishlist");
      /* Fire-and-forget: mirrors the flip server-side. The local state above
         is what the UI shows either way. Only live pieces have the numeric
         id the API wants. */
      const token = user?.token;
      if (token && p.live?.id) setWishlistRemote(token, p.live.id, m === "wholesale", !saved).then(() => refreshCounts(token));
    });
  }, [mode, wishlist, say, withLogin, user, refreshCounts]);

  const remember = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    setRecent((prev) => [term, ...prev.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 5));
  }, []);

  const cart = mode === "wholesale" ? wh.lines : retail;
  const otherCount = (mode === "wholesale" ? retail : wh.lines).length;
  const total = (lines: CartLine[]) => lines.reduce((a, l) => a + l.price * l.qty, 0);
  const subtotal = useMemo(() => total(cart), [cart]);
  /** Free shipping is a retail offer, so it's measured against the retail cart alone. */
  const retailSubtotal = useMemo(() => total(retail), [retail]);

  const value: Store = {
    cart, add, setQty, remove,
    subtotal,
    count: cart.length,
    otherCount,
    shortOfFreeShipping: Math.max(0, site.freeShippingOver - retailSubtotal),
    addProduct,
    user, login, logout, hydrated, updateUser, loginOpen, loginReason, openLogin, closeLogin, withLogin,
    mode, switchMode, href, navItem,
    favs: wishlist[mode], wishlist, toggleFav,
    favCount: (user && counts?.wishlist[mode]) ?? Object.keys(wishlist[mode]).length,
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
