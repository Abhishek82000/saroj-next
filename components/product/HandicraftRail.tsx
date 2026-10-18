"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { categoryHref } from "@/lib/nav";
import type { HandiCat } from "@/lib/home";

const pad = (n: number) => String(n).padStart(2, "0");
/** A lane needs at least this many tags in one pass, so the loop is wider than the screen with no gap. */
const MIN_SLOTS = 10;
/** Seconds each tag takes to drift its own width; sets the speed no matter how many categories a lane has. */
const SECS_PER_SLOT = 4.2;

/** The two lanes, by `cat_handi_type`. */
const LANES: { type: HandiCat["type"]; title: string }[] = [
  { type: 1, title: "Paper Handicraft" },
  { type: 2, title: "Quilted Handicraft" },
];

/** One pass of a lane: every category, repeated until the pass is wide enough.
    Only the first round is real to assistive tech; the repeats are visual filler. */
const passOf = (cats: HandiCat[]) => {
  const out: { c: HandiCat; copy: boolean }[] = [];
  for (let round = 0; out.length < MIN_SLOTS; round++) for (const c of cats) out.push({ c, copy: round > 0 });
  return out;
};

/**
 * The handicraft bazaar, one screen tall: a lane for paper handicraft
 * (`cat_handi_type` 1) and one for quilted handicraft (2). Under each title
 * its categories hang from a cord like hand-tied shop tags, drifting along in
 * an endless loop, and each tag opens that category's page. Neighbouring
 * lanes run in opposite directions. A lane stops while it is hovered or
 * focused, stops when it is off screen, and doesn't move at all for reduced
 * motion (it becomes a plain scroller instead). A lane with no categories is
 * left out.
 */
export default function HandicraftRail({ cats, id = "handicraft" }: { cats: HandiCat[]; id?: string }) {
  const lanes = LANES.map((l) => ({ ...l, cats: cats.filter((c) => c.type === l.type) })).filter((l) => l.cats.length > 0);
  if (!lanes.length) return null;

  return (
    <section className="hcs" id={id} aria-label="Handicraft" style={{ "--hcs-lanes": lanes.length } as CSSProperties}>
      <span className="hcs__mark" aria-hidden="true">हस्तकला</span>
      <header className="hcs__head">
        <span className="hcs__eyebrow">Shaped by hand · Jaipur</span>
        <h2 className="hcs__title">The craft <em>bazaar.</em></h2>
      </header>
      <div className="hcs__lanes">
        {lanes.map((l, k) => <Lane key={l.type} title={l.title} cats={l.cats} index={k} />)}
      </div>
    </section>
  );
}

function Lane({ title, cats, index }: { title: string; cats: HandiCat[]; index: number }) {
  const rope = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  /* Only drift while the lane is on screen. */
  useEffect(() => {
    const el = rope.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pass = passOf(cats);
  const n = cats.length;
  const style = { "--hcs-dur": `${pass.length * SECS_PER_SLOT}s` } as CSSProperties;
  const titleId = `hcs-lane-${index}`;

  return (
    <div className={`hcs__lane${index % 2 ? " rev" : ""}`} role="group" aria-labelledby={titleId}>
      {/* the lane's own title, above its categories */}
      <div className="hcs__lanehead">
        <div className="hcs__lanetitle">
          <span className="hcs__no">{pad(index + 1)}</span>
          <h3 className="hcs__cat" id={titleId}>{title}</h3>
          <span className="hcs__qty">{n} {n === 1 ? "category" : "categories"}</span>
        </div>
      </div>
      <div className="hcs__rope" ref={rope} data-run={seen || undefined}>
        <ul className="hcs__track" style={style}>
          {/* The pass twice over: the track slides by exactly one pass, then starts again, with no seam. */}
          {[0, 1].map((half) => pass.map(({ c, copy }, k) => (
            <Tag key={`${half}-${k}`} c={c} copy={half === 1 || copy}
              style={{ "--hcs-d": `${-((k * 0.73) % 3.2).toFixed(2)}s` } as CSSProperties} />
          )))}
        </ul>
      </div>
    </div>
  );
}

function Tag({ c, copy, style }: { c: HandiCat; copy: boolean; style: CSSProperties }) {
  const { href } = useStore();

  return (
    <li className="hcs__slot" style={style} aria-hidden={copy || undefined}>
      {/* Repeats stay clickable with the mouse, but are skipped by keyboard and screen readers. */}
      <Link href={href(categoryHref(c.slug))} className="hcs__tag" tabIndex={copy ? -1 : undefined}>
        <span className="hcs__ring" aria-hidden="true" />
        <span className="hcs__img ph">
          {c.image
            ? <Photo src={c.image} alt="" note={c.name} sizes="(max-width:700px) 160px, 260px" />
            /* no picture yet: a block-print stamp with the category's initial */
            : <span className="hcs__blank" aria-hidden="true">{c.name.trim().charAt(0)}</span>}
        </span>
        <span className="hcs__name">{c.name}</span>
        <span className="hcs__go">Explore <Icon name="right" size={13} strokeWidth={2} /></span>
      </Link>
    </li>
  );
}
