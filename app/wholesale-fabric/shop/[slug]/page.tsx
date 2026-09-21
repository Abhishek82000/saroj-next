import { CategoryView } from "../../../shop/[slug]/page";

/** /wholesale-fabric/shop/<category> — the ordinary category page, in wholesale mode. */
export { generateMetadata } from "../../../shop/[slug]/page";
export default function WholesaleCategoryPage(props: Parameters<typeof CategoryView>[0]) {
  return CategoryView({ ...props, wholesale: true });
}
