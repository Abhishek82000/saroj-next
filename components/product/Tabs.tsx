"use client";
import { useState } from "react";
import { faq, photoNotes, washCare } from "@/lib/content";
import type { Product } from "@/lib/types";

const tabs = [
  ["desc", "Description"],
  ["care", "Wash care"],
  ["rev", "Reviews"],
  ["faq", "Questions"],
] as const;

type Key = (typeof tabs)[number][0];

export default function Tabs({ p, onWriteReview }: { p: Product; onWriteReview: () => void }) {
  const [on, setOn] = useState<Key>("desc");

  return (
    <>
      <div className="st-tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={on === key} id={`tab-${key}`} aria-controls={`panel-${key}`}
            className={`st-tab${on === key ? " on" : ""}`} onClick={() => setOn(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className={`st-panel${on === "desc" ? " on" : ""}`} id="panel-desc" role="tabpanel" aria-labelledby="tab-desc">
        <div className="st-panel__grid">
          <div className="st-prose">
            <p>{p.description}</p>
            {p.specs && (
              <p>
                <strong>Weight</strong> — {p.specs[1].value} {p.specs[1].note}.<br />
                <strong>Width</strong> — {p.specs[0].value} {p.specs[0].note}.
              </p>
            )}
          </div>
          <div className="st-note">{photoNotes.map((n) => <p key={n}>{n}</p>)}</div>
        </div>
      </div>

      <div className={`st-panel${on === "care" ? " on" : ""}`} id="panel-care" role="tabpanel" aria-labelledby="tab-care">
        <p className="st-lede" style={{ marginBottom: "1.4rem" }}>
          Hand wash or a gentle machine cycle. Eight things worth doing if you want the colour to stay put.
        </p>
        <div className="st-care">
          {washCare.map(([title, body]) => (
            <div key={title}><b>{title}</b><p>{body}</p></div>
          ))}
        </div>
      </div>

      <div className={`st-panel${on === "rev" ? " on" : ""}`} id="panel-rev" role="tabpanel" aria-labelledby="tab-rev">
        <div className="st-rev">
          <div className="st-rev__score">
            <b>0.0</b>
            <div className="st-rev__stars" aria-hidden="true">★★★★★</div>
            <small>No ratings yet</small>
            <div className="st-bars">
              {[5, 4, 3, 2, 1].map((n) => (
                <div className="st-barrow" key={n}><span>{n}</span><div><i /></div><span>0</span></div>
              ))}
            </div>
          </div>
          <div className="st-rev__empty">
            <h3 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.5rem", margin: "0 0 .5rem" }}>
              Be the first to say how it washed
            </h3>
            <p>Photos of what you stitched are the most useful thing for the next person deciding between this and the base beside it.</p>
            <button type="button" className="st-btn st-btn--solid" onClick={onWriteReview}>Write a review</button>
          </div>
        </div>
      </div>

      <div className={`st-panel${on === "faq" ? " on" : ""}`} id="panel-faq" role="tabpanel" aria-labelledby="tab-faq">
        <div className="st-faq">
          {faq.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </div>
    </>
  );
}
