"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Drawer, { DrawerClose } from "@/components/ui/Drawer";
import { useStore } from "./StoreProvider";
import { site } from "@/lib/site";
import { navAccent, resolveHref, type CommonMenuItem } from "@/lib/nav";

export default function MenuDrawer({ navMenu = [] }: { navMenu?: CommonMenuItem[] }) {
  const { menuOpen, setMenuOpen, user, openLogin, logout, href, navItem, mode } = useStore();
  const [openId, setOpenId] = useState<string | number | null>(null);
  const close = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) setOpenId(null);
  }, [menuOpen]);

  const switchLink = navItem({ label: "Wholesale", href: "/wholesale-fabric" });
  const isWholesale = mode === "wholesale";
  const initial = user?.name?.trim().charAt(0).toUpperCase();

  return (
    <Drawer open={menuOpen} onClose={close} label="Menu" className="sm-drawer">
      <div className="sm-head">
        <span className="sm-brand">Saroj Textile</span>
        <DrawerClose onClose={close} label="Close menu" />
      </div>

      <div className="sm-body" data-ready={menuOpen}>
        {/* Retail / Wholesale switch */}
        <div className="sm-switch" role="group" aria-label="Pricing mode">
          {isWholesale ? (
            <Link href={switchLink.href} onClick={close} className="sm-switch__opt">Retail</Link>
          ) : (
            <span className="sm-switch__opt" aria-current="true" data-on="true">Retail</span>
          )}
          {isWholesale ? (
            <span className="sm-switch__opt" aria-current="true" data-on="true">Wholesale</span>
          ) : (
            <Link href={switchLink.href} onClick={close} className="sm-switch__opt">Wholesale</Link>
          )}
        </div>
        {!isWholesale && <p className="sm-switch__note">Wholesale fabric from ₹80 per metre</p>}

        {/* Dynamic menu */}
        <nav className="sm-list" aria-label="Shop by category">
          
          {navMenu.map((m, idx) => {
            const children = m.children ?? [];
            const target = navItem({ label: m.name, href: resolveHref(m) });
            const style = { ["--i" as string]: idx + 1 };

            if (children.length === 0) {
              const accent = navAccent(resolveHref(m), target.label);
              return (
                <Link key={m.id} href={target.href} onClick={close} style={style}
                  className={`sm-row${accent ? ` sm-row--hl sm-row--${accent}` : ""}`}>
                  <span className="sm-row__label">{target.label}</span>
                </Link>
              );
            }

            const expanded = openId === m.id;
            const panelId = `sm-panel-${m.id}`;

            return (
              <div key={m.id} className="sm-group" data-open={expanded} style={style}>
                <button
                  type="button"
                  className="sm-row"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenId(expanded ? null : m.id)}
                >
                  <span className="sm-row__label">{m.name}</span>
                  <span className="sm-plus" aria-hidden="true" />
                </button>

                <div id={panelId} className="sm-panel" role="region" aria-label={m.name}>
                  <div className="sm-panel__inner">
                    {children.map((c) => (
                      <Link
                        key={c.id}
                        href={href(resolveHref(c))}
                        onClick={close}
                        className="sm-sub"
                        tabIndex={expanded ? 0 : -1}
                      >
                        -- {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sm-foot">
          {user ? (
            <div className="sm-user">
              <span className="sm-user__avatar" aria-hidden="true">{initial}</span>
              <span className="sm-user__name">{user.name.split(" ")[0]}</span>
              <button type="button" className="sm-user__out" onClick={() => { logout(); close(); }}>
                Log out
              </button>
            </div>
          ) : (
            <button type="button" className="sm-login" onClick={() => { close(); openLogin(); }}>
              <span>Log in or register</span>
              <small>For wholesale prices and saved pieces</small>
            </button>
          )}

          <p className="sm-addr">
            {site.address.street}, {site.address.city} {site.address.postalCode}
            <br />
            <a href={`tel:${site.phoneRaw}`}>{site.phone}</a>
          </p>
        </div>
      </div>
    </Drawer>
  );
}