import { permanentRedirect } from "next/navigation";
import { wholesaleCategoryHref } from "@/lib/wholesale";

/** Old address — wholesale tags live at /wholesale/<tag>, same as categories. */
export default async function WholesaleTagRedirect({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(wholesaleCategoryHref((await params).slug));
}
