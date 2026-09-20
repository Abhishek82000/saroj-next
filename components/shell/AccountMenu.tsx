"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "./StoreProvider";

/** The header's account control: a login button when logged out, and once
    logged in a small menu with who you are and log out. */
export default function AccountMenu() {
  const { user, openLogin, logout } = useStore();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!user) {
    return (
      <button className="st-icn" onClick={() => openLogin()} aria-label="Log in or register">
        <Icon name="user" />
      </button>
    );
  }

  return (
    <div className="st-acct" ref={root}>
      <button className="st-icn st-icn--on" onClick={() => setOpen((o) => !o)}
        aria-expanded={open} aria-haspopup="menu" aria-label={`Account — ${user.name}`}>
        {user.name.trim()[0]?.toUpperCase() ?? "•"}
      </button>
      {open && (
        <div className="st-acct__menu" role="menu">
          <div className="st-acct__who">
            <b>{user.name}</b>
            <small>+91 {user.mobile}</small>
            <small>{user.email}</small>
          </div>
          <button type="button" role="menuitem" onClick={() => { logout(); setOpen(false); }}>Log out</button>
        </div>
      )}
    </div>
  );
}
