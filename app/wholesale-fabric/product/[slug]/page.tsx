import { permanentRedirect } from "next/navigation";
import { wholesaleProductHref } from "@/lib/wholesale";

/** Old address — wholesale pieces live at /wholesale/product/<slug>. */
export default async function OldWholesaleProductPage({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(wholesaleProductHref((await params).slug));
}
