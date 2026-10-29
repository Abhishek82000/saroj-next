"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { WHOLESALE_HOME } from "@/lib/wholesale";
import { useStore } from "./StoreProvider";

/**
 * The phone's bottom tab bar (hidden from 900px up, where the header has room
 * for everything): Home · Handicraft · Wholesale · Cart. It follows
 * the header's rules — Home and Cart stay in the current mode, the Wholesale
 * tab becomes "Retail" while in wholesale (the store's `navItem`), and Cart
 * opens the drawer. Left out of
 * checkout, which keeps its own Pay button at the bottom.
 */
export default function TabBar() {
  const { count, cartOpen, setCartOpen, href, navItem, mode, withLogin } = useStore();
  const path = usePathname() ?? "/";
  if (/\/checkout(\/|$)/.test(path)) return null;

  const home = href("/");
  const swap = navItem({ label: "Wholesale", href: WHOLESALE_HOME });
  const on = (yes: boolean) => (yes ? "st-tab on" : "st-tab");
  const openCart = () => (mode === "wholesale"
    ? withLogin("Log in to see your wholesale cart", () => setCartOpen(true))
    : setCartOpen(true));

  return (
    <nav className="st-tabbar" aria-label="Quick links">
      <Link href={home} className={on(path === home)} aria-current={path === home ? "page" : undefined}>
        <Icon name="home" size={21} /><span>Home</span>
      </Link>
      <Link href="/handicraft" className={on(path.startsWith("/handicraft"))}>
        <Icon name="textile" size={21} /><span>Handicraft</span>
      </Link>
      <Link href={swap.href} className="st-tab">
        <Icon name="grid" size={21} /><span>{swap.label}</span>
      </Link>
      <button type="button" className={on(cartOpen || /\/cart$/.test(path))} onClick={openCart}
        aria-label={`${mode === "wholesale" ? "Wholesale cart" : "Cart"}, ${count} ${count === 1 ? "item" : "items"}`}>
        <span className="st-tab__ic">
          <Icon name="cart" size={21} />
          <span className={`st-count${count ? " on" : ""}`} aria-hidden="true">{count > 99 ? "99+" : count}</span>
        </span>
        <span>Cart</span>
      </button>
    </nav>
  );
}
