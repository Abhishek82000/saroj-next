import { site } from "./site";

/** The old storefront origin's uploads folder. The API still builds some image
    links on it (https://www.sarojtextile.com/public/img/uploads/…), but uploads
    made since the API moved to site.api only exist on the new server and the
    CDN, so those links 404 there. */
const OLD_UPLOAD = /^https?:\/\/(?:www\.)?sarojtextile\.com\/(?:public\/)?img\/uploads\/(.+)$/;
const CDN = "https://saroj-textile-store.b-cdn.net";

/** One image link the API sent, pointed somewhere it actually loads: product
    photos at the CDN (where the rest of the API already serves them), any other
    old upload at the API's own origin. Everything else comes back untouched. */
export function fixImage(src: string | null | undefined): string {
  if (!src) return "";
  const old = src.match(OLD_UPLOAD);
  if (!old) return src;
  const path = old[1];
  return path.startsWith("products/") ? `${CDN}/${path}` : `${site.api}/public/img/uploads/${path}`;
}

/** Every old-origin image link anywhere in an API response, fixed in place.
    Run on each response as it's parsed, so no page, card, cart line or banner
    has to remember to. */
export function fixImages<T>(data: T): T {
  if (typeof data === "string") return (OLD_UPLOAD.test(data) ? fixImage(data) : data) as T;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) data[i] = fixImages(data[i]);
    return data;
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k in o) o[k] = fixImages(o[k]);
  }
  return data;
}
