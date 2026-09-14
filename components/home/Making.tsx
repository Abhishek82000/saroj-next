import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";

const PIC = "https://picsum.photos/seed/";

const steps = [
  ["The clay is mixed", "Quartz, fuller's earth and gum — no potter's clay at all, which is why blue pottery rings when you tap it.", "Kot Jewar", "saroj-make-clay"],
  ["The block is cut", "A teak block is carved in reverse, one for every colour in the print.", "Bagru village", "saroj-make-block"],
  ["The colour goes on", "Painted freehand in cobalt oxide, or stamped by hand down the length of the bolt.", "Jhotwara", "saroj-make-colour"],
  ["It goes in the kiln", "One firing only. What comes out is what you get, which is why the rejects pile is honest.", "Kot Jewar", "saroj-make-kiln"],
  ["It's wrapped and posted", "In offcuts from our own printing, then out of the counter in two working days.", "The counter", "saroj-make-wrap"],
];

/** How a piece gets made, in the order it happens — so the numbers earn their place. */
export default function Making() {
  // return (
  //   <section className="st-sec" id="making" style={{ paddingBottom: "clamp(30px,5vw,54px)" }}>
  //     <div className="st-wrap">
  //       <Reveal className="st-eyebrow">From the lanes</Reveal>
  //       <Reveal as="h2" delay={1} className="st-h2">How it’s made.</Reveal>
  //     </div>
  //     <div className="st-wrap">
  //       <div className="st-rail">
  //         {steps.map(([title, body, tag, seed], i) => (
  //           <article className="st-step" key={title}>
  //             <div className="st-step__ph ph">
  //               <Photo src={`${PIC}${seed}/640/480`} alt={title} note={`PLACEHOLDER — ${title.toLowerCase()}`} sizes="320px" />
  //               <span className="st-step__i">{i + 1}</span>
  //             </div>
  //             <div className="st-step__body">
  //               <h3>{title}</h3>
  //               <p>{body}</p>
  //               <span className="st-step__tag">{tag}</span>
  //             </div>
  //           </article>
  //         ))}
  //       </div>
  //     </div>
  //   </section>
  // );
}
