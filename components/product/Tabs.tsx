"use client";
import { useMemo, useState } from "react";
import Reviews from "./Reviews";
import { faq as staticFaq, photoNotes, washCare } from "@/lib/content";
import type { Faq, Product, ReviewSummary } from "@/lib/types";

/**
 * Description / Wash care / Reviews / Questions, plus any extra tabs the
 * merchandiser added in the admin (product_tabs). The wash-care copy is the
 * same block the Blade hard-codes, kept in lib/content.ts.
 */
export default function Tabs({
  p, reviews, faqs, onWriteReview,
}: {
  p: Product;
  reviews?: ReviewSummary;
  faqs?: Faq[];
  onWriteReview: () => void;
}) {
  const live = p.live;

  const tabs = useMemo(() => {
    const base: [string, string][] = [];
    if (live?.descriptionHtml || p.description) base.push(["desc", "Description"]);
    base.push(["care", "Wash care"], ["rev", "Reviews"], ["faq", "Questions"]);
    (live?.tabs ?? []).forEach((t, i) => base.push([`extra-${i}`, t.name]));
    return base;
  }, [live, p.description]);

  const [on, setOn] = useState(tabs[0][0]);

  const questions: Faq[] = faqs?.length
    ? faqs
    : staticFaq.map(([title, body]) => ({ title, html: `<p>${body}</p>` }));

  const summary: ReviewSummary = reviews ?? {
    average: 0, total: 0, buckets: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, items: [],
  };

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

      {(live?.descriptionHtml || p.description) && (
        <div className={`st-panel${on === "desc" ? " on" : ""}`} id="panel-desc" role="tabpanel" aria-labelledby="tab-desc">
          <div className="st-panel__grid">
            <div className="st-prose">
              {live?.descriptionHtml
                // Admin-authored copy from the Laravel CMS, not user input.
                ? <div dangerouslySetInnerHTML={{ __html: live.descriptionHtml }} />
                : <p>{p.description}</p>}
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
      )}

      <div className={`st-panel${on === "care" ? " on" : ""}`} id="panel-care" role="tabpanel" aria-labelledby="tab-care">
        <p className="st-lede" style={{ marginBottom: "1.4rem" }}>
          Hand wash or a gentle machine cycle. Eight things worth doing if you want the colour to stay put.
        </p>
        <div className="st-care">
          {washCare.map(([title, body]) => <div key={title}><b>{title}</b><p>{body}</p></div>)}
        </div>
      </div>

      <div className={`st-panel${on === "rev" ? " on" : ""}`} id="panel-rev" role="tabpanel" aria-labelledby="tab-rev">
        <Reviews reviews={summary} onWrite={onWriteReview} />
      </div>

      <div className={`st-panel${on === "faq" ? " on" : ""}`} id="panel-faq" role="tabpanel" aria-labelledby="tab-faq">
        <div className="st-faq">
          {questions.map((q) => (
            <details key={q.title}>
              <summary>{q.title}</summary>
              <div className="st-faq__body" dangerouslySetInnerHTML={{ __html: q.html }} />
            </details>
          ))}
        </div>
      </div>

      {(live?.tabs ?? []).map((t, i) => (
        <div key={t.name} className={`st-panel${on === `extra-${i}` ? " on" : ""}`}
          id={`panel-extra-${i}`} role="tabpanel" aria-labelledby={`tab-extra-${i}`}>
          <div className="st-prose" dangerouslySetInnerHTML={{ __html: t.html }} />
        </div>
      ))}
    </>
  );
}
