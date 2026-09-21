import { permanentRedirect } from "next/navigation";

/** The old /shop/tag/<tag> address — tags now live at /shop/<tag>. */
export default async function TagRedirect({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(`/shop/${(await params).slug}`);
}
