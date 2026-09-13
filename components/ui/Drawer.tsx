"use client";
import { useEffect, useRef } from "react";
import Portal from "./Portal";
import Icon from "./Icon";
import { useLockedBody } from "./useLockedBody";
import { useTransition } from "./useMounted";

/**
 * Side panel used by the menu, the cart and the mobile filters.
 * Replaces the Bootstrap offcanvas: same look, no framework.
 */
export default function Drawer({
  open, onClose, side = "right", label, className = "", children, footer,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  label: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { render, shown } = useTransition(open);
  const box = useRef<HTMLDivElement>(null);
  useLockedBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    box.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;

  return (
    <Portal>
      <div className={`veil${shown ? " in" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`drawer${side === "left" ? " drawer--left" : ""}${shown ? " in" : ""} ${className}`}
      >
        {children}
        {footer}
      </aside>
    </Portal>
  );
}

export function DrawerClose({ onClose, label = "Close" }: { onClose: () => void; label?: string }) {
  return (
    <button type="button" className="x" onClick={onClose} aria-label={label}>
      <Icon name="close" size={15} strokeWidth={1.6} />
    </button>
  );
}
