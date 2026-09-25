import type { NextConfig } from "next";

/** Where the Laravel storefront lives. */
const API = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://www.sarojtextile.com").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Opening the dev server from another device on the LAN (a phone, say) needs
  // the origin whitelisted, otherwise the HMR websocket is refused and the
  // console fills with "WebSocket connection failed". Run `npm run dev:lan`.
  allowedDevOrigins: ["192.168.1.*", "192.168.0.*", "10.0.0.*", "*.local"],
  images: {
    // Product photography lives on BunnyCDN; the picsum seeds are stand-ins
    // for shots that haven't been taken yet.
    remotePatterns: [
      { protocol: "https", hostname: "saroj-textile-store.b-cdn.net" },
      { protocol: "https", hostname: "www.sarojtextile.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Browser calls (the variant picker, the recently-viewed rail) go to our own
  // origin and get forwarded here. That means no CORS config on the Laravel
  // side, and the API origin never appears in the client bundle.
  async rewrites() {
    return [
      { source: "/api/products/:path*", destination: `${API}/api/products/:path*` },
      { source: "/api/wholesale/:path*", destination: `${API}/api/wholesale/:path*` },
      { source: "/api/search", destination: `${API}/api/search` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
