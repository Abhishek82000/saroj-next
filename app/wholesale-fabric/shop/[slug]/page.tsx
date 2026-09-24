import { permanentRedirect } from "next/navigation";
import { wholesaleCategoryHref } from "@/lib/wholesale";

/** Old address — wholesale listings live at /wholesale/<slug>. */
export default async function OldWholesaleCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(wholesaleCategoryHref((await params).slug));
}
