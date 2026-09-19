import { site } from "./site";
import type { FaqsApiResponse } from "./types";

export interface Faq {
  id: number;
  question: string;
  /** Rich-text HTML, rendered as-is in the accordion. */
  html: string;
  /** Tags stripped out — for the FAQPage JSON-LD, which wants plain text. */
  text: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** The storefront's own FAQ list, for /faq and its JSON-LD. Returns an
    empty list on any failure so the page can show its own empty state. */
export async function getFaqs(): Promise<Faq[]> {
  try {
    const res = await fetch(`${site.url}/api/faqs`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json: FaqsApiResponse = await res.json();
    return (json.data?.faqs ?? [])
      .filter((f) => f.faq_status === 1)
      .map((f) => ({ id: f.faq_id, question: f.faq_title, html: f.faq_description, text: stripHtml(f.faq_description) }));
  } catch {
    return [];
  }
}
