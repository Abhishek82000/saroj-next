"use client";
import Link from "next/link";

/**
 * Shown when a page couldn't be built — in practice the storefront API being
 * rate-limited or down (see ApiUnavailableError in lib/product-api.ts). It is
 * a 500, never cached as the page, so the next visit tries again.
 */
export default function PageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="st-wrap" style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div style={{ maxWidth: 440 }}>
        <span className="st-eyebrow">Just a moment</span>
        <h1 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "clamp(1.8rem,4vw,2.4rem)", margin: ".5rem 0" }}>
          This page didn&rsquo;t load
        </h1>
        <p style={{ color: "var(--ink-2)", fontWeight: 300, margin: "0 0 1.4rem" }}>
          The counter is busy right now. Try again in a few seconds.
        </p>
        <div style={{ display: "flex", gap: ".6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="st-btn st-btn--solid" onClick={reset}>Try again</button>
          <Link href="/" className="st-btn">Back to the front</Link>
        </div>
      </div>
    </main>
  );
}
