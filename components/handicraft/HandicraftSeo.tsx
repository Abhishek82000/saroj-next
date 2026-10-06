/* Long-form copy for search: real headings and paragraphs in the markup, held in a fixed-height box that scrolls on its own. */
const BLOCKS: { h: string; p: string[] }[] = [
  {
    h: "Jaipur handicrafts, made by the kaarigars who carry them",
    p: [
      "Saroj Textile brings Jaipur's living handicrafts online — blue pottery from Kot Jewar, Meenakari enamel from Johari Bazaar, lac and brass from Tripolia Bazaar, carved marble jali from Kishanpole and kathputli puppets from Shilpgram. Every piece is sourced from the families who make it, in the same lanes our block-printed cloth comes from.",
      "Because we buy direct, each handicraft keeps the marks of the hand: small variations in glaze, colour and carving that machine-made décor can't copy. That is what makes a piece of Rajasthani handicraft worth keeping.",
    ],
  },
  {
    h: "Hand block printed fabric from Jaipur, Bagru and Sanganer",
    p: [
      "Our fabric house has printed and dyed cloth in Jaipur for years. The range covers Ajrakh, Kalamkari, Sanganeri butti, Bagru dabu, indigo prints, patola and paisley prints, flower garden collections and hakoba and dobby weaves — mostly on pure cotton that breathes in Indian summers.",
      "Hand block printing is done one stamp at a time with carved wooden blocks. Natural and vegetable dyes such as indigo, madder and iron-rust black give each print its depth, and colours settle further with every wash.",
    ],
  },
  {
    h: "Buy cotton fabric online by the metre",
    p: [
      "Retail customers can buy block printed cotton fabric online by the metre for kurtas, suits, dupattas, quilts, cushion covers and curtains. Choose the print, enter the length you need, and the cloth is cut from the bolt and shipped from Jaipur.",
      "Each product page lists the fabric type, width and care instructions so you know exactly what you are ordering before it is cut.",
    ],
  },
  {
    h: "Wholesale fabric supplier in Jaipur",
    p: [
      "Boutiques, fashion designers, resellers and stores can buy wholesale fabric in full thaans and bulk rolls through our wholesale section. Trade buyers get the same prints as retail, priced for resale, with the option to reorder popular designs.",
      "If you are sourcing Jaipuri printed fabric for a label or a shop, our team can help with availability, quantities and dispatch.",
    ],
  },
  {
    h: "Caring for hand block printed cotton and handicrafts",
    p: [
      "Wash block printed cotton separately in cold water for the first few washes, with a mild detergent, and dry it in shade. A little colour release at first is normal with natural dyes. Iron on the reverse side to protect the print.",
      "Wipe blue pottery and Meenakari with a soft dry cloth, keep brass away from moisture, and dust marble jali with a soft brush. Treated gently, these handicrafts last for generations.",
    ],
  },
  {
    h: "Why buy from Saroj Textile",
    p: [
      "We are a Jaipur fabric store and handicraft house in one: the cloth and the craft come from the same city, the same markets and often the same families. Buying here supports traditional kaarigars directly and keeps Rajasthan's block printing and handicraft skills in work.",
    ],
  },
];

export default function HandicraftSeo() {
  return (
    <section className="hc-sec hc-seo" aria-labelledby="hc-seo-title">
      <div className="hc-wrap hc-seo__grid">
        <header className="hc-seo__head">
          <div className="hc-eyebrow">About the craft &amp; the cloth</div>
          <h2 id="hc-seo-title" className="hc-h2">Jaipur handicraft &amp; <em>block printed fabric.</em></h2>
          <p className="hc-lede">A short guide to what we make, where it comes from and how to look after it.</p>
          
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
