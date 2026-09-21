import { permanentRedirect } from "next/navigation";

/** The old /wholesale-fabric/shop/tag/<tag> address — tags now live at /wholesale-fabric/shop/<tag>. */
export default async function WholesaleTagRedirect({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(`/wholesale-fabric/shop/${(await params).slug}`);
}
