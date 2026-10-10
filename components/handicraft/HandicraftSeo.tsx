/* Long-form copy for search: real headings and paragraphs in the markup, held in a fixed-height box that scrolls on its own. */
const BLOCKS: { h: string; p: string[] }[] = [
  {
    h: "",
    p: [
      "We believe our everyday surroundings play a big role in our daily mood and functionality, so little things we use every day deserve a little extra charm. Our range of products are designed to bring creativity and beautiful designs together to transform everyday essentials into something special. So whether you are going out, organising your workspace or lifestyle essentials, or thinking of a thoughtful gift, we design to fit naturally into your routine.",
    ],
  },
  {
    h: "",
    p: [
      "Whether it is for retail use or you are looking for a wholesale exporter, we have you covered. We have a wide range of products in 2 categories: paper creations and fabric creations.",
    ],
  },
  {
    h: "Making Sustainable life choices",
    p: [
      "At Saroj, we make our products thoughtfully made for a better future. Our collection brings both paper and fabric together to add beauty, character, and functionality in daily life. From reusable fabric bags and practical organizers to journals, notebooks, and thoughtfully designed gifting essentials, we offer alternatives that encourage people to choose products they can use and enjoy in their daily routines.",
      "We make sustainable products with purpose, appreciating thoughtful designs and making more mindful decisions about what we bring into our lives. With a legacy of three decades in the textile industry and a growing range of handcrafted lifestyle products, we continue to explore new possibilities while keeping creativity at the heart of what we do.",
      "Because thoughtful choices don't have to be complicated. Sometimes, they begin with the everyday things we choose to use.",
    ],
  },
  {
    h: "Prints that speak their beauty",
    p: [
      "Every purchase has a story. Everyone has a different personality and different choices. There is something special about the products that carry tradition and a creative touch. With our handcrafted collection, we celebrate the beauty of colors, patterns, and creativity. From timeless Ajrakh and kalamkari to playful florals and classic paisleys, our collection brings a refreshing twist to everyday essentials.",
      "From smallest keychains to everyday tote bags, our product grabs attention; they deserve it. We create designs that express your unique style and make a statement.",
      "Explore our range and find the classiest product that suits your personality because the product you carry, use, and keep around reflects a lot about you, so they don't deserve to be ordinary.",
    ],
  },
  {
    h: "Paper Dreams & Creative Stuff",
    p: [
      "Welcome to the world of paper creations with journals, notebooks, diaries, bookmarks and creative stationery accessories that make boring works like writing, planning and gifting a little more special.",
      "Writing down your thoughts, Drawing your next big idea or Choosing a thoughtful gift is no longer boring. Fun and creativity are offered on every page of our collection. Our designs are flexible, so we have something for every dreamer, planner and everyone in between.",
    ],
  },
];

export default function HandicraftSeo() {
  return (
    <section className="hc-sec hc-seo" aria-labelledby="hc-seo-title">
      <div className="hc-wrap hc-seo__grid">
        <header className="hc-seo__head">
          <div className="hc-eyebrow">About the craft &amp; the cloth</div>
          <h2 id="hc-seo-title" className="hc-h2">Made for <em> Everyday Use</em></h2>
          <p className="hc-lede">Growing up, we had traditional handmade prints and designs drying all around in the sun of Rajasthan. Our traditional handicraft items represent a significant step toward integrating craft into everyday life.</p>
          
        </header>
        <div className="hc-seo__box" tabIndex={0} aria-label="Handicraft and fabric guide">
          {BLOCKS.map((b, i) => (
            <article key={i} id={`hc-seo-${i}`} className="hc-seo__block">
              <h3>{b.h}</h3>
              {b.p.map((t, j) => <p key={j}>{t}</p>)}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
