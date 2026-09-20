import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/ui/Photo";
import Rail from "@/components/product/Rail";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogPost } from "@/lib/blogs";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  return pageMeta({
    title: post.name,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.image || undefined,
    type: "article",
  });
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * A single journal post, e.g. /blog/how-to-identify-pure-cotton-fabric — the
 * page the /blog listing and the homepage's Journal teaser link to.
 * GET /api/blogs/<slug> supplies the title, hero image, rich-text body and
 * a few related products for the rail at the bottom.
 */
export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
            <span>{post.name}</span>
          </nav>
          {post.category && <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>{post.category}</span>}
          <h1>{post.name}</h1>
          <p className="st-post__date">{fmt(post.date)}</p>
        </div>
      </div>

      {post.image && (
        <div className="st-wrap">
          <div className="st-blog__hero ph">
            <Photo src={post.image} alt={post.name} sizes="(max-width:900px) 100vw, 900px" priority />
          </div>
        </div>
      )}

      <div className="st-wrap" style={{ paddingTop:"0" }}>
        <article className="st-richtext" dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>

      {post.related.length > 0 && (
        <Rail eyebrow="You might also like" heading="From the counter." items={post.related} />
      )}

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.name, path: `/blog/${slug}` }]),
      ])} />
    </main>
  );
}
