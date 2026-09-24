"use client";
import Link from "next/link";
import Drawer, { DrawerClose } from "@/components/ui/Drawer";
import { useStore } from "./StoreProvider";
import { site } from "@/lib/site";
import { resolveHref, type CommonMenuItem } from "@/lib/nav";

const items = [
  { href: "/shop", label: "Shop all", note: "Everything" },
  { href: "/#wheel", label: "Crafts", note: "06" },
  { href: "/#shelf", label: "The Shelf" },
  { href: "/#new", label: "New this week" },
  { href: "/#reels", label: "See it move", note: "Shop" },
  { href: "/#gift", label: "The Wrap", note: "Build" },
  { href: "/#cloth", label: "Fabrics" },
  { href: "/#making", label: "Making" },
  { href: "/#bulk", label: "Bulk & gifting" },
];

export default function MenuDrawer({ navMenu = [] }: { navMenu?: CommonMenuItem[] }) {
  const { menuOpen, setMenuOpen, user, openLogin, logout, href, navItem, mode } = useStore();
  const close = () => setMenuOpen(false);

  return (
    <Drawer open={menuOpen} onClose={close} label="Menu" className="st-drawer">
      <div className="drawer__head">
        <span className="st-eyebrow">Saroj Textile</span>
        <DrawerClose onClose={close} label="Close menu" />
      </div>
      <div className="drawer__body">
        <div className="st-drawer__acct">
          {user ? (
            <p>Hi, <b>{user.name.split(" ")[0]}</b> · <button type="button" onClick={() => { logout(); close(); }}>Log out</button></p>
          ) : (
            <p><button type="button" onClick={() => { close(); openLogin(); }}>Log in or register</button> for wholesale and saved pieces.</p>
          )}
        </div>
        <nav>
          {items.map((i) => (
            <Link key={i.href} href={href(i.href)} onClick={close}>
              {i.label}{i.note ? <i>{i.note}</i> : null}
            </Link>
          ))}
          <Link href={navItem({ label: "Wholesale", href: "/wholesale-fabric" }).href} onClick={close}>
            {mode === "wholesale" ? "Retail" : <>Wholesale <i>₹80/m</i></>}
          </Link>
        </nav>

        {navMenu.length > 0 && (
          <nav className="st-drawer__cats" aria-label="Shop by category">
            <span className="st-eyebrow" style={{ display: "block", marginTop: "1.7rem" }}>Shop by category</span>
            {navMenu.map((m) => {
              const children = m.children ?? [];
              if (children.length > 0) {
                return (
                  <details key={m.id}>
                    <summary>{m.name}</summary>
                    <div>
                      {children.map((c) => <Link key={c.id} href={href(resolveHref(c))} onClick={close}>{c.name}</Link>)}
                    </div>
                  </details>
                );
              }
              const l = navItem({ label: m.name, href: resolveHref(m) });
              return <Link key={m.id} href={l.href} onClick={close}>{l.label}</Link>;
            })}
          </nav>
        )}

        <p className="st-foot__addr" style={{ marginTop: "1.5rem" }}>
          {site.address.street}, {site.address.city} {site.address.postalCode}<br />
          <a href={`tel:${site.phoneRaw}`} style={{ textDecoration: "underline" }}>{site.phone}</a>
        </p>
      </div>
    </Drawer>
  );
}
