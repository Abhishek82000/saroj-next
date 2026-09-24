import { permanentRedirect } from "next/navigation";
import { WHOLESALE_HOME } from "@/lib/wholesale";

/** /wholesale on its own is just the section's front door. */
export default function WholesaleIndex() {
  permanentRedirect(WHOLESALE_HOME);
}
