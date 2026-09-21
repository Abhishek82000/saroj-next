"use client";
import type { ReviewSummary } from "@/lib/types";

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} style={{ color: i <= Math.round(n) ? "var(--ochre)" : "var(--paper-3)" }}>★</span>
    ))}
  </span>
);

/**
 * The real review panel: aggregate, the five-bar breakdown and what people
 * actually wrote. Falls back to the invitation when there's nothing yet.
 */
export default function Reviews({
  reviews, onWrite,
}: { reviews: ReviewSummary; onWrite: () => void }) {
  const { average, total, buckets, items } = reviews;

  return (
    <div className="st-rev">
      <div className="st-rev__score">
        <b>{average.toFixed(1)}</b>
        <div className="st-rev__stars"><Stars n={average} /></div>
        <small>{total === 0 ? "No ratings yet" : `${total} rating${total === 1 ? "" : "s"}`}</small>
        <div className="st-bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(buckets?.[star] ?? 0);
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div className="st-barrow" key={star}>
                <span>{star}</span>
                <div><i style={{ width: `${pct}%` }} /></div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="st-rev__empty">
          <h3 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.5rem", margin: "0 0 .5rem" }}>
            Be the first to say how it washed
          </h3>
          <p>Photos of what you stitched are the most useful thing for the next person deciding between this and the base beside it.</p>
          <button type="button" className="st-btn st-btn--solid" onClick={onWrite}>Write a review</button>
        </div>
      ) : (
        <div>
          <div className="st-rev__list">
            {items.map((r) => (
              <article className="st-revitem" key={r.id}>
                <div className="st-revitem__top">
                  <div className="st-rev__stars"><Stars n={r.rating} /></div>
                  {r.ago && <span className="st-revitem__ago">{r.ago}</span>}
                </div>
                {r.title && <h4>{r.title}</h4>}
                <p>{r.body}</p>
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="st-revitem__img" src={r.image} alt="" loading="lazy" />
                )}
                <span className="st-revitem__verified">Verified customer</span>
              </article>
            ))}
          </div>
          <button type="button" className="st-btn stack-4" onClick={onWrite}>Write a review</button>
        </div>
      )}
    </div>
  );
}
