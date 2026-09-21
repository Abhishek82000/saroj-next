"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useStore } from "@/components/shell/StoreProvider";
import { ReviewForm } from "./BuyBox";
import Tabs from "./Tabs";
import type { Faq, Product, ReviewSummary } from "@/lib/types";

/** Description / Wash care / Reviews / Questions, full width under the photo and buy box
    — with the "Write a review" popup the Reviews tab opens. */
export default function ProductTabs({ p, reviews, faqs }: { p: Product; reviews?: ReviewSummary; faqs?: Faq[] }) {
  const { say } = useStore();
  const [review, setReview] = useState(false);

  return (
    <section className="st-wrap st-pdtabs">
      <Tabs p={p} reviews={reviews} faqs={faqs} onWriteReview={() => setReview(true)} />
      <Modal open={review} onClose={() => setReview(false)} title="Write a review">
        <ReviewForm onSent={() => { setReview(false); say("Thanks — posting once we’ve read it"); }} say={say} />
      </Modal>
    </section>
  );
}
