import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workaround Next 15 devtools/segment explorer manifest crash in local development.
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false,
  },
}

export default nextConfig
