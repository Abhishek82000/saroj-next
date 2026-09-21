"use client";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import { useAutoRail } from "@/components/ui/useAutoRail";
import type { BlogSummary } from "@/lib/blogs";

/** Six posts is plenty for a homepage teaser; /blog has the rest. */
export default function Journal({ posts }: { posts: BlogSummary[] }) {
  const shown = posts.slice(0, 6);
  const { rail, nudge, hold } = useAutoRail(shown.length);
  if (posts.length === 0) return null;

  return (
    <section className="st-sec" style={{paddingBlock:"clamp(28px,5vw,54px)"}}>
      <div className="st-wrap">
        <Reveal className="st-eyebrow">From the workshop</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">The journal.</Reveal>
      </div>

      <div className="st-wrap">
        <div className="st-railwrap">
          <button className="st-arrow st-arrow--side st-arrow--prev st-arrow--post" onClick={() => nudge(-1)} aria-label="Scroll left"><Icon name="left" size={16} strokeWidth={1.8} /></button>
          <button className="st-arrow st-arrow--side st-arrow--next st-arrow--post" onClick={() => nudge(1)} aria-label="Scroll right"><Icon name="right" size={16} strokeWidth={1.8} /></button>
          <div className="st-journal st-journal--rail" ref={rail} {...hold}>
            {shown.map((p) => (
              <a key={p.id} href={`/blog/${p.slug}`} className="st-post">
                <div className="st-post__ph ph">
                  <Photo src={p.image} alt={p.name} sizes="380px" />
                </div>
                <div className="st-post__body">
                  {p.category && <span className="st-post__kind">{p.category}</span>}
                  <h3>{p.name}</h3>
                  <span className="st-post__more">Read it <Icon name="right" size={12} strokeWidth={2} /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
