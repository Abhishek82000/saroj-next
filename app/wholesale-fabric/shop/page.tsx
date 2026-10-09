import { ShopView } from "../../shop/page";

/** /wholesale-fabric/shop — the whole counter, at trade rates. The URL flips the
    site into wholesale mode; ShopView prices the first page at wholesale, and only
    pieces with a wholesale price are shown. */
export { generateMetadata } from "../../shop/page";
export default function WholesaleShopPage(props: Parameters<typeof ShopView>[0]) {
  return ShopView({ ...props, wholesale: true });
}
