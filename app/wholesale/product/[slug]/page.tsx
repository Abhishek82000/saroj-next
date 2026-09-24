import { permanentRedirect } from "next/navigation";
import { productHref } from "@/lib/product-api";

type Params = Promise<{ slug: string }>;

/** Old wholesale product URL. Wholesale lives under /wholesale-fabric (that's
    what switches the site — and the cart — into wholesale mode), so send it there. */
export default async function OldWholesaleProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  permanentRedirect(productHref(slug, true));
}
