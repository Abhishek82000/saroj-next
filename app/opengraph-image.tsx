import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated share card, so the palette matches the site rather than a stock photo. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: 80, background: "#F1F3F2", color: "#101820",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#1B5FA8" }}>
          <div style={{ width: 60, height: 2, background: "#1B5FA8" }} />
          Jhotwara, Jaipur
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, lineHeight: 1.02, letterSpacing: -2 }}>Woven, then</div>
          <div style={{ fontSize: 96, lineHeight: 1.02, letterSpacing: -2, color: "#1B5FA8" }}>fired &amp; cast.</div>
          <div style={{ fontSize: 30, color: "#6C7A82", marginTop: 28, maxWidth: 860 }}>
            Hand block printed cotton by the metre, and handicraft from six Jaipur lanes.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#3A4750" }}>
          <span>{site.name}</span>
          <span>Free shipping over ₹2000</span>
        </div>
      </div>
    ),
    size,
  );
}
