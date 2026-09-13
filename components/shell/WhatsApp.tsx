import { site } from "@/lib/site";
import Icon from "@/components/ui/Icon";

export default function WhatsApp() {
  return (
    <a className="st-wa" href={`https://wa.me/${site.whatsapp}`} aria-label="WhatsApp the workshop"
      rel="noopener noreferrer" target="_blank">
      <Icon name="whatsapp" size={26} fill="currentColor" strokeWidth={0} />
    </a>
  );
}
