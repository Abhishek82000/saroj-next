"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Drives an enter/exit transition: `render` stays true through the exit
 * animation, `shown` flips the `.in` class that actually animates.
 */
export function useTransition(open: boolean, ms = 380) {
  const [render, setRender] = useState(open);
  const [shown, setShown] = useState(false);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setRender(true);
      raf.current = requestAnimationFrame(() => setShown(true));
      return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }
    setShown(false);
    const t = setTimeout(() => setRender(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);

  return { render, shown };
}
