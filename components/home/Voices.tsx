import Reveal from "@/components/ui/Reveal";

const reviews: [string, string, number][] = [
  ["Ordered three metres of the maroon paisley for a kurta. Colour is exactly the photo.", "Santosh Selam", 5],
  ["The brass diyas have a weight to them you can feel through the parcel.", "Tarun P.", 5],
  ["Cut to 4.5 m without any fuss and posted the same day.", "Suhana", 5],
  ["Second order. The Ajrakh washed beautifully, no bleeding at all.", "Sonam", 5],
  ["Blue pottery arrived without a chip. Packed better than most.", "Amutha Indraraj", 4],
  ["Wholesale rate on 50 m saved me more than the shipping cost.", "Sunshine Ladki", 5],
];

const Card = ({ text, who, rating }: { text: string; who: string; rating: number }) => (
  <figure className="st-voice" style={{ margin: 0 }}>
    <div className="st-voice__stars" aria-label={`${rating} stars`}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</div>
    <blockquote style={{ margin: 0 }}><p>{text}</p></blockquote>
    <figcaption className="st-voice__who">
      <span className="st-voice__ini">{who.slice(0, 1)}</span>
      <span><b>{who}</b><br /><small>Verified buyer</small></span>
    </figcaption>
  </figure>
);

export default function Voices() {
  const a = reviews.slice(0, 3);
  const b = reviews.slice(3);
  return (
    <section className="st-voices">
      <div className="st-voices__head st-wrap">
        <Reveal className="st-eyebrow">What came back</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">Voices.</Reveal>
      </div>
      <div className="st-vrow st-vrow--a">
        {[...a, ...a].map((r, i) => <Card key={`a${i}`} text={r[0]} who={r[1]} rating={r[2]} />)}
      </div>
      <div className="st-vrow st-vrow--b">
        {[...b, ...b].map((r, i) => <Card key={`b${i}`} text={r[0]} who={r[1]} rating={r[2]} />)}
      </div>
    </section>
  );
}
