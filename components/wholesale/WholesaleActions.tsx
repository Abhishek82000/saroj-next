"use client";
import { useStore } from "@/components/shell/StoreProvider";
import { site } from "@/lib/site";

/** The buttons under /wholesale-fabric's explainer: log in (the one thing
    wholesale ordering needs) and a line straight to the counter. */
export default function WholesaleActions() {
  const { user, openLogin } = useStore();

  return (
    <div className="st-wh__cta">
      {user ? (
        <p className="st-wh__hi">You’re logged in as <b>{user.name}</b> — pick a category below and add to cart.</p>
      ) : (
        <button type="button" className="st-btn st-btn--solid"
          onClick={() => openLogin("Log in to add wholesale products to cart")}>
          Log in or register
        </button>
      )}
      <a className="st-btn" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
        Talk to the counter
      </a>
    </div>
  );
}
