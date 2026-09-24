"use client";
import { useState } from "react";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import { wholesaleCategoryHref } from "@/lib/wholesale";
import type { WholesaleCollection } from "@/lib/wholesalePage";

/**
 * A row of collections that sits with every column the same width until the
 * pointer lands on one — that one widens to show its photo and blurb, the
 * rest stay narrow with just a number and a sideways title, and it settles
 * back to equal columns once the pointer leaves the row. On touch, where
 * there's no hover, the first tap opens a column instead of following the
 * link; tapping an already-open one follows it.
 *
 * Builds its own hrefs with wholesaleCategoryHref rather than taking a function prop
 * — a Server Component (WholesaleHome) can't pass a closure into a Client one.
 */
export default function BoltFan({ collections }: { collections: WholesaleCollection[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="st-openbolt" onPointerLeave={(e) => { if (e.pointerType !== "touch") setActive(null); }}>
      {collections.map((c, i) => {
        const on = i === active;
        return (
          <Link
            key={c.id}
            href={wholesaleCategoryHref(c.slug)}
            className={`st-openbolt__item${on ? " on" : ""}`}
            aria-label={c.heading}
            onPointerEnter={(e) => { if (e.pointerType !== "touch") setActive(i); }}
            onFocus={() => setActive(i)}
            onClick={(e) => { if (!on) { e.preventDefault(); setActive(i); } }}
          >
            <span className="st-openbolt__ph ph"><Photo src={c.banner} alt={c.heading} sizes="(min-width:900px) 40vw, 90vw" /></span>
            <span className="st-openbolt__num">{String(i + 1).padStart(2, "0")}</span>
            <span className="st-openbolt__label">
              <b>{c.heading}</b>
              {on && c.blurb && <small>{c.blurb}</small>}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
