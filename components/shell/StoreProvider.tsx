"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine, Product } from "@/lib/types";
import type { User } from "@/lib/auth";
import { site } from "@/lib/site";
import { WHOLESALE_HOME, isWholesalePath, swapMode, wholesaleHref, wholesaleRate } from "@/lib/wholesale";
import { getWishlist, setWishlistRemote, type Lists } from "@/lib/wishlist";
import { getCounts, type Counts } from "@/lib/counts";
import {
  addToCartRemote, getCartRemote, removeCartRemote, sameLine, syncCartRemote, updateCartRemote,
  type ServerCartLine,
} from "@/lib/cart";

/** Retail shows the ordinary catalogue; wholesale shows trade rates, GST extra.
    Which one is on is decided by the URL — everything under /wholesale-fabric and
    /wholesale is wholesale — so it can be linked to, bookmarked and refreshed. */
export type Mode = "retail" | "wholesale";

/** Retail and wholesale each have their own cart. Retail is open to guests —
    add to cart and check out without a login (checkout collects the details) —
    and a guest's cart is kept in this browser, since the server keeps none.
    Once logged in, both carts are the account's and come from the API only:
    the guest's lines are handed over on login (POST /api/cart/sync) and
    nothing is stored locally. Wholesale needs a login, so it's never local. */
const RETAIL_CART_KEY = "saroj.cart";
/** The coupon code applied to the retail cart. Only the code is kept — the
    server re-checks it and works out the discount on every price call. */
const COUPON_KEY = "saroj.coupon";
/** Where older builds kept each account's wholesale cart; cleared on load. */
const isOldWholesaleCartKey = (k: string) => k.startsWith("saroj.cart.wholesale.");
const USER_KEY = "saroj.user";
/** The wishlist lives on the server only (lib/wishlist.ts) — nothing about it
    is kept in the browser, and it's empty while logged out. */
const EMPTY_WISHLIST: Record<Mode, Favs> = { retail: {}, wholesale: {} };
/** Where older builds kept a copy of the wishlist; cleared on load. */
const isOldFavKey = (k: string) => k === "saroj.favs" || k.startsWith("saroj.favs.");
type Favs = Record<string, true>;
const toFavs = (lists: Lists): Record<Mode, Favs> => ({
  retail: Object.fromEntries(lists.retail.map((slug) => [slug, true as const])),
  wholesale: Object.fromEntries(lists.wholesale.map((slug) => [slug, true as const])),
});

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
  /** Puts a line in `m`'s cart (retail by default) — wholesale only after a login. Catalogue pieces go through `addProduct`. */
  add: (line: Omit<CartLine, "qty"> & { qty?: number }, m?: Mode) => void;
  setQty: (id: string, qty: number) => void;
  /** Writes the server's prices (POST /api/cart/price) onto `m`'s matching lines. */
  reprice: (m: Mode, items: ServerCartLine[]) => void;
  remove: (id: string) => void;
  /** Empties `m`'s cart on this device (retail drops its coupon too) — after an order. The server clears its own copy. */
  clearCart: (m: Mode) => void;
  subtotal: number;
  count: number;
  /** How many lines the other mode's cart holds, so the drawer can point to it. */
  otherCount: number;
  /** Local estimate against site.freeShippingOver, until the server's `offers.shipping` arrives. */
  shortOfFreeShipping: number;
  /** The retail cart's applied coupon code (lib/offers.ts), or null. */
  coupon: string | null;
  setCoupon: (code: string | null) => void;

  /** Adds a catalogue piece to the current mode's cart at that mode's price. In
      wholesale mode that means the trade rate, its minimum length, and a login first. */
  addProduct: (p: Product, qty?: number) => void;

  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  /** True once the saved cart, favourites and login have been read from this device. */
  hydrated: boolean;
  /** Edit the signed-in user's name/email/address (kept on this device). */
  updateUser: (patch: Partial<Pick<User, "name" | "email" | "address">>) => void;
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
  /** Both wishlists' size together (retail + wholesale) for the header badge. */
  favCount: number;


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
  const [wishlist, setWishlist] = useState<Record<Mode, Favs>>(EMPTY_WISHLIST);
  /* Latest user and wishlist for callbacks that run as the pending action right
     after login, whose closures still hold the logged-out values. */
  const userRef = useRef<User | null>(null);
  const wishlistRef = useRef(wishlist);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const mode: Mode = isWholesalePath(pathname) ? "wholesale" : "retail";
  userRef.current = user;
  wishlistRef.current = wishlist;
  /* State, not a ref: the save effects below must not run until the saved values have been
     read back, or (with React's dev double-mount) they overwrite them with empty ones. */
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** The header badges' numbers from GET /api/auth/count-data — logged in only.
      Re-read shortly after anything that changes the server's cart or
      wishlist; a burst of changes makes one call. */
  const [counts, setCounts] = useState<Counts | null>(null);
  const countsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refreshCounts = useCallback(() => {
    clearTimeout(countsTimer.current);
    countsTimer.current = setTimeout(() => {
      const t = userRef.current?.token;
      if (!t) return;
      getCounts(t).then((c) => { if (c && userRef.current?.token === t) setCounts(c); });
    }, 400);
  }, []);

  /** Loads both wishlists from the account (GET /api/auth/wishlist). Once per
      session token — React's dev double-mount would otherwise ask twice — and
      asked again next time if the call failed. */
  const wishlistSyncedFor = useRef<string | null>(null);
  const syncWishlist = useCallback((token: string) => {
    if (wishlistSyncedFor.current === token) return;
    wishlistSyncedFor.current = token;
    getWishlist(token).then((r) => {
      if (!r.ok) { wishlistSyncedFor.current = null; return; }
      setWishlist(toFavs(r.lists));
    });
  }, []);

  /* Read once on the client so the server render stays deterministic. */
  useEffect(() => {
    const saved = safe.read<User | null>(USER_KEY, null);
    /* Logged in: the cart comes from the API only (syncCart) — nothing local.
       Logged out: the guest's own lines; any with a cartId were an account's. */
    setRetail(saved ? [] : safe.read<CartLine[]>(RETAIL_CART_KEY, []).filter((l) => !l.cartId));
    setCoupon(safe.read<string | null>(COUPON_KEY, null));
    setUser(saved);
    if (saved) {
      setWh({ owner: saved.mobile, lines: [] });
      if (saved.token) syncWishlist(saved.token);
    }
    try {
      Object.keys(window.localStorage).filter((k) => isOldFavKey(k) || isOldWholesaleCartKey(k))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch { /* storage blocked — nothing to clear */ }
    setHydrated(true);
  }, [syncWishlist]);

  /* Only a guest's cart is kept on this device; a logged-in account's lives on the server. */
  useEffect(() => { if (hydrated) safe.write(RETAIL_CART_KEY, user ? [] : retail); }, [hydrated, retail, user]);
  useEffect(() => { if (hydrated) safe.write(COUPON_KEY, coupon); }, [hydrated, coupon]);
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

  /* Latest carts, so an add can tell the server what the line now holds in total. */
  const cartsRef = useRef<Record<Mode, CartLine[]>>({ retail: [], wholesale: [] });
  cartsRef.current = { retail, wholesale: wh.lines };
  /** Adds still on their way to the server, by `<mode>:<line id>`. */
  const pendingAdds = useRef(new Map<string, Promise<void>>());

  const addTo = useCallback((kind: Mode, line: Omit<CartLine, "qty"> & { qty?: number }) => {
    const qty = line.qty ?? 1;
    /* Fire-and-forget: mirror the add server-side (POST /api/cart/add, see
       lib/cart.ts). Only live pieces carry the product id it needs. */
    if (line.productId) {
      const had = cartsRef.current[kind].find((l) => l.id === line.id)?.qty ?? 0;
      const pendingKey = `${kind}:${line.id}`;
      const request = addToCartRemote({
        type: kind,
        product_id: line.productId,
        variation_id: line.variationId ?? null,
        qty,
        ...(kind === "retail" ? { current_qty: had } : {}),
      }, userRef.current?.token).then((r) => {
        /* A logged-in account's line comes back with its server id — keep it for update/remove. */
        const cartId = r.ok ? r.line?.cart_id : null;
        if (cartId) mutate(kind, (prev) => prev.map((l) => (l.id === line.id ? { ...l, cartId } : l)));
        refreshCounts();
      });
      /* A − / + / Remove that follows waits for this add to land first (see serverLine). */
      const settled = request.then(() => undefined);
      pendingAdds.current.set(pendingKey, settled);
      settled.then(() => { if (pendingAdds.current.get(pendingKey) === settled) pendingAdds.current.delete(pendingKey); });
    }
    mutate(kind, (prev) => {
      const found = prev.find((l) => l.id === line.id);
      if (found) {
        return prev.map((l) => (l.id === line.id ? { ...l, qty: round(l.qty + qty) } : l));
      }
      return [...prev, { ...line, qty }];
    });
    setPulse((n) => n + 1);
    say("Added · " + line.name.slice(0, 32));
  }, [mutate, say, refreshCounts]);


  /** After a login (or on load with a saved one): lines this browser holds
      that the server doesn't know yet — no cart id, e.g. added as a guest —
      are handed to the account with POST /api/cart/sync, then the account's
      cart (GET /api/cart?type=…) is read back and becomes the whole cart —
      nothing local is kept. A failed call leaves the local cart as it is. */
  const syncCart = useCallback(async (token: string) => {
    for (const kind of ["retail", "wholesale"] as const) {
      const guest = cartsRef.current[kind].filter((l) => l.productId && !l.cartId);
      const synced = guest.length ? (await syncCartRemote(kind, guest, token)).ok : true;
      const server = await getCartRemote(kind, token);
      if (!server) continue;
      /* The account's cart replaces the local one. If the sync failed, keep the
         guest lines rather than lose them. */
      const onServer = new Set(server.map((l) => l.id));
      mutate(kind, (prev) => synced ? server : [
        ...server,
        ...prev.filter((l) => !onServer.has(l.id) && l.productId && !l.cartId),
      ]);
    }
    refreshCounts();
  }, [mutate, refreshCounts]);

  const reprice = useCallback((kind: Mode, items: ServerCartLine[]) => {
    mutate(kind, (prev) => {
      let changed = false;
      const next = prev.map((l) => {
        const s = items.find((x) => sameLine(l, x));
        if (!s || s.error || !s.price) return l;
        const upd = {
          ...l,
          price: s.price,
          ...(s.name ? { name: l.variationId ? l.name : s.name } : {}),
          ...(s.image ? { image: s.image } : {}),
          ...(s.step ? { step: s.step } : {}),
          ...(s.min_qty ? { minQty: s.min_qty } : {}),
        };
        if (upd.price !== l.price || upd.image !== l.image || upd.step !== l.step || upd.name !== l.name || upd.minQty !== l.minQty) changed = true;
        return upd;
      });
      return changed ? next : prev;
    });
  }, [mutate]);

  /* On load with a saved login, and on every login. */
  const token = user?.token;
  /* Once per session token — React's dev double-mount would otherwise send it all twice. */
  const cartSyncedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || !token || cartSyncedFor.current === token) return;
    cartSyncedFor.current = token;
    syncCart(token);
  }, [hydrated, token, syncCart]);

  /* − / + and Remove: the local cart changes at once; a logged-in account's
     server line is told too — PATCH / DELETE /api/cart/<cart_id>.

     The server is only told once it can be told right, or a removed line comes
     back on the next syncCart:
     - an add still in flight is waited for, so its line exists server-side;
     - the line's cart_id and quantity are read from the account's cart
       (GET /api/cart) rather than trusted from local state, which may have no
       cart_id (the add 429'd, or hadn't answered yet) or a quantity the server
       hasn't seen (a debounced − / +);
     - a 429 is waited out and retried (lib/retry.ts); any other failure is
       put back and the shopper told. */
  const serverLine = useCallback(async (kind: Mode, line: CartLine, token: string, qty = line.qty) => {
    await pendingAdds.current.get(`${kind}:${line.id}`);
    /* The add may have handed back its cart_id while we waited. */
    const cartId = cartsRef.current[kind].find((l) => l.id === line.id)?.cartId ?? line.cartId;
    if (cartId) return { cartId, qty };
    /* No id here (the add failed or never answered with one): look it up — one
       GET, only in this case, since every call counts against the API's limit. */
    const server = await getCartRemote(kind, token);
    const found = server?.find((s) => s.productId === line.productId && (s.variationId ?? null) === (line.variationId ?? null));
    return found?.cartId ? { cartId: found.cartId, qty: found.qty } : null;
  }, []);

  /* − / + taps are coalesced per line: only the quantity it settles on is
     sent, once the taps stop — one request per tap trips the rate limit. */
  const qtyTimers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; serverQty: number }>());
  /** Drops a line's unsent quantity change; returns the quantity the server still has. */
  const cancelQtySync = useCallback((key: string) => {
    const pending = qtyTimers.current.get(key);
    clearTimeout(pending?.timer);
    qtyTimers.current.delete(key);
    return pending?.serverQty;
  }, []);

  const remove = useCallback((id: string) => {
    const kind = mode;
    const line = cartsRef.current[kind].find((l) => l.id === id);
    if (!line) return;
    /* A − / + not yet sent means the server still holds the earlier quantity. */
    const serverQty = cancelQtySync(`${kind}:${id}`) ?? line.qty;
    mutate(kind, (prev) => prev.filter((l) => l.id !== id));
    const token = userRef.current?.token;
    if (!token || !line.productId) return;
    (async () => {
      const target = await serverLine(kind, line, token, serverQty);
      if (!target) return; // the server doesn't hold it — nothing to undo
      const { cartId } = target;
      if ((await removeCartRemote(cartId, target.qty, token)).ok) { refreshCounts(); return; }
      /* Still on the server: put it back here too, rather than have it reappear later. */
      mutate(kind, (prev) => (prev.some((l) => l.id === id) ? prev : [...prev, { ...line, cartId }]));
      say("Couldn't remove that — please try again");
    })();
  }, [mutate, mode, cancelQtySync, serverLine, say, refreshCounts]);

  const clearCart = useCallback((kind: Mode) => {
    mutate(kind, () => []);
    if (kind === "retail") setCoupon(null);
    refreshCounts();
  }, [mutate, refreshCounts]);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { remove(id); return; }
    const kind = mode;
    const next = round(qty);
    const line = cartsRef.current[kind].find((l) => l.id === id);
    if (!line) return;
    mutate(kind, (prev) => prev.map((l) => (l.id === id ? { ...l, qty: next } : l)));
    const token = userRef.current?.token;
    if (!token || !line.productId) return;
    const key = `${kind}:${id}`;
    const serverQty = cancelQtySync(key) ?? line.qty;
    qtyTimers.current.set(key, { serverQty, timer: setTimeout(async () => {
      qtyTimers.current.delete(key);
      const cartId = (await serverLine(kind, line, token))?.cartId;
      if (!cartId) return;
      if (cartsRef.current[kind].find((l) => l.id === id)?.qty !== next) return; // tapped again, or removed, meanwhile
      if (!(await updateCartRemote(cartId, next, token)).ok) say("Couldn't save the new quantity — please try again");
      else refreshCounts();
    }, 500) });
  }, [mutate, mode, remove, cancelQtySync, serverLine, say, refreshCounts]);

  const openLogin = useCallback((reason?: string) => {
    setLoginReason(reason ?? null);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    pending.current = null;
  }, []);

  /* Reads the ref, not `user`: a pending action runs inside `login`, before the
     re-render, and may itself call withLogin (an add that was waiting). */
  const withLogin = useCallback((reason: string, action: () => void) => {
    if (userRef.current) { action(); return; }
    pending.current = action;
    openLogin(reason);
  }, [openLogin]);

  const add: Store["add"] = useCallback((line, m = "retail") => {
    if (m === "retail") { addTo("retail", line); return; }
    withLogin("Log in to add wholesale products to cart", () => addTo("wholesale", line));
  }, [withLogin, addTo]);

  const login = useCallback((u: User) => {
    setUser(u);
    /* Set before the pending action runs, so a wholesale add lands in this account's cart. */
    setWh({ owner: u.mobile, lines: [] });
    setWishlist(EMPTY_WISHLIST);
    setCounts(null);
    /* The pending action (a heart tapped while logged out) runs below, before re-render. */
    userRef.current = u;
    wishlistRef.current = EMPTY_WISHLIST;
    if (u.token) syncWishlist(u.token);
    setLoginOpen(false);
    say(`Welcome, ${u.name.split(" ")[0]}`);
    const next = pending.current;
    pending.current = null;
    next?.();
  }, [say, syncWishlist]);

  const updateUser = useCallback((patch: Partial<Pick<User, "name" | "email" | "address">>) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const logout = useCallback(() => {
    setUser(null);
    /* The retail cart now holds the account's lines (syncCart) — they stay on the
       server and come back on the next login; the guest starts with an empty cart. */
    setRetail([]);
    setCoupon(null);
    setWh({ owner: null, lines: [] });
    if (mode === "wholesale") setCartOpen(false);
    setWishlist(EMPTY_WISHLIST);
    setCounts(null);
    wishlistSyncedFor.current = null;
    cartSyncedFor.current = null;
    say("Logged out");
  }, [say, mode]);

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
        productId: p.productId ?? p.live?.id,
      });
      return;
    }
    const rate = wholesaleRate(p);
    if (!rate) { say("This piece isn't sold wholesale"); return; }
    const line = {
      id: p.slug, name: p.name, price: rate.price, unit: p.unit, image: p.images[0].src,
      step: p.cut?.step ?? (p.unit === "metre" ? 0.5 : 1), qty: Math.max(qty ?? 0, rate.minQty),
      href: wholesaleHref(`/product/${p.slug}`), minQty: rate.minQty, productId: p.productId ?? p.live?.id,
    };
    add(line, "wholesale");
  }, [mode, add, say]);


  /** Saves / unsaves a piece in the account's wishlist — POST
      /api/auth/add-to-wishlist or remove-to-wishlist. Nothing is changed
      locally: once the server confirms, the list is re-read from
      GET /api/auth/wishlist, so the heart always shows what the API has. */
  /** `<mode>:<slug>` of hearts whose request hasn't answered yet — a second
      tap meanwhile is ignored, or it would send the same add twice. */
  const favBusy = useRef(new Set<string>());
  const toggleFav = useCallback((p: Product, m: Mode = mode) => {
    withLogin("Log in to save pieces to your wishlist", () => {
      const token = userRef.current?.token;
      const pid = p.productId ?? p.live?.id;
      if (!token || !pid) { say("This piece can't be saved to your wishlist"); return; }
      const busyKey = `${m}:${p.slug}`;
      if (favBusy.current.has(busyKey)) return;
      favBusy.current.add(busyKey);
      const saved = !!wishlistRef.current[m][p.slug];
      setWishlistRemote(token, pid, m === "wholesale", !saved).then(async (r) => {
        if (!r.ok) { say(saved ? "Couldn't remove that — please try again" : "Couldn't save that — please try again"); return; }
        const list = await getWishlist(token);
        if (userRef.current?.token !== token) return; // logged out meanwhile
        if (list.ok) setWishlist(toFavs(list.lists));
        /* The server took the change but its list couldn't be read back: show
           the change it confirmed (in memory only — nothing is stored). */
        else setWishlist((prev) => {
          const next = { ...prev[m] };
          if (saved) delete next[p.slug];
          else next[p.slug] = true;
          return { ...prev, [m]: next };
        });
        say(saved ? "Removed from wishlist" : "Saved to wishlist");
        refreshCounts();
      }).finally(() => favBusy.current.delete(busyKey));
    });
  }, [mode, say, withLogin, refreshCounts]);

  const cart = mode === "wholesale" ? wh.lines : retail;
  const otherCount = (mode === "wholesale" ? retail : wh.lines).length;
  const total = (lines: CartLine[]) => lines.reduce((a, l) => a + l.price * l.qty, 0);
  const subtotal = useMemo(() => total(cart), [cart]);
  /** Free shipping is a retail offer, so it's measured against the retail cart alone. */
  const retailSubtotal = useMemo(() => total(retail), [retail]);

  const value: Store = {
    cart, add, setQty, remove, clearCart, reprice,
    subtotal,
    /* Logged in: the account's count from count-data, once it has answered. */
    count: (user && counts?.cart[mode]) ?? cart.length,
    otherCount,
    shortOfFreeShipping: Math.max(0, site.freeShippingOver - retailSubtotal),
    coupon, setCoupon,
    addProduct,
    user, login, logout, hydrated, updateUser, loginOpen, loginReason, openLogin, closeLogin, withLogin,
    mode, switchMode, href, navItem,
    favs: wishlist[mode], wishlist, toggleFav,
    /* count-data's wishlist count; until it answers, both lists' pieces as
       loaded from the server (syncWishlist). Logged out, no badge. */
    favCount: user ? counts?.wishlist ?? Object.keys(wishlist.retail).length + Object.keys(wishlist.wholesale).length : 0,
    cartOpen, setCartOpen,
    searchOpen, setSearchOpen,
    menuOpen, setMenuOpen,
    toast, say, pulse,
  };

  return (
    <Ctx.Provider value={value}>
      {/* Server-rendered mode marker, so CSS can theme retail vs wholesale pages without a flash. */}
      <span hidden data-shop-mode={mode} />
      {children}
    </Ctx.Provider>
  );
}

/** Lengths come in half metres, so keep one decimal and no float dust. */
const round = (n: number) => Math.round(n * 10) / 10;
