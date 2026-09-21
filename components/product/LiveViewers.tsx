"use client";
import { useEffect, useState } from "react";

/**
 * "N people are viewing this right now". Same rule as the Blade: a number
 * between 20 and 50, held for three minutes per URL so it doesn't flicker on
 * every navigation. Rendered only after mount, otherwise the server and the
 * client disagree and React throws a hydration error.
 */
export default function LiveViewers() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    const key = "viewers_" + window.location.pathname;
    const expiryKey = key + "_expiry";
    const now = Date.now();

    try {
      const stored = window.localStorage.getItem(key);
      const expiry = Number(window.localStorage.getItem(expiryKey) ?? 0);
      if (stored && now < expiry) { setN(Number(stored)); return; }

      const fresh = Math.floor(Math.random() * 31) + 20;
      window.localStorage.setItem(key, String(fresh));
      window.localStorage.setItem(expiryKey, String(now + 3 * 60 * 1000));
      setN(fresh);
    } catch {
      setN(Math.floor(Math.random() * 31) + 20);
    }
  }, []);

  if (n === null) return null;

  return (
    <span><i className="calm" /> <b>{n} people</b> are viewing this right now</span>
  );
}
