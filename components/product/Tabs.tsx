"use client";
import { useMemo, useState } from "react";
import Reviews from "./Reviews";
import Icon from "@/components/ui/Icon";
import { photoNotes, washCare } from "@/lib/content";
import { site } from "@/lib/site";
import type { Product, ReviewSummary } from "@/lib/types";

/**
 * Description / Wash care / Reviews / How to do COD, plus any extra tabs the
 * merchandiser added in the admin (product_tabs). The wash-care copy is the
 * same block the Blade hard-codes, kept in lib/content.ts.
 */
export default function Tabs({
  p, reviews, onWriteReview,
}: {
  p: Product;
  reviews?: ReviewSummary;
  onWriteReview: () => void;
}) {
  const live = p.live;

  const tabs = useMemo(() => {
    const base: [string, string][] = [];
    if (live?.descriptionHtml || p.description) base.push(["desc", "Description"]);
    base.push(["care", "Wash care"], ["rev", "Reviews"], ["cod", "How to do COD"]);
    (live?.tabs ?? []).forEach((t, i) => base.push([`extra-${i}`, t.name]));
    return base;
  }, [live, p.description]);

  const [on, setOn] = useState(tabs[0][0]);

  const codHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hi, I'd like to place a COD order for ${p.name}`)}`;

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
        {/* <p className="st-lede" style={{ marginBottom: "1.4rem" }}>
          Hand wash or a gentle machine cycle. Eight things worth doing if you want the colour to stay put.
        </p> */}
        <div className="st-care">
          {washCare.map(([title, body]) => <div key={title}><b>{title}</b><p>{body}</p></div>)}
        </div>
      </div>

      <div className={`st-panel${on === "rev" ? " on" : ""}`} id="panel-rev" role="tabpanel" aria-labelledby="tab-rev">
        <Reviews reviews={summary} onWrite={onWriteReview} />
      </div>

      <div className={`st-panel${on === "cod" ? " on" : ""}`} id="panel-cod" role="tabpanel" aria-labelledby="tab-cod">
        <div className="st-prose">
          <p>We accept COD order but partial.</p>
          <p>Due to past bad experiences, we don&rsquo;t do full COD.</p>
          <p>
            To place COD order, you have to pay <strong>20% of total amount</strong> by any online payment mode
            and <strong>80% amount</strong> will be paid to the courier guy at the time of receipt of courier.
          </p>
          <p>You can send your requirement and images on WhatsApp and we will process the order.</p>
          <a className="st-btn st-btn--solid" href={codHref} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={16} fill="currentColor" strokeWidth={0} /> Order COD on WhatsApp
          </a>
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
