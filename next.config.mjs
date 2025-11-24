/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Temporarily disable SWC minifier if the build worker crashes on Windows
  // (can be reverted after diagnosing the root cause)
  swcMinify: false,
  pageExtensions: ["ts", "tsx", "js"],
}

export default nextConfig
