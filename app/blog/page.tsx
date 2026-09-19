import type { Metadata } from "next";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogList } from "@/lib/blogs";
import { site } from "@/lib/site";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

type SearchParams = Promise<{ page?: string; category?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { category } = await searchParams;
  const { activeCategory } = category ? await getBlogList(1, category) : { activeCategory: null };
  const title = activeCategory ? `${activeCategory} — The Journal` : "The Journal";

  return pageMeta({
    title,
    description: `Notes on fabric, print and craft from the ${site.name} counter in Jaipur.`,
    path: category ? `/blog?category=${encodeURIComponent(category)}` : "/blog",
    noIndex: !!category,
  });
}

/**
 * The journal's own listing at /blog — the page the footer's "Blog" link
 * and the homepage's Journal teaser both point to. Posts come live from
 * GET /api/blogs; each card links through to /blog/<slug>. ?category=<slug>
 * narrows it to one of the categories the API itself hands back.
 */
export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam, category } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { posts, categories, activeCategory, page: current, lastPage } = await getBlogList(page, category);
  const pageHref = (n: number) => `/blog?page=${n}${category ? `&category=${encodeURIComponent(category)}` : ""}`;

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Blog</span>
          </nav>
          <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>From the workshop</span>
          <h1>{activeCategory ?? "The Journal"}</h1>
          <p>Notes on fabric, print and craft from the counter in Jhotwara.</p>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="st-wrap">
          <div className="st-crafts" role="group" aria-label="Filter by category">
            <Link href="/blog" className={`st-craft${category ? "" : " on"}`}>
              <span>All posts</span>
            </Link>
            {categories.map((c) => (
              <Link key={c.category_id} href={`/blog?category=${c.category_slug}`}
                className={`st-craft${category === c.category_slug ? " on" : ""}`}>
                <span>{c.category_name}{c.blogs_count != null && <small>{c.blogs_count}</small>}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="st-wrap" style={{ paddingBottom: "clamp(50px,8vw,90px)" }}>
        {posts.length === 0 ? (
          <div className="st-empty">
            <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "clamp(1.4rem,5vw,1.9rem)", margin: "0 0 .55rem" }}>
              Nothing posted here yet
            </h2>
            <p>{category ? "Nothing in this category yet — try another, or see everything." : "Check back soon, or browse the counter instead."}</p>
            {category
              ? <Link href="/blog" className="st-btn st-btn--solid">See all posts</Link>
              : <Link href="/shop" className="st-btn st-btn--solid">Browse the counter</Link>}
          </div>
        ) : (
          <>
            <div className="st-journal">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="st-post">
                  <div className="st-post__ph ph">
                    <Photo src={p.image} alt={p.name} sizes="380px" />
                  </div>
                  <div className="st-post__body">
                    {p.category && <span className="st-post__kind">{p.category}</span>}
                    <h3>{p.name}</h3>
                    <p className="st-post__excerpt">{p.excerpt}</p>
                    <span className="st-post__more">Read it <Icon name="right" size={12} strokeWidth={2} /></span>
                  </div>
                </Link>
              ))}
            </div>

            {lastPage > 1 && (
              <nav className="st-pager" aria-label="More posts">
                {current > 1 && <Link href={pageHref(current - 1)} className="st-btn">Newer</Link>}
                <span>Page {current} of {lastPage}</span>
                {current < lastPage && <Link href={pageHref(current + 1)} className="st-btn">Older</Link>}
              </nav>
            )}
          </>
        )}
      </div>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])])} />
    </main>
  );
}
