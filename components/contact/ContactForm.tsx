"use client";
import { useState } from "react";
import { useStore } from "@/components/shell/StoreProvider";
import { site } from "@/lib/site";
import type { ContactProcessApiResponse } from "@/lib/types";

/** name, mobile and email are required by the API; message is optional there,
    but asked for here since a blank message defeats the point of the form. */
export default function ContactForm() {
  const { say } = useStore();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ name, mobile, email, message }),
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
    <div className="st-static__card st-contact__form">
      <h2>Send a message</h2>
      <p className="st-lede" style={{ marginTop: ".4rem" }}>
        Someone at the Jhotwara counter reads every message — usually answered the same day.
      </p>
      <label className="st-field"><span>Your name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" /></label>
      <label className="st-field"><span>Mobile</span>
        <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="95879 86226" /></label>
      <label className="st-field"><span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
      <label className="st-field"><span>Message</span>
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="I'm looking for wholesale rates on Ajrakh cotton…" /></label>
      <button type="button" className="st-btn st-btn--solid w-full" disabled={sending} onClick={send}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}
