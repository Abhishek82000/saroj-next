"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Renders children at the end of <body> once we're on the client. */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(children, document.body);
}
