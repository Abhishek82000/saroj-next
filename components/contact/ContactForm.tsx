"use client";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { site } from "@/lib/site";
import type { ContactProcessApiResponse } from "@/lib/types";

const TOPICS = ["Retail order", "Wholesale", "Handicraft", "Something else"];
const PLACEHOLDER: Record<string, string> = {
  "Retail order": "I’d like 3 m of the indigo dabu print…",
  Wholesale: "I’m looking for wholesale rates on Ajrakh cotton…",
  Handicraft: "Do you ship the blue pottery vases outside Rajasthan?",
};

/** name, mobile and email are required by the API; message is optional there,
    but asked for here since a blank message defeats the point of the form. */
export default function ContactForm() {
  const { say } = useStore();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!name.trim()) return say("Add your name first");
    if (!mobile.trim()) return say("Add a phone number so we can call back");
    if (!email.trim()) return say("Add an email so we can reply");
    if (!message.trim()) return say("Type your message");
    if (sending) return;

    setSending(true);
    try {
      const res = await fetch(`${site.url}/api/contact-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        /* The API has no topic field, so the topic leads the message. */
        body: JSON.stringify({ name, mobile, email, message: `[${topic}] ${message.trim()}` }),
      });
      const json: ContactProcessApiResponse = await res.json();
      if (!res.ok || !json.success) {
        const firstError = json.errors ? Object.values(json.errors)[0]?.[0] : undefined;
        say(firstError ?? json.message ?? "Couldn't send that — try WhatsApp instead");
        return;
      }
      say(json.message || "Sent — someone will reply soon");
      setName(""); setMobile(""); setEmail(""); setMessage("");
    } catch {
      say("Couldn't reach us — try WhatsApp instead");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ct-form">
      <span className="ct-form__tag"><Icon name="mail" size={13} strokeWidth={2} /> Write to us</span>
      <h2>Send a message</h2>
      <p className="ct-form__lede">Tell us what you’re after — we reply by phone, WhatsApp or email.</p>

      <div className="ct-topics" role="radiogroup" aria-label="What is it about?">
        {TOPICS.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={topic === t}
            className={`ct-topic${topic === t ? " on" : ""}`} onClick={() => setTopic(t)}>{t}</button>
        ))}
      </div>

      <div className="ct-form__row">
        <label className="st-field"><span>Your name</span>
          <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" /></label>
        <label className="st-field"><span>Mobile</span>
          <input type="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="95879 86226" /></label>
      </div>
      <label className="st-field"><span>Email</span>
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
      <label className="st-field"><span>Message</span>
        <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={PLACEHOLDER[topic] ?? "How can we help?"} /></label>

      <button type="button" className="ct-send" disabled={sending} onClick={send}>
        {sending ? "Sending…" : <>Send message <Icon name="right" size={15} strokeWidth={2} /></>}
      </button>
      <p className="ct-form__note"><Icon name="lock" size={12} strokeWidth={1.8} /> We only use your details to reply to you.</p>
    </div>
  );
}
