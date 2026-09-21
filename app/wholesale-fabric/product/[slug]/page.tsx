import { ProductView } from "../../../product/[slug]/page";

/** /wholesale-fabric/product/<slug> — the ordinary product page, in wholesale mode. */
export { generateMetadata, generateStaticParams } from "../../../product/[slug]/page";
export default function WholesaleProductPage(props: Parameters<typeof ProductView>[0]) {
  return ProductView({ ...props, wholesale: true });
}
