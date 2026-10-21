import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig: NextConfig = {
  // This dashboard is client-side only, so export it as a static site.
  output: 'export',
  ...(isGitHubPages ? { basePath: '/terra', assetPrefix: '/terra/' } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
