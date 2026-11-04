import Link from "next/link";
import SiteLink from "@/components/ui/SiteLink";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import { categoryHref } from "@/lib/nav";
import { wholesaleCategoryHref } from "@/lib/wholesale";
import type { CommonFeaturedCategory } from "@/lib/types";

/**
 * A parent category's page (e.g. Tote Bags): its child categories as arched
 * "jharokha" tiles instead of a product list — 18x18, 16*16, 12x12 — each
 * opening that subcategory's own listing. A banded header with a slowly
 * turning block-print rosette sets it apart from a plain product listing.
 */
export default function SubcategoryGrid({ title, lede, subcategories, wholesale }: {
  title: string; lede?: string; subcategories: CommonFeaturedCategory[]; wholesale?: boolean;
}) {
  const hrefFor = wholesale ? wholesaleCategoryHref : categoryHref;
  const t = title.trim();
  const cut = t.lastIndexOf(" ");
  const lead = cut > 0 ? t.slice(0, cut) : "";
  const last = cut > 0 ? t.slice(cut + 1) : t;
  const n = subcategories.length;

  return (
    <>
      <header className="sc-hero">
        <svg className="sc-hero__rosette" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="56" />
          <circle cx="60" cy="60" r="44" strokeDasharray="2 5" />
          <circle cx="60" cy="60" r="30" />
          {Array.from({ length: 12 }, (_, k) => (
            <ellipse key={k} cx="60" cy="23" rx="5" ry="10" transform={`rotate(${k * 30} 60 60)`} />
          ))}
          <circle cx="60" cy="60" r="6" />
        </svg>
        <div className="sc-hero__in">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <SiteLink href="/">Home</SiteLink><span aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>
          <p className="sc-hero__kick">The collection <i aria-hidden="true">◆</i> {n} {n === 1 ? "style" : "styles"}</p>
          <h1 className="sc-hero__title">
            {lead && <>{lead} </>}
            <em>
              {last}
              <svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 11C40 5 88 3 128 7s58 8 68 2" />
              </svg>
            </em>
          </h1>
          <p className="sc-hero__lede">{lede || `Choose a style to see every piece in it, hand block printed in Jaipur.`}</p>
        </div>
      </header>

      <section className="sc-wrap" aria-label={`${title} styles`}>
        <ul className="sc-grid">
          {subcategories.map((c, i) => (
            <Reveal as="li" key={c.id} delay={((i % 4) + 1) as 1 | 2 | 3 | 4} className="sc-cell">
              <Link href={hrefFor(c.slug)} className="sc-card">
                <span className="sc-card__arch">
                  {c.image
                    ? <Photo src={c.image} alt={c.name} sizes="(max-width:560px) 50vw, 300px" priority={i < 4} />
                    : <span className="sc-card__blank" aria-hidden="true">{c.name.charAt(0)}</span>}
                  <span className="sc-card__no" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="sc-card__foot">
                  <span className="sc-card__name">{c.name}</span>
                  <span className="sc-card__cta">
                    <span>Explore</span>
                    <Icon name="right" size={14} strokeWidth={1.8} />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
        <div className="sc-rule" aria-hidden="true"><span /></div>
      </section>
    </>
  );
}
