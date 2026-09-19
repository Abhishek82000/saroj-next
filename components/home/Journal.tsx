import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import type { BlogSummary } from "@/lib/blogs";

/** Six posts is plenty for a homepage teaser; /blog has the rest. */
export default function Journal({ posts }: { posts: BlogSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="st-sec" style={{paddingBlock:"clamp(28px,5vw,54px)"}}>
      <div className="st-wrap">
        <Reveal className="st-eyebrow">From the workshop</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">The journal.</Reveal>

        <div className="st-journal">
          {posts.slice(0, 6).map((p, i) => (
            <Reveal key={p.id} as="a" href={`/blog/${p.slug}`} className="st-post" delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="st-post__ph ph">
                <Photo src={p.image} alt={p.name} sizes="380px" />
              </div>
              <div className="st-post__body">
                {p.category && <span className="st-post__kind">{p.category}</span>}
                <h3>{p.name}</h3>
                <span className="st-post__more">Read it <Icon name="right" size={12} strokeWidth={2} /></span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
