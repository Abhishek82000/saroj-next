import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";

const BLOG_IMG = "https://www.sarojtextile.com/img/uploads/blogs/";
const BLOG_URL = "https://www.sarojtextile.com/blog/";

const posts = [
  ["How to Identify Pure Cotton Fabric", "how-to-identify-pure-cotton-fabric", "1771871091.webp"],
  ["A Guide to Finding the Perfect Online Fabric Store in India", "a-guide-to-finding-the-perfect-online-fabric-store-in-india", "1765299941.png"],
  ["What makes Kalamkari Fabric special?", "what-makes-kalamkari-fabric-special", "1764345934.webp"],
  ["Why You Should Invest in Jaipuri Cotton Fabric?", "why-you-should-invest-in-jaipuri-cotton-fabric", "1762371064.png"],
  ["Everything You Need to Know About Rayon Fabrics", "everything-you-need-to-know-about-rayon-fabrics", "1759765622.png"],
  ["5 Tips to Buy Pure Cotton Fabric", "5-tips-to-buy-pure-cotton-fabric", "1762400405.webp"],
];

export default function Journal() {
  return (
    <section className="st-sec">
      <div className="st-wrap">
        <Reveal className="st-eyebrow">From the workshop</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">The journal.</Reveal>

        <div className="st-journal">
          {posts.map(([title, slug, image], i) => (
            <Reveal key={slug} as="a" href={BLOG_URL + slug} className="st-post" delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="st-post__ph ph">
                <Photo src={BLOG_IMG + image} alt={title} sizes="380px" />
              </div>
              <div className="st-post__body">
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
