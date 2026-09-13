import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <main id="main" className="st-sec">
      <div className="st-wrap" style={{ maxWidth: "56ch" }}>
        <p className="st-eyebrow">404</p>
        <h1 className="st-h2">That page isn’t on the shelf.</h1>
        <p className="st-lede">
          It may have been renamed, or the piece may have sold out and come off the site.
          The counter is still open.
        </p>
        <div className="row-gap stack-4">
          <Link href="/shop" className="st-btn st-btn--solid">Browse everything</Link>
          <Link href="/" className="st-btn">Back to the front</Link>
        </div>
      </div>
    </main>
  );
}
