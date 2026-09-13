"use client";
import Link from "next/link";
import Drawer, { DrawerClose } from "@/components/ui/Drawer";
import { useStore } from "./StoreProvider";
import { site } from "@/lib/site";

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

export default function MenuDrawer() {
  const { menuOpen, setMenuOpen } = useStore();
  const close = () => setMenuOpen(false);

  return (
    <Drawer open={menuOpen} onClose={close} label="Menu" className="st-drawer">
      <div className="drawer__head">
        <span className="st-eyebrow">Saroj Textile</span>
        <DrawerClose onClose={close} label="Close menu" />
      </div>
      <div className="drawer__body">
        <nav>
          {items.map((i) => (
            <Link key={i.href} href={i.href} onClick={close}>
              {i.label}{i.note ? <i>{i.note}</i> : null}
            </Link>
          ))}
          <a href="https://www.sarojtextile.com/wholesale-fabric">Wholesale <i>₹80/m</i></a>
        </nav>
        <p className="st-foot__addr" style={{ marginTop: "1.5rem" }}>
          {site.address.street}, {site.address.city} {site.address.postalCode}<br />
          <a href={`tel:${site.phoneRaw}`} style={{ textDecoration: "underline" }}>{site.phone}</a>
        </p>
      </div>
    </Drawer>
  );
}
