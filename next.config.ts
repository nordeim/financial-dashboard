import type { NextConfig } from "next";

/**
 * Security-header baseline (round 17, live-probed 2026-09-19).
 *
 * The live app's edge (Cloudflare/Caddy) sends Referrer-Policy
 * strict-origin-when-cross-origin, X-Content-Type-Options nosniff and
 * Strict-Transport-Security max-age=31536000 on every response — the
 * clone sent none and leaked X-Powered-By. The trio below is live
 * parity; X-Frame-Options and Permissions-Policy are the standard
 * hardening pair (the app uses none of the gated capabilities — an
 * addition invisible to the body DOM). HSTS over plain HTTP is ignored
 * by spec-compliant browsers, so it is safe unconditionally. CSP is
 * deliberately out of scope (Next's inline scripts would need a nonce
 * strategy — documented as future work in the PAD §6).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
