import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";

const PIC = "https://picsum.photos/seed/";

const posts = [
  ["Field note", "Why blue pottery has no clay in it", "saroj-post-pottery",
    "https://www.sarojtextile.com/blogs"],
  ["Care", "What actually makes a block print bleed", "saroj-post-wash",
    "https://www.sarojtextile.com/blogs"],
  ["The counter", "Four metres, and what you can cut from it", "saroj-post-metres",
    "https://www.sarojtextile.com/blogs"],
];

export default function Journal() {
  return (
    <section className="st-sec">
      <div className="st-wrap">
        <Reveal className="st-eyebrow">From the workshop</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">The journal.</Reveal>

        <div className="st-journal">
          {posts.map(([kind, title, seed, href], i) => (
            <Reveal key={title} as="a" href={href} className="st-post" delay={(i + 1) as 1 | 2 | 3}>
              <div className="st-post__ph ph">
                <Photo src={`${PIC}${seed}/800/500`} alt={title} note={`PLACEHOLDER — ${title}`} sizes="380px" />
              </div>
              <div className="st-post__body">
                <span className="st-post__kind">{kind}</span>
                <h3>{title}</h3>
                <span className="st-post__more">Read it <Icon name="right" size={12} strokeWidth={2} /></span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
