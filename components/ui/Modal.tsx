"use client";
import { useEffect } from "react";
import Portal from "./Portal";
import Icon from "./Icon";
import { useLockedBody } from "./useLockedBody";
import { useTransition } from "./useMounted";

export default function Modal({
  open, onClose, title, children, wide, banner,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
  /** A picture across the top in place of the title bar (the close button floats over it). */
  banner?: React.ReactNode;
}) {
  const { render, shown } = useTransition(open, 340);
  useLockedBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;

  return (
    <Portal>
      <div className={`veil${shown ? " in" : ""}`} onClick={onClose} aria-hidden="true" />
      <div className={`modal st-modal${shown ? " in" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__box" style={wide ? { width: "min(100%,760px)" } : undefined}>
          {banner ? (
            <div className="modal__banner">
              {banner}
              <button type="button" className="x" onClick={onClose} aria-label="Close">
                <Icon name="close" size={15} strokeWidth={1.6} />
              </button>
            </div>
          ) : (
            <div className="modal__head">
              <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.5rem", margin: 0 }}>{title}</h2>
              <button type="button" className="x" onClick={onClose} aria-label="Close">
                <Icon name="close" size={15} strokeWidth={1.6} />
              </button>
            </div>
          )}
          <div className="modal__body">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
