"use client";
import { useState } from "react";
import { useStore } from "@/components/shell/StoreProvider";
import { site } from "@/lib/site";

/** No backend to post to yet, so this hands the message to WhatsApp instead
    of silently accepting it — the same approach BuyBox's "Ask about this"
    form takes for the same reason. */
export default function ContactForm() {
  const { say } = useStore();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const send = () => {
    if (!name.trim()) return say("Add your name first");
    if (!contact.trim()) return say("Add a phone or email so we can reply");
    if (!message.trim()) return say("Type your message");

    const text = `Hi, I'm ${name} (${contact}).\n\n${message}`;
    window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
    say("Opening WhatsApp — send it across and we'll reply the same day");
    setName(""); setContact(""); setMessage("");
  };

  return (
    <div className="st-static__card st-contact__form">
      <h2>Send a message</h2>
      <p className="st-lede" style={{ marginTop: ".4rem" }}>
        Fill this in and it opens ready to send on WhatsApp — someone at the Jhotwara counter usually replies the same day.
      </p>
      <label className="st-field"><span>Your name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" /></label>
      <label className="st-field"><span>Phone or email</span>
        <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="95879 86226" /></label>
      <label className="st-field"><span>Message</span>
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="I'm looking for wholesale rates on Ajrakh cotton…" /></label>
      <button type="button" className="st-btn st-btn--solid w-full" onClick={send}>Send on WhatsApp</button>
    </div>
  );
}
