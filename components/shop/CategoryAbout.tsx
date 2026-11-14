/**
 * A category's long description (`cat_desc`) at the foot of its listing,
 * just above the footer. Renders nothing when the category has none.
 */
export default function CategoryAbout({ title, html }: { title: string; html?: string }) {
  if (!html) return null;
  return (
    <section className="st-sec st-catabout" aria-labelledby="st-catabout-h">
      <div className="st-wrap">
        <span className="st-eyebrow">About the collection</span>
        <h2 id="st-catabout-h" className="st-catabout__h">{title}</h2>
        {/* The admin's own editor output — sanitised on their end, like product descriptions. */}
        <div className="st-richtext" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}
