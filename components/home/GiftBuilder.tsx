"use client";
import { useState } from "react";
import { useStore } from "@/components/shell/StoreProvider";
import Reveal from "@/components/ui/Reveal";
import { inr } from "@/lib/site";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
const PIC = "https://picsum.photos/seed/";

const pieces = [
  { label: "Vase & jar", price: 1450, img: PIC + "saroj-shelf-vase/500/500" },
  { label: "Meenakari plate", price: 2900, img: PIC + "saroj-shelf-plate/500/500" },
  { label: "Brass diya", price: 690, img: PIC + "saroj-shelf-diya/500/500" },
  { label: "Lac bangles", price: 450, img: PIC + "saroj-shelf-bangle/500/500" },
];
const cloths = [
  { label: "Ajrakh", img: CDN + "63141785559833.webp" },
  { label: "Kalamkari", img: CDN + "42621785568665.webp" },
  { label: "Indigo", img: CDN + "13001785568370.webp" },
  { label: "Patola", img: CDN + "97721785569096.webp" },
];
const seals = [
  { label: "jute twine", price: 0, kind: "" },
  { label: "lac seal", price: 60, kind: "" },
  { label: "brass tag", price: 120, kind: "brass" },
];

/** Pick a piece, the cloth it gets wrapped in and how it's tied shut. */
export default function GiftBuilder() {
  const { add } = useStore();
  const [piece, setPiece] = useState(0);
  const [cloth, setCloth] = useState(0);
  const [seal, setSeal] = useState(0);

  const total = pieces[piece].price + seals[seal].price;
  const summary = `${pieces[piece].label}, wrapped in ${cloths[cloth].label}, ${seals[seal].label}`;

  return (
    <section className="st-sec st-gift" id="gift">
      <div className="st-wrap st-gift__grid">
        <div className="st-giftstage">
          <div className="st-giftbox">
            <div className="st-giftcloth">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloths[cloth].img} alt={`${cloths[cloth].label} wrapping cloth`} />
            </div>
            {/* <div className="st-giftobj">
              <img src={pieces[piece].img} alt={pieces[piece].label} />
            </div>
            <div className="st-gifttie" />
            <div className={`st-giftseal ${seals[seal].kind}`}>{seals[seal].kind === "brass" ? "❋" : "✦"}</div> */}
          </div>
        </div>

        <div>
          <Reveal className="st-eyebrow">★ The Wrap</Reveal>
          <Reveal as="h2" delay={1} className="st-h2">Build the parcel.</Reveal>
          <Reveal as="p" delay={2} className="st-lede">
            Every order leaves wrapped in offcuts from our own printing. Choose what goes inside it,
            which cloth goes round it and how it’s tied shut.
          </Reveal>

          {/* <div style={{ marginTop: "2rem" }}>
            <div className="st-giftrow">
              <div className="st-giftrow__lbl">What goes in <b>01</b></div>
              <div className="st-opts">
                {pieces.map((p, i) => (
                  <button key={p.label} className={`st-opt${i === piece ? " on" : ""}`} onClick={() => setPiece(i)}>
                    {p.label}<small>{inr(p.price)}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="st-giftrow">
              <div className="st-giftrow__lbl">The cloth round it <b>02</b></div>
              <div className="st-opts">
                {cloths.map((c, i) => (
                  <button key={c.label} className={`st-opt${i === cloth ? " on" : ""}`} onClick={() => setCloth(i)}>
                    <i><img src={c.img} alt="" /></i>{c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="st-giftrow">
              <div className="st-giftrow__lbl">Tied with <b>03</b></div>
              <div className="st-opts">
                {seals.map((s, i) => (
                  <button key={s.label} className={`st-opt${i === seal ? " on" : ""}`} onClick={() => setSeal(i)}>
                    {s.label}{s.price ? <small>+{inr(s.price)}</small> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="st-gifttotal">
            <div className="st-gifttotal__n">{inr(total)}<small>{summary}</small></div>
            <button className="st-btn st-btn--solid"
              onClick={() => add({
                id: `gift-${piece}-${cloth}-${seal}`,
                name: `Gift parcel — ${summary}`,
                price: total, unit: "parcel", image: pieces[piece].img, step: 1, qty: 1,
              })}>
              Add gift to cart
            </button>
          </div> */}
        </div>
      </div>
    </section>
  );
}
