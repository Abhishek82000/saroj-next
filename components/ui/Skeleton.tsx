import type { CSSProperties } from "react";

/**
 * Skeleton loaders. `Sk` is one shimmering block; the page skeletons below
 * are rough outlines of each page, so the layout doesn't jump when the real
 * content arrives. They are used by the routes' loading.tsx files (shown
 * while the server fetches) and by the client pages while the cart loads
 * from storage. All of it is decoration: hidden from screen readers, with a
 * single "Loading" status announced instead.
 */
export function Sk({ w, h, r, className = "", style }: {
  w?: number | string; h?: number | string; r?: number | string; className?: string; style?: CSSProperties;
}) {
  return <span className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** Wraps a skeleton page: busy for assistive tech, which hears "Loading…" once. */
function Shell({ children, label = "Loading", className = "" }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <main id="main" className={`sk-page ${className}`} aria-busy="true">
      <span className="sk-sr" role="status">{label}…</span>
      <div aria-hidden="true">{children}</div>
    </main>
  );
}

/* ---------- parts ---------- */

/** Same footprint as ProdCard: square photo, two-line name, price, button. */
export function SkCard() {
  return (
    <div className="sk-card">
      <Sk className="sk-card__ph" />
      <div className="sk-card__body">
        <Sk h={14} w="92%" />
        <Sk h={14} w="64%" />
        <Sk h={18} w="42%" style={{ marginTop: 8 }} />
        <Sk h={36} r={99} style={{ marginTop: 10 }} />
      </div>
    </div>
  );
}

/** A rail heading and a row of cards, like Rail. */
export function SkRail({ cards = 5 }: { cards?: number }) {
  return (
    <section className="sk-rail st-wrap">
      <Sk h={10} w={170} />
      <Sk h={38} w="min(340px, 70%)" style={{ marginTop: 12 }} />
      <div className="sk-rail__row">
        {Array.from({ length: cards }, (_, i) => <SkCard key={i} />)}
      </div>
    </section>
  );
}

/** A page title block: breadcrumb, heading, one line of copy. */
function SkHead({ center }: { center?: boolean }) {
  return (
    <div className={`sk-head st-wrap${center ? " sk-head--c" : ""}`}>
      <Sk h={10} w={150} />
      <Sk h={44} w="min(420px, 80%)" style={{ marginTop: 16 }} />
      <Sk h={14} w="min(520px, 92%)" style={{ marginTop: 14 }} />
    </div>
  );
}

/* ---------- pages ---------- */

/** Home and the wholesale front page: banner, a strip of round tiles, rails. */
export function HomeSkeleton() {
  return (
    <Shell>
      <div className="st-wrap sk-hero">
        <Sk h={12} w={190} style={{ margin: "0 auto" }} />
        <Sk h={56} w="min(560px, 86%)" style={{ margin: "18px auto 0" }} />
        <Sk h={16} w="min(460px, 80%)" style={{ margin: "16px auto 0" }} />
        <div className="sk-hero__plates">
          <Sk className="sk-hero__plate" /><Sk className="sk-hero__plate sk-hero__plate--c" /><Sk className="sk-hero__plate" />
        </div>
        <div className="sk-swatches">
          {Array.from({ length: 7 }, (_, i) => <Sk key={i} className="sk-swatch" />)}
        </div>
      </div>
      <SkRail />
      <SkRail />
    </Shell>
  );
}

/** The handicraft landing page, in its own rose palette (`hc`): the full-screen dark hero
    with photo columns behind a big left-set title, then the wheel and a rail. */
export function HandicraftSkeleton() {
  return (
    <Shell className="hc sk-page--bleed" label="Loading handicraft">
      <section className="sk-hchero">
        <div className="sk-hchero__cols">
          {Array.from({ length: 5 }, (_, c) => (
            <div key={c} className="sk-hchero__col" style={{ marginTop: c % 2 ? -60 : 0 }}>
              {Array.from({ length: 4 }, (_, i) => <Sk key={i} className="sk--dark sk-hchero__tile" />)}
            </div>
          ))}
        </div>
        <div className="sk-hchero__content">
          <Sk className="sk--dark" h={12} w={260} />
          <Sk className="sk--dark" h="clamp(56px,10vw,150px)" w="min(720px, 86%)" style={{ marginTop: 22 }} />
          <Sk className="sk--dark" h="clamp(56px,10vw,150px)" w="min(560px, 70%)" style={{ marginTop: 12 }} />
          <Sk className="sk--dark" h={16} w="min(480px, 80%)" style={{ marginTop: 26 }} />
          <div className="sk-cta sk-cta--start"><Sk className="sk--dark" h={46} w={170} r={99} /><Sk className="sk--dark" h={46} w={190} r={99} /></div>
        </div>
      </section>
      <div className="st-wrap sk-head sk-head--c" style={{ paddingTop: "clamp(40px,8vw,70px)" }}>
        <Sk h={10} w={150} />
        <Sk h={46} w="min(460px, 80%)" style={{ marginTop: 16 }} />
      </div>
      <div className="st-wrap sk-wheel">
        <Sk className="sk-wheel__side" /><Sk className="sk-wheel__front" /><Sk className="sk-wheel__side" />
      </div>
      <SkRail cards={4} />
    </Shell>
  );
}

/** The wholesale front page: the wide banner, "Every category" as round tiles, then rails. */
export function WholesaleSkeleton() {
  return (
    <Shell className="sk-page--bleed" label="Loading wholesale">
      <Sk className="sk-whbanner" />
      <div className="st-wrap sk-whcats-wrap">
        <Sk h={10} w={130} />
        <Sk h={40} w="min(380px, 76%)" style={{ marginTop: 14 }} />
        <div className="sk-whcats">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="sk-whcat"><Sk className="sk-whcat__ph" /><Sk h={12} w="70%" /></div>
          ))}
        </div>
      </div>
      <SkRail />
      <SkRail />
    </Shell>
  );
}

/**
 * The root loading screen. Next shows the nearest loading boundary it already
 * has, and before a route is prefetched (always, in dev) that is this root one,
 * whatever page is opening. So it picks the skeleton from the address instead
 * of always drawing the home page.
 */
export function RouteSkeleton({ pathname }: { pathname: string }) {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/handicraft") return <HandicraftSkeleton />;
  if (p === "/wholesale-fabric") return <WholesaleSkeleton />;
  if (/^\/(wholesale-fabric\/)?checkout\/status/.test(p)) return <OrderStatusSkeleton />;
  if (/^\/(wholesale-fabric\/)?checkout/.test(p)) return <CartSkeleton checkout />;
  if (/^\/(wholesale-fabric\/)?cart/.test(p)) return <CartSkeleton />;
  if (/^\/(wholesale\/)?product\/|^\/wholesale-fabric\/product\//.test(p)) return <ProductSkeleton />;
  if (/^\/(shop|wholesale|wholesale-fabric\/shop)(\/|$)/.test(p)) return <ListingSkeleton />;
  if (/^\/blog\/.+/.test(p)) return <BlogPostSkeleton />;
  if (p === "/blog") return <BlogListSkeleton />;
  if (p === "/") return <HomeSkeleton />;
  return <PageSkeleton />;
}

/** Shop, category and tag listings: title, filter bar, product grid. */
export function ListingSkeleton() {
  return (
    <Shell label="Loading products">
      <SkHead />
      <div className="st-wrap">
        <div className="sk-bar">
          <Sk h={38} w={110} r={99} /><Sk h={14} w={90} /><Sk h={38} w={170} r={10} style={{ marginLeft: "auto" }} />
        </div>
        <div className="sk-grid">
          {Array.from({ length: 8 }, (_, i) => <SkCard key={i} />)}
        </div>
      </div>
    </Shell>
  );
}

/** More cards appended under a listing while the next page loads. */
export function SkCards({ count = 4 }: { count?: number }) {
  return <>{Array.from({ length: count }, (_, i) => <SkCard key={i} />)}</>;
}

/** Product page: gallery beside the buy box, then tabs and a rail. */
export function ProductSkeleton() {
  return (
    <Shell label="Loading product">
      <div className="st-wrap"><Sk h={10} w={260} style={{ marginTop: 22 }} /></div>
      <div className="st-wrap sk-pd">
        <div className="sk-pd__gallery">
          <Sk className="sk-pd__main" />
          <div className="sk-pd__thumbs">{Array.from({ length: 4 }, (_, i) => <Sk key={i} className="sk-pd__thumb" />)}</div>
        </div>
        <div className="sk-pd__buy">
          <Sk h={10} w={180} />
          <Sk h={40} w="92%" style={{ marginTop: 16 }} />
          <Sk h={40} w="60%" style={{ marginTop: 8 }} />
          <Sk h={30} w={190} style={{ marginTop: 22 }} />
          <Sk h={1} w="100%" style={{ marginTop: 26 }} />
          <Sk h={14} w={160} style={{ marginTop: 26 }} />
          <Sk h={64} w="100%" r={14} style={{ marginTop: 12 }} />
          <div className="sk-pd__chips">{Array.from({ length: 4 }, (_, i) => <Sk key={i} h={50} r={12} />)}</div>
          <div className="sk-pd__cta"><Sk h={56} r={99} style={{ flex: 1 }} /><Sk h={56} w={56} r={99} /></div>
          <div className="sk-pd__trust">{Array.from({ length: 3 }, (_, i) => <Sk key={i} h={78} r={12} />)}</div>
        </div>
      </div>
      <SkRail cards={4} />
    </Shell>
  );
}

/** The journal: title, a featured post, then a grid of posts beside a sidebar. */
export function BlogListSkeleton() {
  return (
    <Shell label="Loading posts">
      <SkHead />
      <div className="st-wrap sk-blog">
        <div>
          <div className="sk-blog__feature"><Sk className="sk-blog__feature-ph" />
            <div className="sk-lines"><Sk h={10} w={120} /><Sk h={30} w="90%" /><Sk h={30} w="70%" /><Sk h={14} w="95%" /><Sk h={14} w="80%" /></div>
          </div>
          <div className="sk-blog__grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="sk-lines"><Sk className="sk-blog__ph" /><Sk h={10} w={90} /><Sk h={20} w="92%" /><Sk h={14} w="80%" /></div>
            ))}
          </div>
        </div>
        <aside className="sk-blog__aside">
          <Sk h={18} w={130} />
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="sk-blog__recent"><Sk w={64} h={64} r={10} /><div className="sk-lines" style={{ flex: 1 }}><Sk h={12} w="90%" /><Sk h={10} w="50%" /></div></div>)}
        </aside>
      </div>
    </Shell>
  );
}

/** One journal post: title block, wide photo, paragraphs. */
export function BlogPostSkeleton() {
  return (
    <Shell label="Loading post">
      <SkHead center />
      <div className="st-wrap sk-post">
        <Sk className="sk-post__ph" />
        {[96, 100, 88, 94, 72, 0, 98, 91, 85, 60].map((w, i) => w
          ? <Sk key={i} h={15} w={`${w}%`} style={{ marginTop: 12 }} />
          : <span key={i} style={{ display: "block", height: 18 }} />)}
      </div>
    </Shell>
  );
}

/** Cart lines with a summary panel — the inner part, for the cart page while the cart loads. */
export function CartBodySkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="sk-co" aria-hidden="true">
      <div className="sk-co__lines">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="sk-co__line">
            <Sk w={92} h={92} r={12} />
            <div className="sk-lines" style={{ flex: 1 }}><Sk h={16} w="80%" /><Sk h={12} w="40%" /><Sk h={34} w={130} r={99} style={{ marginTop: 6 }} /></div>
            <Sk h={18} w={70} />
          </div>
        ))}
      </div>
      <SkSummary />
    </div>
  );
}

/** The checkout form beside the order summary — the inner part, for checkout while the cart loads. */
export function CheckoutBodySkeleton() {
  return (
    <div className="sk-co" aria-hidden="true">
      <div className="sk-co__form">
        <Sk h={20} w={180} />
        <div className="sk-co__fields">{Array.from({ length: 6 }, (_, i) => <Sk key={i} h={48} r={10} className={i === 2 ? "sk-span" : ""} />)}</div>
        <Sk h={20} w={150} style={{ marginTop: 26 }} />
        {Array.from({ length: 3 }, (_, i) => <Sk key={i} h={58} r={12} style={{ marginTop: 10 }} />)}
      </div>
      <SkSummary />
    </div>
  );
}

function SkSummary() {
  return (
    <div className="sk-co__side">
      <Sk h={18} w={140} />
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="sk-co__row"><Sk h={12} w="40%" /><Sk h={12} w="22%" /></div>)}
      <Sk h={1} w="100%" style={{ marginTop: 16 }} />
      <div className="sk-co__row"><Sk h={20} w="30%" /><Sk h={20} w="28%" /></div>
      <Sk h={52} r={99} style={{ marginTop: 18 }} />
    </div>
  );
}

/** Cart and checkout routes before any client code runs: page title, steps, then the body. */
export function CartSkeleton({ checkout }: { checkout?: boolean }) {
  return (
    <Shell label={checkout ? "Loading checkout" : "Loading your cart"}>
      <div className="st-wrap sk-cohead">
        <Sk h={10} w={140} />
        <div className="sk-cohead__row"><Sk h={40} w={240} /><Sk h={14} w={300} /></div>
      </div>
      <div className="st-wrap" style={{ paddingBlock: "28px 80px" }}>
        {checkout ? <CheckoutBodySkeleton /> : <CartBodySkeleton />}
      </div>
    </Shell>
  );
}

/** The order-status / thank-you page while the payment is checked. */
export function ThankYouSkeleton({ note }: { note?: React.ReactNode }) {
  return (
    <div className="st-wrap sk-ty">
      <Sk w={64} h={64} r="50%" style={{ margin: "0 auto" }} />
      {note ? <div className="sk-ty__note">{note}</div> : <Sk h={34} w="min(380px, 80%)" style={{ margin: "18px auto 0" }} />}
      <Sk h={14} w="min(440px, 86%)" style={{ margin: "14px auto 0" }} />
      <div className="sk-ty__card" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="sk-co__row"><Sk h={14} w="35%" /><Sk h={14} w="25%" /></div>)}
        <Sk h={1} w="100%" style={{ marginTop: 14 }} />
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="sk-co__line"><Sk w={60} h={60} r={10} /><div className="sk-lines" style={{ flex: 1 }}><Sk h={14} w="70%" /><Sk h={12} w="35%" /></div></div>
        ))}
      </div>
    </div>
  );
}

/** Order status route before client code runs. */
export function OrderStatusSkeleton() {
  return <Shell label="Checking your order"><ThankYouSkeleton /></Shell>;
}

/** Plain content pages (FAQ, contact, CMS pages, account). */
export function PageSkeleton() {
  return (
    <Shell>
      <SkHead />
      <div className="st-wrap sk-post" style={{ marginInline: "auto" }}>
        {[94, 100, 86, 0, 97, 90, 78, 0, 92, 64].map((w, i) => w
          ? <Sk key={i} h={15} w={`${w}%`} style={{ marginTop: 12 }} />
          : <span key={i} style={{ display: "block", height: 18 }} />)}
      </div>
    </Shell>
  );
}
