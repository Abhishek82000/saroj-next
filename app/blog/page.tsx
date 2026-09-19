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
 * narrows it to one of the categories the API itself hands back. The
 * storefront's own "featured" post leads the page; a sidebar carries the
 * most recent posts and a category picker.
 */
export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam, category } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { posts, categories, activeCategory, page: current, lastPage } = await getBlogList(page, category);
  const pageHref = (n: number) => `/blog?page=${n}${category ? `&category=${encodeURIComponent(category)}` : ""}`;

  const featured = page === 1 ? (posts.find((p) => p.featured) ?? posts[0]) : undefined;
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts;
  const recent = posts.slice(0, 3);

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
          <div className="st-blog__layout">
            <div className="st-blog__main">
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="st-blog__feature">
                  <div className="st-blog__feature-ph ph">
                    <Photo src={featured.image} alt={featured.name} sizes="(max-width:860px) 100vw, 640px" priority />
                  </div>
                  <div className="st-blog__feature-body">
                    {featured.category && <span className="st-post__kind">{featured.category}</span>}
                    <h2>{featured.name}</h2>
                    <p>{featured.excerpt}</p>
                    <span className="st-post__more">Read more <Icon name="right" size={12} strokeWidth={2} /></span>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="st-blog__rest">
                  {rest.map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="st-post">
                      <div className="st-post__ph ph">
                        <Photo src={p.image} alt={p.name} sizes="(max-width:640px) 100vw, 320px" />
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
              )}

              {lastPage > 1 && (
                <nav className="st-pager" aria-label="More posts">
                  {current > 1 && <Link href={pageHref(current - 1)} className="st-btn">Newer</Link>}
                  <span>Page {current} of {lastPage}</span>
                  {current < lastPage && <Link href={pageHref(current + 1)} className="st-btn">Older</Link>}
                </nav>
              )}
            </div>

            <aside className="st-blog__aside">
              <div className="st-blog__widget">
                <h3>Recent posts</h3>
                <div className="st-blog__recent">
                  {recent.map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="st-blog__recent-item">
                      <span className="st-blog__recent-ph ph"><Photo src={p.image} alt={p.name} sizes="52px" /></span>
                      <span>{p.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="st-blog__widget">
                  <h3>Blog categories</h3>
                  <div className="st-blog__cats">
                    <Link href="/blog" className={`st-blog__cat${category ? "" : " on"}`}>All posts</Link>
                    {categories.map((c) => (
                      <Link key={c.category_id} href={`/blog?category=${c.category_slug}`}
                        className={`st-blog__cat${category === c.category_slug ? " on" : ""}`}>
                        {c.category_name}{c.blogs_count != null && ` (${c.blogs_count})`}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])])} />
    </main>
  );
}
