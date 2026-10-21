import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully client-side app (localStorage, no API routes / server data) — emit a
  // static site so Vercel serves plain HTML/JS instead of the Next.js adapter.
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
