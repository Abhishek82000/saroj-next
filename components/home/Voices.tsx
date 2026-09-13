import Reveal from "@/components/ui/Reveal";

const reviews = [
  ["Ordered three metres of the maroon paisley for a kurta. Colour is exactly the photo.", "Priya S", "Jaipur"],
  ["The brass diyas have a weight to them you can feel through the parcel.", "Anand M", "Pune"],
  ["Cut to 4.5 m without any fuss and posted the same day.", "Ritu K", "Delhi"],
  ["Second order. The Ajrakh washed beautifully, no bleeding at all.", "Farida N", "Ahmedabad"],
  ["Blue pottery arrived without a chip. Packed better than most.", "Sameer T", "Bengaluru"],
  ["Wholesale rate on 50 m saved me more than the shipping cost.", "Vikram J", "Surat"],
  ["The meenakari plate is now the only thing on that wall.", "Neha G", "Mumbai"],
  ["They answered on WhatsApp within the hour about shrinkage.", "Lakshmi R", "Chennai"],
];

const Card = ({ text, who, city }: { text: string; who: string; city: string }) => (
  <figure className="st-voice" style={{ margin: 0 }}>
    <div className="st-voice__stars" aria-label="Five stars">★★★★★</div>
    <blockquote style={{ margin: 0 }}><p>{text}</p></blockquote>
    <figcaption className="st-voice__who">
      <span className="st-voice__ini">{who.slice(0, 1)}</span>
      <span><b>{who}</b><br /><small>{city}</small></span>
    </figcaption>
  </figure>
);

export default function Voices() {
  const a = reviews.slice(0, 4);
  const b = reviews.slice(4);
  return (
    <section className="st-voices">
      <div className="st-voices__head st-wrap">
        <Reveal className="st-eyebrow">What came back</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">Voices.</Reveal>
      </div>
      <div className="st-vrow st-vrow--a">
        {[...a, ...a].map((r, i) => <Card key={`a${i}`} text={r[0]} who={r[1]} city={r[2]} />)}
      </div>
      <div className="st-vrow st-vrow--b">
        {[...b, ...b].map((r, i) => <Card key={`b${i}`} text={r[0]} who={r[1]} city={r[2]} />)}
      </div>
    </section>
  );
}
