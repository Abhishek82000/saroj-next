import type { Metadata } from "next";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogList } from "@/lib/blogs";
import { site } from "@/lib/site";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: "The Journal",
    description: `Notes on fabric, print and craft from the ${site.name} counter in Jaipur.`,
    path: "/blog",
  });
}

/**
 * The journal's own listing at /blog — the page the footer's "Blog" link
 * and the homepage's Journal teaser both point to. Posts come live from
 * GET /api/blogs; each card links through to /blog/<slug>.
 */
export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt((await searchParams).page ?? "1", 10) || 1);
  const { posts, page: current, lastPage } = await getBlogList(page);

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Blog</span>
          </nav>
          <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>From the workshop</span>
          <h1>The Journal</h1>
          <p>Notes on fabric, print and craft from the counter in Jhotwara.</p>
        </div>
      </div>

      <div className="st-wrap" style={{ paddingBottom: "clamp(50px,8vw,90px)" }}>
        {posts.length === 0 ? (
          <div className="st-empty">
            <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "clamp(1.4rem,5vw,1.9rem)", margin: "0 0 .55rem" }}>
              Nothing posted yet
            </h2>
            <p>Check back soon, or browse the counter instead.</p>
            <Link href="/shop" className="st-btn st-btn--solid">Browse the counter</Link>
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
                {current > 1 && <Link href={`/blog?page=${current - 1}`} className="st-btn">Newer</Link>}
                <span>Page {current} of {lastPage}</span>
                {current < lastPage && <Link href={`/blog?page=${current + 1}`} className="st-btn">Older</Link>}
              </nav>
            )}
          </>
        )}
      </div>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])])} />
    </main>
  );
}
